var Q = function() {
  var QElement = function (node) {
    var _typeElement = function (element, value) {
      element.value = value;
      parent.dispatchEvent(new Event('change'));
    };

    var _clickElement = function (element) {
      if ($ && $(element)) {
        $(element).click();
      } else {
        element.click();
      }
    };

    var _selectElement = function (element) {
      var parent = element.parentElement;
      element.selected = true;
      if ($ && $(parent)) {
        $(parent).click();
        $(parent).change();
      } else {
        parent.dispatchEvent(new MouseEvent('click'));
        parent.dispatchEvent(new Event('change'));
      }
    };

    var _checkElement = function (element) {
      element.checked = true;
      parent.dispatchEvent(new MouseEvent('click'));
      if ($ && $(element)) {
        $(element).change();
      } else {
        parent.dispatchEvent(new Event('change'));
      }
    };

    var self = this;
    self.node = node;
    if (node.nodeType === Node.ELEMENT_NODE) {
      self.element = node;
    } else {
      self.element = node.parentElement;
    }

    self.click = function () {
      _clickElement(self.element);
    };

    self.type = function (value) {
      if (isTypable(self.element)) {
        _typeElement(self.element, value);
        return;
      }
      var targetElement = findLatestByInputMethod(self.node, 'type');
      if (targetElement) {
        _typeElement(targetElement, value);
      } else {
        console.log('No typable element');
      }
    };

    self.text = function () {
      return self.element.textContent.trim();
    };

    self.select = function (value) {
      var children, i, max;
      if (value) {
        // Set RegExp value to select option in current or latest selectable element.
        var parentElement;
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
            matchWith(children[i], value)
          ) {
            _selectElement(children[i]);
            return;
          }
        }
        console.warn('No option selected');
      } else {
        // Set no arguments to check this element.
        var isCheckable = function (element) {
          return isTargetInput(element, [], ['radio', 'checkbox']);
        };
        if (isCheckable(self.element)) {
          _checkElement(self.element);
        } else {
          children = self.element.childNodes;
          for (i = 0, max = children.length; i < max; i++) {
            if (
              children[i].nodeType === Node.ELEMENT_NODE &&
              isCheckable(children[i])
            ) {
              _checkElement(children[i])
              return;
            }
          }
        }
        console.warn('No checkable element');
      }
    };

  };

  var root = document.querySelector('body');

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

  var isRegQueryCandidate = function (node) {
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

  var findDeeps = function (parent, findMethod, filterMethod, results) {
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

  // Find nodes having selector in later brothers of current node and ancestors of current node.
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
          isRegQueryCandidate(node) &&
          containsWith(node, selector)
        );
      }
    );
  };

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

  var findLatests = function (current, findMethod) {
    var parent = current.parentElement;
    var bros = Array.prototype.filter.call(parent.childNodes, isRegQueryCandidate);
    var currentIndex = bros.indexOf(current);
    var candidates = bros.slice(currentIndex + 1).reduce(function (results, brother) {
      return results.concat(findMethod(brother));
    }, []);
    if (current.parentElement === root) {
      return candidates;
    } else {
      return candidates.concat(findLatests(current.parentElement, findMethod));
    }
  };

  // Check target input element by candidates of bagNames and typeNames.
  var isTargetInput = function (element, tagNames, typeNames) {
    var elemTag = element.tagName.toLowerCase();
    var elemType;
    if (elemTag === 'input') {
      elemType = element.getAttribute('type').toLowerCase();
    }
    if (tagNames.indexOf(elemTag) >= 0) {
      return true;
    }
    return (typeNames.indexOf(elemType) >= 0);
  };

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

  var findLatestsByRegSelector = function (current, selector) {
    return findLatests(current, function (node) {
      return findDeepsByRegSelector(node, selector);
    });
  };

  var querySelectorAll = function (parent, selector) {
    return Array.prototype.filter.call(
      parent.querySelectorAll(selector), function (element) {
        return isVisibleElement(element);
      }
    );
  };

  var findLatestsByQuerySelector = function (current, selector) {
    var candidates = querySelectorAll(root, selector);
    return findLatests(current, function (node) {
      return findDeeps(
        node,
        // find method
        function (n) { return candidates.indexOf(n) >= 0; },
        // filter method
        function (n) { return isVisibleElement(n); }
      );
    });
  };

  var isRegExp = function (selector) {
    return (typeof selector === 'object' && selector.toString()[0] === '/');
  };

  var isInteger = function (selector) {
    return Math.round(selector) === selector;
  };

  var main = function (selectors) {
    // If target node is node which is not selected finally,
    // Set selector index to last argument.
    var selectorIndex = selectors.length - 1;
    if (isInteger(selectors[selectorIndex])) {
      selectorIndex = selectors.pop();
    }
    var results = selectors.reduce(function (candidates, selector) {
      return candidates.reduce(function (nextCandidates, candidateNodes) {
        var findMethod;
        if (candidateNodes === root) {
          findMethod = (isRegExp(selector)) ? findDeepsByRegSelector : querySelectorAll;
          return nextCandidates.concat(findMethod(candidateNodes, selector).map(function (node) {
            return [node];
          }));
        } else {
          findMethod = (isRegExp(selector)) ? findLatestsByRegSelector : findLatestsByQuerySelector;
          var previous = candidateNodes[candidateNodes.length - 1];
          return nextCandidates.concat(findMethod(previous, selector).map(function (node) {
            return candidateNodes.concat([node]);
          }));
        }
      }, []);
    }, [root]);
    if (results.length > 0 && results[0].length > selectorIndex) {
      return (new QElement(results[0][selectorIndex]));
    } else {
      return null;
    }
  };
  // Allow one argument of array or many arguments of string.
  if (Array.isArray(arguments[0])) {
    return main(arguments[0]);
  } else {
    return main(Array.prototype.slice.call(arguments));
  }
};