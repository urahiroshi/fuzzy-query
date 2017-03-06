fuzzy-query
===========

## What is fuzzy-query ?

- It is a library to select HTML element and operate input action for form.
- It has original selecting query which puts more emphasis on visibility than performance.
- It makes End-To-End test more intuitive and stronger than css selector.

## Usage

#### Selectors

##### RegExp Selector

  ```html
  <!-- click me ! -->
  <button>foo</button>

  <script>
  FQ(/foo/).click();
  </script>
  ```

##### CSS selector

  ```html
  <!-- click me ! -->
  <button class='foo-btn'>foo</button>

  <script>
  FQ('.foo-btn').click();
  </script>
  ```

##### Ordered Selector (combination of selectors)

  ```html
  <h3>foo</h3>
  <!-- not click me ! -->
  <button>bar</button>
  <h3>baz</h3>
  <!-- click me ! -->
  <button>bar</button>

  <script>
  FQ(/baz/, /bar/).click();
  </script>
  ```

##### Orderd Selector with index (last argument)

  ```html
  <h3>foo</h3>
  <!-- click me ! -->
  <a href="/bar">bar</a>
  <h3>baz</h3>

  <script>
  FQ(/foo/, 'a', /baz/, 1).click();
  </script>
  ```

##### table selector

  ```html
  <table>
    <thead>
      <tr>
        <th>head1</th>
        <th>head2</th>
        <th>head3</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>value1</td>
        <!-- click me! -->
        <td>value2: <input id="ex-table-selector" /></td>
        <td><div>value3</div></td>
      </tr>
      <tr>
        <td>value4</td>
        <td>value2: <input /></td>
        <td><div>value3</div></td>
      </tr>
    </tbody>
  </table>
  
  <script>
  FQ({col: /head2/, row: /value1/}, 'input').click();
  // row can also be index number
  FQ({col: /head2/, row: 1}, 'input').click();
  </script>
  ```

##### group member selector

grouping elements by group value (need to be query selector),
member and post selectors will search nodes between grouping elements.

  ```html
  <h3 style="color: blue;" class="colors natural">sea</h3>
  <div>foo</div>
  <h3 style="color: red;" class="colors natural">sun</h3>
  <div>foo</div>
  
  <script>
  FQ({group: '.colors', member: /sea/}, /foo/);        // find element <div>foo</div>
  FQ({group: '.colors', member: /sea/}, /foo/, /foo/); // not find element
  </script>
  ```

##### heading selector

find "heading element" by heading key,
and find next element until "next heading element"
which has same style (*) of heading element.

*same style means two elements having same class, style attributes and
same style ancestors.

  ```html
  <h3 style="color: blue;" class="colors natural">sky</h3>
  <div>foo</div>
  <h3 style="color: blue;" class="colors natural">sea</h3>
  <div>foo</div>

  <script>
  FQ({heading: /sky/}, /foo/);        // find element <div>foo</div>
  FQ({heading: /sky/}, /foo/, /foo/); // not find element
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
  FQ('a', /foobar/, 0).click();
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
  FQ(/foo/, 'button').click();
  </script>
  ```

#### Operations

##### click

  ```html
  <button>foo</button>

  <script>
  FQ(/foo/).click();
  </script>
  ```

##### select (list)

this method has a string argument (it is interpreted by RegExp)

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
  FQ(/Value:/, 'select').select('bar');
  </script>
  ```

##### select (checkbox)

  ```html
  <input type="radio" value="foo" /> foo
  <!-- select me ! -->
  <input type="radio" value="bar" /> bar

  <script>
  FQ('input', /bar/, 0).select();
  </script>
  ```

##### type

  ```html
  <div>
  Value: <input type="text" />
  </div>

  <script>
  FQ(/Value:/, 'input').type('foo');
  </script>
  ```

##### text

  ```html
  <h3>foo</h3>
  <div>get this text !</div>

  <script>
  FQ(/foo/, 'div').text();
  // => 'get this text !'
  </script>
  ```

## License

MIT
