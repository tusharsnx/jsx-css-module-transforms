# Introduction

This is a babel plugin to transform all your string classes into css-module classes automatically.

Its lets you use css-module classes without style object.
It is faster to write, improves code readability and supports multiple css-module using [named-module](#introducing-named-css-modules)

Also supports \*sass/scss modules.

_\*you may need to use sass-loader with webpack_

# Installation

- Install the plugin with npm:

```sh
npm install --save-dev jsx-css-module-transforms
```

 - If you are using babel, add this to your plugins:

```jsonc
// .babelrc

{
    "plugins": ["module:jsx-css-module-transforms"]
}
```

- For Webpack, modify the babel-loader options to include the plugin:

```js
// webpack.config.js

module.exports = {
  module: {
    rules: [
      {
        loader: "babel-loader",
        options: {
          plugins: [ "module:jsx-css-module-transforms", ... ],
       },
      },
    ],
  },
}
```

> Note: _The plugin relies on the **JSX** syntax. Other plugins that executes early might transform JSX
> before it reaches to the plugin which might cause some problems. jsx-css-module-transforms plugin needs
> to be placed before(ideally, at the beginning) other plugins that transform JSX._

# Usage

We can import the css-module like normal css import without any import variable.

```jsx
import "./m1.module.css"
```

The plugin will automatically change the import statement to include style object,
which will be used to access the css-module classes.

```jsx
import _style from "./m1.module.css" // modified
```

If we want to use the css-module, we need to write all our css classes using 
style object that we just imported:

```jsx
import _style from "./m1.module.css"

function Component() {
    return <h1 className={`${_style.foo} ${_style.bar}`}> ... </h1>
}
```

This sometimes can get too verbose and hurts **code readibility**. 
It would be nice if we could write classnames within a string and not 
having to deal with any style objects.


With the help of plugin, we don't have to use style object anymore, instead we can specify our classes by just using strings:

```jsx
import "./m1.module.css"

function Component() {
    return <h1 className="foo bar"> ... </h1>
}
```

This looks more readable and is faster to write as well.
__jsx-css-modules-transforms__ will modify the code to use css-module and its style object automatically without 
us having to do anything:

```jsx
// modified
import _style from "./m1.module.css"

function Component() {
    return <h1 className={`${_style["foo"]} ${_style["bar"]}`}> ..... </h1>
}
```

The transformed code uses object bracket-notation instead of dot-notation as this allows
us to use `-` (dash) within our classnames (eg. `className="foo-bar"`).

## Global Styles

By default, If plugin finds **any** `'*.module.css'` import, it will transform **all** the css classes
to use style objects. To use global css classnames, we need to add `':g'` at the end of the classname. 
This tells plugin not to transform these classes and keep them as is:

```jsx
import "./m1.module.css"

function Component() {
    return <h1 className="foo bar:g baz"> ... </h1>
}
```

```jsx
// modified
import _style from "./m1.module.css"

function Component() {
    return <h1 className={`${_style["foo"]} bar ${_style["baz"]}`}> ... </h1>
}
```

In this example, `'bar'` might be declared in the global style-sheet, while `'foo'` and `'baz'` are
scoped to the imported css module.


## Usage With Already Imported CSS-Module

If you are already using CSS-Modules, the plugin will transform string (containing classnames)
that is given to any `className` attr. For example:

```jsx
import style from "./component.module.css"

function Component() {
    return (
        <div className={style.foo}>
            <h1 className="bar baz"> ... </h1> 
        </div>
    )
}
```

```jsx
// modified
import style from "./component.module.css"

function Component() {
    return (
        <div className={style.foo}>
            <h1 className={`${style["bar"]} ${style["baz"]}`}> ... </h1>
        </div>
    )
}
```

# Introducing Named CSS-Modules

In most cases, we would be using single CSS-Module inside a component but sometimes,
It might make sense to create reusable CSS-Modules and apply them in multiple different components.

In order to work with named CSS-Modules, we need to give names to each css-module import
by adding `:<module-name>` at the end of the path:

```jsx
import "./layout.module.css:layout"
import "./component.module.css:com"
```

To access CSS-Module class, simply add `:<module-name>` at the end of the classname that specifies which CSS-Module
to use for the class:

```jsx
function Component() {
    return (
        <ul className="food-items:layout">
            <li className="food-item:com"> ... </li>
            <li className="food-item:com"> ... </li>
        </ul>
    )
}
```
Transformed code would look like this:

```jsx
import _layout from "./layout.module.css"
import _com from "./component.module.css"

function Component() {
    return (
        <ul className={`${_layout["food-items"]}`}>
            <li className={`${_com["food-item"]}`}> ... </li>
            <li className={`${_com["food-item"]}`}> ... </li>
        </ul>
    )
}
```
