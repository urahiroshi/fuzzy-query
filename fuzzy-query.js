var FQ = function() {
  // search root
  var root = document.querySelector('body');

  // Result Class by fuzzy-query
  var FQNode = function (node) {
    // ---- private methods ----

    var isTypable = function (node) {
      return isElementNode(node) && isTargetInput(
          node,
          ['textarea'],
          [
            'text', 'password', 'search', 'tel', 'url', 'email', 'datetime',
            'number'
          ]
        );
    };

    var isSelectable = function (node) {
      return isElementNode(node) && isTargetInput(
          node,
          ['select', 'optgroup', 'datalist'],
          []
        );
    };

    var findLatestByInputMethod = function (current, inputMethodName) {
      var findMethod;
      switch (inputMethodName) {
        case 'type':
          findMethod = isTypable;
          break;
        case 'select':
          findMethod = isSelectable;
          break;
        default:
          break;
      }
      if (!findMethod) {
        return null;
      }
      return findLatest(current, function (node) {
        return findDeep(node, findMethod, isElementNode);
      });
    };

    var _isDisabled = function (element) {
      return (element.getAttribute('disabled') != null);
    };

    var _htmlEvent = function (element, type) {
      var event = document.createEvent('HTMLEvents');
      event.initEvent(type, true, true);
      element.dispatchEvent(event);
    }

    var _mouseEvent = function (element, type) {
      var event = document.createEvent('MouseEvents');
      event.initEvent(type, true, true);
      element.dispatchEvent(event);
    }
    
    var _typeElement = function (element, value) {
      if (_isDisabled(element)) { return null; }
      element.value = value;
      _htmlEvent(element, 'change');
      return element;
    };

    var _clickElement = function (element) {
      if (_isDisabled(element)) { return null; }
      _mouseEvent(element, 'click');
      return element;
    };

    var _selectElement = function (element) {
      var parent = element.parentElement;
      if (_isDisabled(parent) || _isDisabled(element)) { return null; }
      element.selected = true;
      _htmlEvent(parent, 'change');
      return parent;
    };

    var _checkElement = function (element) {
      if (_isDisabled(element)) { return null; }
      element.checked = true;
      _htmlEvent(element, 'change');
      return element;
    };

    var self = this;

    // ---- public methods & members ----

    // node: found Node by fuzzy-query
    // element: found Element (node's parent or itself)
    self.node = node;
    if (node.nodeType === Node.ELEMENT_NODE) {
      self.element = node;
    } else {
      self.element = node.parentElement;
    }

    // click(): click element
    self.click = function () {
      return _clickElement(self.element);
    };

    // type(value): type element by String value
    self.type = function (value) {
      if (isTypable(self.element)) {
        return _typeElement(self.element, value);
      }
      var targetElement = findLatestByInputMethod(self.node, 'type');
      if (targetElement) {
        return _typeElement(targetElement, value);
      } else {
        console.log('No typable element');
      }
      return null;
    };

    // text(): get text content of element
    self.text = function () {
      return self.element.textContent.trim();
    };

    // select(value): select element by RegExp value
    self.select = function (value) {
      var children, i, max;
      if (value) {
        // Set RegExp value to select option in current or latest selectable element.
        // (if set string value, convert regexp value for convenience)
        var parentElement;
        var regValue = (typeof value === 'string') ? new RegExp(value) : value;
        if (isSelectable(self.element)) {
          parentElement = self.element;
        } else {
          parentElement = findLatestByInputMethod(self.node, 'select');
        }
        if (!parentElement) {
          console.warn('No selectable element');
          return;
        }
        children = parentElement.childNodes;
        for(i = 0, max = children.length; i < max; i++) {
          if (
            children[i].nodeType == Node.ELEMENT_NODE &&
            isTargetInput(children[i], ['option']) &&
            matchWith(children[i], regValue)
          ) {
            return _selectElement(children[i]);
          }
        }
        console.warn('No option selected');
      } else {
        // Set no arguments to check this element.
        var isCheckable = function (element) {
          return isTargetInput(element, [], ['radio', 'checkbox']);
        };
        if (isCheckable(self.element)) {
          return _checkElement(self.element);
        } else {
          children = self.element.childNodes;
          for (i = 0, max = children.length; i < max; i++) {
            if (
              children[i].nodeType === Node.ELEMENT_NODE &&
              isCheckable(children[i])
            ) {
              return _checkElement(children[i])
            }
          }
        }
        console.warn('No checkable element');
      }
      return null;
    };

  };

  // ---- helper methods for fuzzy-query ----

  var isVisibleElement = function (node) {
    return (
      isElementNode(node) &&
      (
        node.offsetWidth > 0 ||
        node.offsetHeight > 0 ||
        node.getClientRects().length > 0
      )
    );
  };

  var isElementNode = function (node) {
    return (node.nodeType === Node.ELEMENT_NODE);
  };

  var isTextNode = function (node) {
    return (node.nodeType === Node.TEXT_NODE);
  };

  var isVisibleNode = function (node) {
    return (isVisibleElement(node) || isTextNode(node));
  };

  var innerText = function (element) {
    return element.textContent.trim().replace(/\n/g, ' ').replace(/ +/g, ' ');
  };

  var containsWith = function (element, selector) {
    return selector.test(innerText(element));
  };

  var matchWith = function (element, selector) {
    return (new RegExp('^' + selector.source + '$')).test(innerText(element));
  };

  var querySelectorAll = function (parent, selector) {
    return Array.prototype.filter.call(
      parent.querySelectorAll(selector), function (element) {
        return isVisibleElement(element);
      }
    );
  };

  var isRegExp = function (selector) {
    return (typeof selector === 'object' && selector.toString()[0] === '/');
  };

  var isInteger = function (selector) {
    return Math.round(selector) === selector;
  };

  // check target input element by candidates of bagNames and typeNames.
  var isTargetInput = function (element, tagNames, typeNames) {
    var elemTag = element.tagName.toLowerCase();
    var elemType;
    if (elemTag === 'input') {
      elemType = element.getAttribute('type');
      if (elemType) {
        elemType = elemType.toLowerCase();
      } else {
        elemType = 'text';
      }
    }
    if (tagNames.indexOf(elemTag) >= 0) {
      return true;
    }
    return (elemType && typeNames.indexOf(elemType) >= 0);
  };

  var isHeadingSelector = function (selector) {
    return (selector.heading != null);
  };

  var isGroupMemberSelector = function (selector) {
    return (selector.group != null && selector.member != null);
  };

  var isTableSelector = function (selector) {
    return (selector.col != null && selector.row != null);
  };

  // search children recursively.
  // if elements which is ancestor-descendant relation found, select descendant.
  // if elements which is not ancestor-descendant relation found, select earliest one.
  var findDeep = function (parent, findMethod, filterMethod) {
    var candidates = Array.prototype.filter.call(parent.childNodes, function (child) {
      return filterMethod(child);
    });
    var result;
    for (var i = 0, max = candidates.length; i < max; i++) {
      result = findDeep(candidates[i], findMethod, filterMethod);
      if (result) { return result; }
    }
    if (findMethod(parent)) {
      return parent;
    }
    return null;
  };

  // search later brothers or later brothers of ancestors.
  // if plural elements found, select earliest one.
  var findLatest = function (current, findMethod) {
    var parent = current.parentElement;
    var bros = Array.prototype.filter.call(parent.childNodes, function (child) {
      return (
        child.nodeType === Node.ELEMENT_NODE ||
        child.nodeType === Node.TEXT_NODE
      );
    });
    var result;
    for (var i = bros.indexOf(current) + 1, max = bros.length; i < max; i++) {
      result = findMethod(bros[i]);
      if (result) { return result; }
    }
    if (current.parentElement === root) {
      return null;
    } else {
      return findLatest(current.parentElement, findMethod);
    }
  };

  // ---- finder class ----

  var NodesFinder = function (options) {
    var self = this;

    // ---- private methods ----

    var isSelfOrChild = function (parent, targetNode) {
      if (parent === targetNode) { return true; }
      if (parent.nodeType !== Node.ELEMENT_NODE || parent.childNodes.length === 0) {
        return false;
      }
      return (!Array.prototype.every.call(parent.childNodes, function (child) {
        return !isSelfOrChild(child, targetNode);
      }));
    };

    // search children recursively.
    // if elements which is not ancestor-descendant relation found, select all.
    var findDeeps = function (parent, findMethod, filterMethod, preferDescendant) {
      if (self.isEnded || (self.options.endBy && self.options.endBy === parent)) {
        self.isEnded = true;
        return [];
      }
      var results = [];
      if (!preferDescendant) {
        if (findMethod(parent)) { results.push(parent); }
      }
      results = Array.prototype.reduce.call(
        parent.childNodes,
        function (nextResults, child) {
          if (!filterMethod(child)) {
            if (self.options.endBy && isSelfOrChild(child, self.options.endBy)) {
              self.isEnded = true;
            }
            return nextResults;
          }
          return nextResults.concat(
            findDeeps(child, findMethod, filterMethod, preferDescendant)
          );
        },
        results
      );
      if (preferDescendant && results.length === 0 && !self.isEnded) {
        if (findMethod(parent)) { results.push(parent); }
      }
      return results;
    };

    // search descendant nodes by RegExp selector
    var findDeepsByRegSelector = function (parent, selector) {
      return findDeeps(
        parent,
        // find method
        function (node) {
          return matchWith(node, selector);
        },
        // filter method
        function (node) {
          return (
            isVisibleNode(node) &&
            containsWith(node, selector)
          );
        },
        // if elements which is ancestor-descendant relation found,
        // return descendant elemnet
        true
      );
    };

    // search later brothers or later brothers of ancestors.
    // if containsCurrentChildren=true, search own children.
    // return all nodes which is visibled and matched by findMethod
    var findLatests = function (current, findMethod, containsCurrentChildren) {
      var parent, bros, currentIndex, candidates;
      containsCurrentChildren = containsCurrentChildren || false;
      if (containsCurrentChildren && current.childNodes) {
        candidates = Array.prototype.filter.call(current.childNodes, isVisibleNode);
        parent = current;
      } else {
        parent = current.parentElement;
        bros = Array.prototype.filter.call(parent.childNodes, isVisibleNode);
        currentIndex = bros.indexOf(current);
        candidates = bros.slice(currentIndex + 1);
      }
      candidates = candidates.reduce(function (results, brother) {
        return results.concat(findMethod(brother));
      }, []);
      if (parent === root) {
        return candidates;
      } else {
        return candidates.concat(findLatests(parent, findMethod));
      }
    };

    // search later nodes by RegExp selector
    var findLatestsByRegSelector = function (current, selector) {
      return findLatests(current, function (node) {
        return findDeepsByRegSelector(node, selector);
      }, true);
    };

    // search later nodes by query(String) selector
    var findLatestsByQuerySelector = function (current, selector) {
      var candidates = querySelectorAll(root, selector);
      if (root === current) { return candidates; }
      return findLatests(current, function (node) {
        return findDeeps(
          node,
          // find method
          function (n) { return candidates.indexOf(n) >= 0; },
          // filter method
          function (n) { return isVisibleElement(n); },
          // if elements which is ancestor-descendant relation found,
          // return all elemnets (not prefer descendant).
          false
        );
      }, true);
    };

    var findByTableSelector = function (current, selector) {
      // Get node's ancestor having tags
      // This method called recursively
      var getAncestorWithTags = function (node, tags) {
        if (node === root) { return null; }
        var parent = node.parentElement;
        if (
          tags.indexOf(parent.tagName.toLowerCase()) >= 0 &&
          isVisibleElement(parent)
        ) {
          return parent;
        } else {
          return getAncestorWithTags(parent, tags);
        }
      };
      // Get node's children having tags
      // This method search direct children (not recursively called).
      // This premises <tr>s have <td>s for their direct children.
      var getChildrenWithTags = function (parent, tags) {
        return Array.prototype.filter.call(parent.childNodes, function (node) {
          return (
            node.tagName &&
            tags.indexOf(node.tagName.toLowerCase()) >= 0 &&
            isVisibleElement(node)
          );
        });
      };

      // selector.col need to be selector
      var colCandidates = getFindMethodBySelector(selector.col)(current, selector.col);
      var colTags = ['td', 'th'];
      var rowTags = ['tr'];
      var rowParentTags = ['tbody', 'thead', 'tfoot'];
      var tableTags = ['table'];
      // <tr>s are <table>'s children or grandchildren (children of rowParentTags)
      var getTableRows = function (table) {
        return Array.prototype.reduce.call(table.childNodes, function (results, node) {
          if (!node.tagName || !isVisibleElement(node)) { return results; }
          if (rowTags.indexOf(node.tagName.toLowerCase()) >= 0) {
            return results.concat([node]);
          } else if (rowParentTags.indexOf(node.tagName.toLowerCase()) >= 0) {
            return results.concat(getChildrenWithTags(node, rowTags));
          }
        }, []);
      }

      // Get column's table, rows, cell positions (two-dimensional array of [row][column])
      // (To get column's index, it needs to calculate posigion of cells before target cell.
      //  In passing that, calculate all cell's position for after execution.
      //  But, it potentially doesn't need positions which are shown after target row.
      //  This may be optimized in the future )
      var colInfos = colCandidates.reduce(function (results, candidate) {
        var colElement = getAncestorWithTags(candidate, colTags);
        if (colElement == null) { return results; }
        var rowElement = colElement.parentElement;
        if (rowTags.indexOf(rowElement.tagName.toLowerCase()) < 0) { return results; }
        var table = getAncestorWithTags(rowElement, tableTags);
        if (table == null) { return results; }
        var tableRows = getTableRows(table);
        var positions = tableRows.map(function (_t, _i) { return []; });
        var setPosition = function (rowStart, colStart, cell) {
          var spanToNumber = function (span) {
            if (span === '0' || Number(span) > 1) {
              return Number(span);
            } else {
              return 1;
            }
          };
          rowSpan = spanToNumber(cell.getAttribute('rowspan'));
          colSpan = spanToNumber(cell.getAttribute('colspan'));
          while (positions[rowStart][colStart]) {
            colStart++;
          }
          for (var i = 0; i < rowSpan; i++) {
            for (var j = 0; j < colSpan; j++) {
              positions[rowStart + i][colStart + j] = cell;
            }
          }
          return colStart;
        };
        var candidateColIndex;
        tableRows.forEach(function (tableRow, rowIndex) {
          getChildrenWithTags(tableRow, colTags).forEach(function (cell, cellIndex) {
            var colIndex = setPosition(rowIndex, cellIndex, cell);
            if (cell === colElement) {
              candidateColIndex = colIndex;
            }
          });
        });
        return results.concat([{
          index: candidateColIndex,
          positions: positions,
          table: table,
          tableRows: tableRows
        }])
      }, []);
      
      var candidateCells = [];
      // selector.row needs to be selector or row index number
      if (typeof selector.row !== 'number') {
        var rowFindMethod;
        if (isRegExp(selector.row)) {
          rowFindMethod = findDeepsByRegSelector;
        } else {
          rowFindMethod = querySelectorAll;
        }
        colInfos.forEach(function (colInfo) {
          var rowCandidates = rowFindMethod(colInfo.table, selector.row).map(function (node) {
            return getAncestorWithTags(node, rowTags);
          }).filter(function (node) {
            return (node != null);
          });
          candidateCells = candidateCells.concat(rowCandidates.map(function (rowCandidate) {
            return colInfo.positions[colInfo.tableRows.indexOf(rowCandidate)][colInfo.index];
          }));
        });
      } else {
        candidateCells = colInfos.map(function (colInfo) {
          if (colInfo.positions[selector.row] == null) { return null; }
          return colInfo.positions[selector.row][colInfo.index];
        });
      }
      return candidateCells.filter(function (cell) { return (cell != null); });
    };

    var getFindMethodBySelector = function (selector) {
      if (isRegExp(selector)) {
        return findLatestsByRegSelector;
      } else if (isTableSelector(selector)) {
        return findByTableSelector;
      } else {
        return findLatestsByQuerySelector;
      }
    };

    // ---- initialize Finder -----
    var defaultOptions = {
      // endBy: if this node found, stop finding method.
      endBy: null
    };
    self.options = {};
    options = options || {};
    Object.keys(defaultOptions).forEach(function (optionKey) {
      self.options[optionKey] = options[optionKey] || defaultOptions[optionKey];
    });
    self.isEnded = false;

    // ---- public methods ----
    self.findNodes = function (startNodes, selector) {
      var findMethod = getFindMethodBySelector(selector);
      return findMethod(startNodes, selector);
    };
  };

  var CandidatesFinder = function () {
    self = this;

    // ---- private methods ----

    var domTokenListToArray = function (domTokenList) {
      var array = [];
      for (var i = 0, length = domTokenList.length; i < length; i++) {
        array.push(domTokenList[i]);
      }
      return array;
    };

    // if two elements and this ancestors have same tagName & style & classList,
    // these elements are regarded as same style element.
    var isSameStyle = function (element1, element2) {
      if (element1 === element2) { return true; }
      if (element1.tagName !== element2.tagName) { return false; }
      if (element1.style.cssText !== element2.style.cssText) { return false; }
      var classList1 = domTokenListToArray(element1.classList);
      var classList2 = domTokenListToArray(element2.classList);
      if (!(classList1.every(function (className) {
        return classList2.indexOf(className) >= 0;
      }))) { return false; }
      if (!(classList2.every(function (className) {
        return classList1.indexOf(className) >= 0;
      }))) { return false; }
      if (element1 === root || element2 === root) { return false; }
      return isSameStyle(element1.parentElement, element2.parentElement);
    };

    var getEndNodeByHeadingSelector = function (headingNode, selector) {
      if (headingNode.nodeType !== Node.ELEMENT_NODE) {
        headingNode = headingNode.parentElement;
      }
      return findLatest(headingNode, function(node) {
        return findDeep(
          node,
          // find method
          function (n) { return isSameStyle(headingNode, n); },
          // filter method
          isVisibleElement
        );
      });
    };

    var getEndNodeByGroupMemberSelector = function (memberNode, selector) {
      var groupElements = querySelectorAll(root, selector.group);
      return findLatest(memberNode, function (node) {
        return findDeep(
          node,
          // find method
          function (n) { return groupElements.indexOf(n) >= 0; },
          // filter method
          isVisibleElement
        );
      });
    };

    // set finderOptions for later selectors
    var updateFinderOptions = function (candidate, selector) {
      var candidateNodes = candidate.nodes;
      var selectedNode, endBy;
      if (candidateNodes.length === 0) { return; }
      selectedNode = candidateNodes[candidateNodes.length - 1];
      if (isHeadingSelector(selector)) {
        endBy = getEndNodeByHeadingSelector(selectedNode, selector);
      } else if (isGroupMemberSelector(selector)) {
        endBy = getEndNodeByGroupMemberSelector(selectedNode, selector);
      }
      if (endBy) {
        candidate.finderOptions.endBy = endBy;
      }
    };

    // convert candidates to candidates object list
    var candidateNodesToObj = function (candidateNodes, finderOptions) {
      return {
        nodes: candidateNodes,
        finderOptions: finderOptions || {}
      };
    };

    // Get next candidate nodes by selector.
    //   if current candidates are [{ nodes: [node1, node2] }]
    //     and next nodes node3 & node4 are found, next candidates will be
    //     [{ nodes: [node1, node2, node3] }, { nodes: [node1, node2, node4] }].
    //   if no next candididate nodes found, return [].
    //
    // args: selector is optional (if findMethod needs no selector)
    var next = function (selector) {
      var candidates = self.candidates.reduce(function (nextCandidates, candidate) {
        var candidateNodes = candidate.nodes;
        var finder = new NodesFinder(candidate.finderOptions);
        var previous = ((candidateNodes.length > 0) ?
          candidateNodes[candidateNodes.length - 1] : root
        );
        var addingNodes = finder.findNodes(previous, selector);
        return nextCandidates.concat(addingNodes.map(function (addingNode) {
          var nextCandidateNodes = candidateNodes.concat([addingNode]);
          return candidateNodesToObj(nextCandidateNodes, candidate.finderOptions);
        }));
      }, []);
      self.candidates = candidates;
      return candidates;
    };

    // ---- initialize CandidatesFinder ----
    self.candidates = [{ nodes: [] }];

    // ---- public methods ----

    // Get candidate nodes by selectors.
    // if selectors [selector1, selector2, selector3] and 2 candidate nodes found,
    // it returns such as [[node11, node12, node13], [node21, node22, node23]].
    // (node index is match with selector index)
    self.getCandidateNodesList = function (selectors) {
      selectors.forEach(function (selector) {
        if (isGroupMemberSelector(selector)) {
          next(selector.group);
          next(selector.member);
          self.candidates.forEach(function (candidate) {
            candidate.nodes.splice(candidate.nodes.length - 2, 1);
          });
        } else if (isHeadingSelector(selector)) {
          next(selector.heading);
        } else {
          next(selector);
        }
        self.candidates.forEach(function (candidate) {
          updateFinderOptions(candidate, selector);
        });
      });
      return self.candidates.map(function (candidate) {
        return candidate.nodes;
      });
    };
  };

  // ---- helper method fof main method ----

  // if first node is many (and second node exists), select last one.
  var selectLastFirstNode = function (nodesList) {
    var validPairs = [];
    var firstNode, secondNode;
    var reversedList = nodesList.slice();
    reversedList.reverse();
    reversedList = reversedList.filter(function (nodes) {
      var pairIndex;
      firstNode = nodes[0];
      secondNode = nodes[1];
      pairIndex = validPairs.map(function (nodes) {return nodes.secondNode;}).indexOf(secondNode);
      if (pairIndex < 0) {
        validPairs.push({
          secondNode: secondNode,
          firstNode: firstNode
        });
      } else if (validPairs[pairIndex].firstNode !== firstNode) {
        return false;
      }
      return true;
    });
    reversedList.reverse();
    return reversedList;
  };

  // ---- fuzzy-query main methods ----

  var main = function (selectors) {
    // If target node is node which is not selected finally,
    // Set selector index to last argument.
    var selectorIndex = selectors.length - 1;
    if (isInteger(selectors[selectorIndex])) {
      selectorIndex = selectors.pop();
    }
    var candidatesFinder = new CandidatesFinder();
    var candidates = candidatesFinder.getCandidateNodesList(selectors);

    // if multiple results found, select one.
    if (selectors.length > 1 && candidates.length > 1) {
      candidates = selectLastFirstNode(candidates);
    }
    if (candidates[0] && candidates[0][selectorIndex]) {
      return (new FQNode(candidates[0][selectorIndex]));
    }
    return null;
  };
  // Allow one argument of array or many arguments of string.
  if (Array.isArray(arguments[0])) {
    return main(arguments[0]);
  } else {
    return main(Array.prototype.slice.call(arguments));
  }
};

if (typeof window === 'undefined') {
  module.exports = FQ;
}
