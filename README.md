# Introduction

🚀 A Webpack plugin to transform your React `classNames` into CSS module classnames automatically 🚀

- Faster to write ⚡
- Improves code readability 📖
- Supports multiple CSS Modules using [Named modules](#named-modules) ✨
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

When the plugin finds `'.module.css'` import in the file, it will transform
**all** CSS classnames to use the imported CSS module. However, you may want
to use regular CSS classnames and prevent transformations on them. This
can be done by adding `g:` at the start of the classname:

```jsx
import "./style.module.css"

function Component() {
    return <div className="g:card-layout card-rnd-1"></div>
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
in the file by adding `<module-name>:` at the end of the path:

```jsx
import "layout:./layout.module.css"
import "com:./component.module.css"
```

And use the same labels for writing your classnames:

```jsx
function Component() {
    return (
        <ul className="layout:food-items">
            <li className="com:food-item"></li>
            <li className="com:food-item"></li>
        </ul>
    )
}
```
