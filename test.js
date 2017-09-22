describe('fuzzy-query', function() {
  beforeAll(function () {
    document.body.innerHTML = __html__['test.html'];
  })

  describe('regexp selector', function () {
    it('should work', function () {
      expect(FQ(/apple/).element.id).toBe('ex-regexp-selector');
    });

    it('should select parent element', function () {
      expect(FQ(/strawberry *is *very *sweet/).element.id).toBe(
        'ex-regexp-selector-parent'
      );
    });
  });

  describe('css selector', function () {
    it('should work', function () {
      expect(FQ('.foo-btn').element.id).toBe('ex-css-selector');
    });
  });

  describe('ordered selector', function () {
    it('should work', function () {
      expect(FQ(/mango/, /banana/).element.id).toBe('ex-ordered-selector');
    });

    it('should work by index', function () {
      expect(FQ(/plum/, 'a', /orange/, 1).element.id).toBe('ex-index-ordered-selector');
    });

    it('should select children of previous selector element by regexp selector', function () {
      expect(FQ('.fruits-1', /melon/, /melon/, /melon/).element.id).toBe(
        'ex-search-children'
      );
    });

    it('should select children of previous selector element by css selector', function () {
      expect(FQ('.fruits-1', 'div', 'div', 'div').element.id).toBe(
        'ex-search-children'
      );
    });
  });

  describe('selecting priority', function () {
    it('should select last element in first selector', function () {
      expect(FQ('a', /grape/, 0).element.id).toBe('ex-first-selector-last-element');
    });

    it('should select first element in not first selector', function () {
      expect(FQ(/guava/, 'button').element.id).toBe('ex-other-selector-first-element');
    });
  });

  describe('table selector', function () {
    it('should work', function () {
      expect(FQ({col: /head2/, row: /value1/}, 'input').element.id).toBe('ex-table-selector');
    });

    it('should work by row index', function () {
      expect(FQ({col: /head2/, row: 1}, 'input').element.id).toBe('ex-table-selector');
    });

    it('should work with colspan table', function () {
      expect(FQ({col: /row2/, row: 3}).text()).toBe('cell12');
    });

    it('should work with rowspan table ', function () {
      expect(FQ({col: /row8/, row: /cell21/}).text()).toBe('cell28');
    });

    it('should ignore cell not displayed', function () {
      expect(FQ({col: /row9/, row: /cell11/}).text()).toBe('cell19');
    });
  });

  describe('select action', function () {
    it('should work by regexp', function () {
      FQ(/Selections:/).select('do.*');
      expect(document.querySelector('#ex-selections').value).toBe('animal');
      expect(document.querySelector('#ex-select-by-regexp').selected).toBeTruthy();
    });

    it('should work with option having same value', function () {
      FQ(/Selections:/).select('durian');
      expect(document.querySelector('#ex-selections').value).toBe('fruits');
      expect(document.querySelector('#ex-select-same-value').selected).toBeTruthy();
    });
  });

  describe('heading selector', function () {
    it('should work', function () {
      expect(FQ({ heading: /sky/ }, /foo/).element.id).toBe('ex-heading-selector');
      expect(FQ({ heading: /sky/ }, /foo/, /foo/)).toBe(null);
    });

    it('not regard same heading if style is not matched', function () {
      expect(FQ({ heading: /sea/ }, /foo/, /foo/)).not.toBe(null);
    });

    it('not regard same heading if class is not matched', function () {
      expect(FQ({ heading: /sun/ }, /foo/, /foo/)).not.toBe(null);
    });

    it('not regard same heading if class is not matched', function () {
      expect(FQ({ heading: /sun/ }, /foo/, /foo/)).not.toBe(null);
    });

    it('not regard same heading if tagName is not matched', function () {
      expect(FQ({ heading: /post/ }, /foo/, /foo/)).not.toBe(null);
    });

    it('not regard same heading if different ancestors', function () {
      expect(FQ({ heading: /ruby/ }, /foo/, /foo/)).not.toBe(null);
    });

    it('should work by nested heading selector', function () {
      expect(FQ({ heading: /class A/ }, { heading: /Ken/ }, /male/).element.id).toBe(
        'ex-nested-heading-selector'
      );
      expect(FQ({ heading: /class A/ }, { heading: /Ken/ }, /male/, /male/)).toBe(
        null
      );
      expect(FQ(
        { heading: /class A/ }, { heading: '.student' }, '.name', '.sex', /female/, 2
      ).text()).toBe('Hanako')
    });
  });

  describe('group member selector', function () {
    it('should work', function () {
      expect(FQ({ group: '.colors', member: /sea/}, /foo/).element.id).toBe(
        'ex-group-member-selector'
      );
      expect(FQ({ group: '.colors', member: /sea/}, /foo/, /foo/)).toBe(null);
    });

    it('not regard same group if group selector not matched', function () {
      expect(FQ({ group: '.natural', member: /sun/}, /foo/, /foo/).element.id).toBe(
        'ex-not-same-group'
      );
    });

    it('should work by nested group member selector', function () {
      expect(
        FQ(
          { group: '.classroom', member: /class A/ },
          { group: '.name', member: /Jiro/ },
          /male/
        ).element.id).toBe('ex-nested-group-member-selector');
      expect(
        FQ(
          { group: '.classroom', member: /class A/ },
          { group: '.name', member: /Jiro/ },
          /male/, /male/
        )).toBe(null);
    });
  });

})
