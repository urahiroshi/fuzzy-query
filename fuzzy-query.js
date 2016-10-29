var Q = function() {
  var root = document.querySelector('body');

  var containsWith = function (element, selector) {
    return (new RegExp(selector)).test(element.textContent.trim());
  };

  var matchWith = function (element, selector) {
    return (new RegExp('^' + selector + '$')).test(element.textContent.trim());
  }

  var findLatestParents = function (parent, selector) {
    if (containsWith(parent, selector)) {
      var candidates = Array.prototype.filter.call(parent.childNodes, function (child) {
        return (
          child.nodeType === Node.ELEMENT_NODE &&
          containsWith(child, selector)
        );
      });
      if (candidates.length === 0) {
        // No candidates, parent is latest parent.
        if (matchWith(parent, selector)) {
          return [parent];
        } else {
          return [];
        }
      } else {
        // Any candidates, call me recursively.
        return candidates.reduce(function (results, candidate) {
          return results.concat(findLatestParents(candidate, selector));
        }, []);
      }
    } else {
      return [];
    }
  };

  var findLatestElements = function (current, selector) {
    var parent = current.parentElement;
    var bros = Array.prototype.filter.call(parent.childNodes, function (child) {
      return (child.nodeType === Node.ELEMENT_NODE);
    });
    var currentIndex = bros.indexOf(current);
    var candidates = bros.slice(currentIndex + 1).reduce(function (results, brother) {
      return results.concat(findLatestParents(brother, selector));
    }, []);
    if (current.parentElement === root) {
      return candidates;
    } else {
      return candidates.concat(findLatestElements(current.parentElement));
    }
  };

  var main = function (selectors) {
    return selectors.reduce(function (candidates, selector) {
      return candidates.reduce(function (results, candidate) {
        if (candidate === root) {
          return results.concat(findLatestParents(candidate, selector));
        } else {
          return results.concat(findLatestElements(candidate, selector));
        }
      }, []);
    }, [root]);
  };
  return main(Array.prototype.slice.call(arguments));
};