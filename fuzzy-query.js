var Q = function() {
  var QElement = function (node) {
    var _typeElement = function (element, value) {
      element.value = value;
      parent.dispatchEvent(new Event('change'));
    };

    var _clickElement = function (element) {
      element.click();
    };

    var _selectElement = function (element) {
      var parent = element.parentElement;
      element.selected = true;
      parent.dispatchEvent(new MouseEvent('click'));
      parent.dispatchEvent(new Event('change'));
    };

    var _checkElement = function (element) {
      element.checked = true;
      parent.dispatchEvent(new MouseEvent('click'));
      parent.dispatchEvent(new Event('change'));
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
      var targetElement = findLatestByInputMethod(self.node, 'type');
      _typeElement(targetElement, value);
    };

    self.select = function (value) {
      if (value) {
        // Set RegExp value to select option in latest selectable element.
        var parentElement = findLatestByInputMethod(self.node, 'select');
        var children = parentElement.childNodes;
        for(var i = 0, max = children.length; i < max; i++) {
          if (
            children[i].nodeType == Node.ELEMENT_NODE &&
            isTargetInput(children[i], ['option']) &&
            matchWith(children[i], value)
          ) {
            _selectElement(children[i]);
            return;
          }
        }
      } else {
        // Set no arguments to check this element.
        _checkElement(self.element);
      }
    };

  };

  var root = document.querySelector('body');

  var isCandidate = function (node) {
    return (
      node.nodeType === Node.ELEMENT_NODE &&
      (
        // is visible element ?
        node.offsetWidth > 0 ||
        node.offsetHeight > 0 ||
        node.getClientRects().length > 0
      )
    ) || (node.nodeType === Node.TEXT_NODE);
  };

  var innerText = function (element) {
    return element.textContent.trim().replace(/\n/g, ' ').replace(/ +/g, ' ');
  };

  var containsWith = function (element, selector) {
    return (new RegExp(selector)).test(innerText(element));
  };

  var matchWith = function (element, selector) {
    return (new RegExp('^' + selector + '$')).test(innerText(element));
  };

  var findDeep = function (parent, findMethod, filterMethod) {
    if (findMethod(parent)) {
      return parent;
    }
    var candidates = Array.prototype.filter.call(parent.childNodes, function (child) {
      return filterMethod(child);
    });
    var result;
    for (var i = 0, max = candidates.length; i < max; i++) {
      result = findDeep(candidates[i], findMethod, filterMethod);
      if (result) { return result; }
    }
    return null;
  };

  var findDeeps = function (parent, findMethod, filterMethod) {
    var candidates = Array.prototype.filter.call(parent.childNodes, function (child) {
      return filterMethod(child);
    });
    if (candidates.length === 0) {
      // No candidates, parent is latest parent.
      if (findMethod(parent)) {
        return [parent];
      } else {
        return [];
      }
    } else {
      // Any candidates, call me recursively.
      return candidates.reduce(function (results, candidate) {
        return results.concat(findDeeps(candidate, findMethod, filterMethod));
      }, []);
    }
  };

  // Find nodes having selector in later brothers of current node and ancestors of current node.
  var findDeepsBySelector = function (parent, selector) {
    return findDeeps(
      parent,
      // find method
      function (node) {
        return matchWith(node, selector);
      },
      // filter method
      function (node) {
        return (
          isCandidate(node) &&
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
    var bros = Array.prototype.filter.call(parent.childNodes, isCandidate);
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

  var findLatestByInputMethod = function (current, inputMethodName) {
    var findMethod;
    switch (inputMethodName) {
      case 'type':
        findMethod = function (element) {
          return isTargetInput(
            element,
            ['textarea'],
            [
              'text', 'password', 'search', 'tel', 'url', 'email', 'datetime',
              'number'
            ]
          );
        };
        break;
      case 'select':
        findMethod = function (element) {
          return isTargetInput(
            element,
            ['select', 'optgroup', 'datalist'],
            []
          );
        };
        break;
      default:
        break;
    }
    if (!findMethod) {
      return null;
    }
    return findLatest(current, function (node1) {
      return findDeep(node1, findMethod, function (node2) {
        return (node2.nodeType === Node.ELEMENT_NODE);
      });
    });
  };

  var findLatestBySelector = function (current, selector) {
    return findLatest(current, function (node) {
      // TODO: more speedy search
      return findDeepsBySelector(node, selector)[0];
    });
  };

  var findLatestsBySelector = function (current, selector) {
    return findLatests(current, function(node) {
      return findDeepsBySelector(node, selector);
    });
  };

  var main = function (selectors) {
    var nodes = selectors.reduce(function (candidates, selector) {
      return candidates.reduce(function (results, candidate) {
        if (candidate === root) {
          return results.concat(findDeepsBySelector(candidate, selector));
        } else {
          return results.concat(findLatestsBySelector(candidate, selector));
        }
      }, []);
    }, [root]);
    if (nodes.length > 0) {
      return (new QElement(nodes[0]));
    } else {
      return null;
    }
  };
  return main(Array.prototype.slice.call(arguments));
};