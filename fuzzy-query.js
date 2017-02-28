var Q = function() {
  // search root
  var root = document.querySelector('body');

  // Result Class by fuzzy-query
  var QElement = function (node) {
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

    var _dispatchEvent = function (element, type) {
      var event = document.createEvent('HTMLEvents');
      event.initEvent(type, true, true);
      element.dispatchEvent(event);
    }
    
    var _typeElement = function (element, value) {
      if (_isDisabled(element)) { return null; }
      element.value = value;
      _dispatchEvent(element, 'change');
      return element;
    };

    var _clickElement = function (element) {
      if (_isDisabled(element)) { return null; }
      _dispatchEvent(element, 'click');
      return element;
    };

    var _selectElement = function (element) {
      var parent = element.parentElement;
      if (_isDisabled(parent)) { return null; }
      parent.value = element.value;
      _dispatchEvent(parent, 'change');
      return parent;
    };

    var _checkElement = function (element) {
      if (_isDisabled(element)) { return null; }
      element.checked = true;
      _dispatchEvent(element, 'change');
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

  // ---- search methods for fuzzy-query ----

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

  // search children recursively.
  // if elements which is ancestor-descendant relation found, select descendant.
  // if elements which is not ancestor-descendant relation found, select all.
  var findDeeps = function (parent, findMethod, filterMethod, results, index) {
    index = index || 0;
    var candidates = Array.prototype.filter.call(parent.childNodes, function (child) {
      return filterMethod(child);
    });
    var results = candidates.reduce(function (results, candidate) {
      return results.concat(findDeeps(candidate, findMethod, filterMethod));
    }, []);
    if (results.length === 0) {
      if (findMethod(parent)) {
        return [parent];
      } else {
        return [];
      }
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
      }
    );
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
        function (n) { return isVisibleElement(n); }
      );
    }, true);
  };

  var findByTableSelector = function (current, selector) {
    var getParentWithTags = function (node, tags) {
      if (node === root) { return null; }
      var parent = node.parentElement;
      if (
        tags.indexOf(parent.tagName.toLowerCase()) >= 0 &&
        isVisibleElement(parent)
      ) {
        return parent;
      } else {
        return getParentWithTags(parent, tags);
      }
    };
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

    var colInfos = colCandidates.reduce(function (results, candidate) {
      var colElement = getParentWithTags(candidate, colTags);
      if (colElement == null) { return results; }
      var rowElement = colElement.parentElement;
      if (rowTags.indexOf(rowElement.tagName.toLowerCase()) < 0) { return results; }
      var table = getParentWithTags(rowElement, tableTags);
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
          return getParentWithTags(node, rowTags);
        }).filter(function (node) {
          return (node != null);
        });
        candidateCells = candidateCells.concat(rowCandidates.map(function (rowCandidate) {
          return colInfo.positions[colInfo.tableRows.indexOf(rowCandidate)][colInfo.index];
        }));
      });
    } else {
      candidateCells = colInfos.map(function (colInfo) {
        return colInfo.positions[selector.row][colInfo.index];
      });
    }
    return candidateCells.filter(function (cell) { return (cell != null); });
  };

  var getFindMethodBySelector = function (selector) {
    if (isRegExp(selector)) {
      return findLatestsByRegSelector;
    } else if (selector.col != null && selector.row != null) {
      return findByTableSelector;
    } else {
      return findLatestsByQuerySelector;
    }
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
    var results;
    if (isInteger(selectors[selectorIndex])) {
      selectorIndex = selectors.pop();
    }
    // pare down the candidates by selectors
    results = selectors.reduce(function (candidates, selector) {
      var findMethod = getFindMethodBySelector(selector);
      return candidates.reduce(function (nextCandidates, candidateNodes) {
        if (candidateNodes === root) {
          return nextCandidates.concat(findMethod(candidateNodes, selector).map(function (node) {
            return [node];
          }));
        } else {
          var previous = candidateNodes[candidateNodes.length - 1];
          return nextCandidates.concat(findMethod(previous, selector).map(function (node) {
            return candidateNodes.concat([node]);
          }));
        }
      }, []);
    }, [root]);

    // if multiple results found, select one.
    if (selectors.length > 1 && results.length > 1) {
      results = selectLastFirstNode(results);
    }
    if (results[0] && results[0][selectorIndex]) {
      return (new QElement(results[0][selectorIndex]));
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
  module.exports = Q;
}
