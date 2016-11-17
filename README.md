fuzzy-query
===========

## What is fuzzy-query ?

- It is a library to select HTML element and operate input action for form.
- It has original selecting query which puts more emphasis on visibility than performance.
- It makes End-To-End test more intuitive and stronger than css selector.

## Usage

#### Selectors

- RegExp Selector

  ```html
  <!-- click me ! -->
  <button>foo</button>

  <script>
  Q(/foo/).click();
  </script>
  ```

- CSS selector

  ```html
  <!-- click me ! -->
  <button class='foo-btn'>foo</button>

  <script>
  Q('.foo-btn').click();
  </script>
  ```

- Ordered Selector (combination of selectors)

  ```html
  <h3>foo</h3>
  <!-- not click me ! -->
  <button>bar</button>
  <h3>baz</h3>
  <!-- click me ! -->
  <button>bar</button>

  <script>
  Q(/baz/, /bar/).click();
  </script>
  ```

- Orderd Selector with index (last argument)

  ```html
  <h3>foo</h3>
  <!-- click me ! -->
  <a href="/bar">bar</a>
  <h3>baz</h3>

  <script>
  Q(/foo/, 'a', /baz/, 1).click();
  </script>
  ```

#### Selecting Priority

- In first selector, last element takes a priority.

  ```html
  <table>
    <tr>
      <!-- not click me ! -->
      <td><a href="/foo">foo</a></td>
      <td>bar</td>
    </tr>
    <tr>
      <!-- click me ! -->
      <td><a href="/baz">baz</a></td>
      <td>foobar</td>
    </tr>
  </table>

  <script>
  Q('a', /foobar/, 0).click();
  </script>
  ```

- In other selector, first element takes a priority.

  ```html
  <h3>foo</h3>
  <!-- click me ! -->
  <button>bar</button>
  <!-- not click me ! -->
  <button>baz</button>

  <script>
  Q(/foo/, 'button').click();
  </script>
  ```

#### Operations

- click

  ```html
  <button>foo</button>

  <script>
  Q(/foo/).click();
  </script>
  ```

- select (list)
  - select() has a string argument (it is interpreted by RegExp)

  ```html
  <div>
  Value:
    <select>
      <option value="foo">foo</option>
      <!-- select me ! -->
      <option value="bar">bar</option>
      <option value="baz">baz</option>
    </select>
  </div>

  <script>
  Q(/Value:/, 'select').select('bar');
  </script>
  ```

- select (checkbox)

  ```html
  <input type="radio" value="foo" /> foo
  <!-- select me ! -->
  <input type="radio" value="bar" /> bar

  <script>
  Q('input', /bar/, 0).select();
  </script>
  ```

- type

  ```html
  <div>
  Value: <input type="text" />
  </div>

  <script>
  Q(/Value:/, 'input').type('foo');
  </script>
  ```

- text

  ```html
  <h3>foo</h3>
  <div>get this text !</div>

  <script>
  Q(/foo/, 'div').text();
  // => 'get this text !'
  </script>
  ```

## License

MIT
