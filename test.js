describe('template', function() {
  beforeAll(function () {
    document.body.innerHTML = __html__['test.html'];
  })

  it('should select by RegExp Selector', function () {
    expect(Q(/apple/).element.id).toBe('ex-regexp-selector');
  })

  it('should select by CSS Selector', function () {
    expect(Q('.foo-btn').element.id).toBe('ex-css-selector');
  })

  it('should select by Ordered Selector', function () {
    expect(Q(/mango/, /banana/).element.id).toBe('ex-ordered-selector');
  })

  it('should select by Ordered Selector with index', function () {
    expect(Q(/plum/, 'a', /orange/, 1).element.id).toBe('ex-index-ordered-selector');
  })

  it('should select last element in first selector', function () {
    expect(Q('a', /grape/, 0).element.id).toBe('ex-first-selector-last-element');
  })

  it('should select first element in not first selector', function () {
    expect(Q(/guava/, 'button').element.id).toBe('ex-other-selector-first-element');
  })

  it('should select children of element selected by previous selector', function () {
    expect(Q('.fruits-1', /melon/).element.id).toBe('ex-search-children');
  })

  it('should select by table selector', function () {
    expect(Q({col: /head2/, row: /value1/}, 'input').element.id).toBe('ex-table-selector');
  })

  it('should select by table selector with row index', function () {
    expect(Q({col: /head2/, row: 1}, 'input').element.id).toBe('ex-table-selector');
  })

  it('should take colspan to use table selector', function () {
    expect(Q({col: /row2/, row: 3}).text()).toBe('cell12');
  })

  it('should take rowspan to use table selector', function () {
    expect(Q({col: /row8/, row: /cell21/}).text()).toBe('cell28');
  })

  it('should ignore cell not displayed to use table selector', function () {
    expect(Q({col: /row9/, row: /cell11/}).text()).toBe('cell19');
  })

  it('should select by regexp', function () {
    Q(/Selections:/).select('do.*');
    expect(document.querySelector('#ex-selections').value).toBe('animal');
    expect(document.querySelector('#ex-select-by-regexp').selected).toBeTruthy();
  })

  it('should select option having same value', function () {
    Q(/Selections:/).select('durian');
    expect(document.querySelector('#ex-selections').value).toBe('fruits');
    expect(document.querySelector('#ex-select-same-value').selected).toBeTruthy();
  })

  describe('heading selector', function () {
    it('should select by heading selector', function () {
      expect(Q({ heading: /sky/ }, /foo/).element.id).toBe('ex-heading-selector');
      expect(Q({ heading: /sky/ }, /foo/, /foo/)).toBe(null);
    });

    it('not regard same heading if style is not matched', function () {
      expect(Q({ heading: /sea/ }, /foo/, /foo/)).not.toBe(null);
    });

    it('not regard same heading if class is not matched', function () {
      expect(Q({ heading: /sun/ }, /foo/, /foo/)).not.toBe(null);
    });

    it('not regard same heading if class is not matched', function () {
      expect(Q({ heading: /sun/ }, /foo/, /foo/)).not.toBe(null);
    });

    it('not regard same heading if tagName is not matched', function () {
      expect(Q({ heading: /post/ }, /foo/, /foo/)).not.toBe(null);
    });

    it('not regard same heading if different ancestors', function () {
      expect(Q({ heading: /ruby/ }, /foo/, /foo/)).not.toBe(null);
    });
  });

  describe('group member selector', function () {
    it('should select by group member selector', function () {
      expect(Q({ group: '.colors', member: /sea/}, /foo/).element.id).toBe(
        'ex-group-member-selector'
      );
      expect(Q({ group: '.colors', member: /sea/}, /foo/, /foo/)).toBe(null);
    });

    it('not regard same group if group selector not matched', function () {
      expect(Q({ group: '.natural', member: /sun/}, /foo/, /foo/).element.id).toBe(
        'ex-not-same-group'
      );
    });
  });

})
