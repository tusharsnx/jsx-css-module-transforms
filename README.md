# Introduction

🚀 A Webpack plugin to transform your React `classNames` into CSS module classnames automatically 🚀

- Faster to write ⚡
- Improves code readability 📖
- Supports multiple CSS Module in a file using [Named modules](#named-modules) ✨
- Works with CSS, SASS, and SCSS modules 🔥

```jsx
// Original:

import "./style.module.css"

function Component() {
    return <div className="foo bar"></div>
}

// Transformed:

import style from "./style.module.css"

function Component() {
    return <div className={ style.foo + " " + style.bar }></div>
}
```

# Installation

- Install the plugin:

```bash
npm install --save-dev jsx-css-module-transforms
```

- Add the plugin to the list of plugins in `webpack.config.js`:

```js
import JsxCssModuleTransforms from "jsx-css-module-transforms"

let config = {
  plugins: [JsxCssModuleTransforms, ...otherPlugins]
}

export default config;
```

# Usage

The plugin automatically transforms CSS module imports and CSS classnames as required.

Without the plugin, you may write your code like this:
```jsx
import style from "./style.module.css"

function Component() {
    return <>
                <div className={style.card1}></div>
                <div className={style.card2}></div>
                <div className={`${style.card2} ${style.cardFlipped}`}></div>
           </>
}
```
This can get quite verbose at times and hurts **code readibility** 😵

With the help of this plugin, we can fix that! You can simply write your
classnames as strings and let the plugin handle the rest:

```jsx
import "./style.module.css"

function Component() {
    return <>
                <div className="card-1"></div>
                <div className="card-2"></div>
                <div className="card-2 card-flipped"></div>
           </>
}
```

This improves readability and follows the same pattern as regular CSS.

## Global styles

By default, if plugin finds `'.module.css'` import in the file, it will
apply transformations to **all** CSS classes within that file. However,
you may want to use regular css classnames and prevent transformation
on them. This can be done by adding `:g` at the end of the classname:

```jsx
import "./m1.module.css"

function Component() {
    return <div className="card-layout:g card-rnd-1"></div>
}
```

In this example, `card-layout` may be declared in the global style-sheet,
whereas `card-rnd-1` is declared in the the imported CSS module.

## Imported CSS module

If you've been using CSS modules in your project, you can keep the old
code as-is, while the new code can use strings for the classnames:

```jsx
import style from "./component.module.css"

function Component() {
    return (
        <div className={style.foo}>
            <h1 className="bar baz"></h1>
        </div>
    )
}
```

## Named modules

You can use multiple CSS module within a file using Named modules.

To use Named CSS modules, you can add labels to each CSS module import
in the file by adding `:<module-name>` at the end of the path:

```jsx
import "./layout.module.css:layout"
import "./component.module.css:com"
```

And use the same labels for writing your classnames:

```jsx
function Component() {
    return (
        <ul className="food-items:layout">
            <li className="food-item:com"></li>
            <li className="food-item:com"></li>
        </ul>
    )
}
```
