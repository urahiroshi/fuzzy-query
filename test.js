describe('template', function() {
  beforeAll(function () {
    document.body.innerHTML = __html__['test.html'];
  })

  it('should select by RegExp Selector', function () {
    expect(Q(/apple/).element.id === 'ex-regexp-selector');
  })

  it('should select by CSS Selector', function () {
    expect(Q('.foo-btn').element.id === 'ex-css-selector');
  })

  it('should select by Ordered Selector', function () {
    expect(Q(/mango/, /banana/).element.id === 'ex-ordered-selector');
  })

  it('should select by Ordered Selector with index', function () {
    expect(Q(/plum/, 'a', /orange/, 1).element.id === 'ex-index-ordered-selector');
  })

  it('should select last element in first selector', function () {
    expect(Q('a', /grape/, 0).element.id === 'ex-first-selector-last-element');
  })

  it('should select first element in not first selector', function () {
    expect(Q(/guava/, 'button').element.id === 'ex-other-selector-first-element');
  })
})
