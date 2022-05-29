

# Introduction

This is a babel plugin to transform all your string classes into css-module classes automatically. 

Its lets you write css-module classes just like normal classes(no need to use style objects). Its faster to write and improves code readability.
You can import multiple css-modules with different names and then use it as [named-module](#introducing-named-css-modules). supports \*sass/scss modules also. 

*\* you may need to use sass-loader with webpack*
# Usage

We can import the css-module like as normal css import without any import variable.

```jsx
import "./m1.module.css"
```
The plugin will automatically change this import statement to use style object,
which will then be used to access the css-module classes.

```jsx
import _style from "./m1.module.css" // modified
```

If we now want to use the css-module, we have to write all our css classes using style object that we just imported:

```jsx
import _style from "./m1.module.css"

function Component() {
    return <h1 className={`${_style.foo} ${_style.bar}`}> ..... </h1>
}
```
This sometimes can get too verbose and hurts **code readibility**. It would be nice if we could write our classes using normal strings and not having to deal with any style objects.

*remember, because of style objects we need to introduce template strings and object notations within our `className` attribute.*

With the help of the plugin, we don't have to use style object anymore, instead we can specify our classes just using strings:
```jsx
import "./m1.module.css"

function Component() {
    return <h1 className="foo bar"> ..... </h1>
}
```
This looks more readable and is faster to write as well. 
The plugin will modify our code to use css-module and its style object automatically without us having to do anything:

```jsx
// modified
import _style from "./m1.module.css"

function Component() {
    return <h1 className={`${_style["foo"]} ${_style["bar"]}`}> ..... </h1>
}
```

**By default, If plugin found any `'*.module.css'` import, it will transform all our css classes to use style objects.**
If we want to use global css classes, we need to add `'#'` at the end of the class. This will tell plugin not to tranform these classes and keep them as is:

```jsx
import "./m1.module.css"

function Component() {
    return <h1 className="foo bar# baz"> .... </h1>
}
```

```jsx
// modified
import _style from "./m1.module.css"

function Component() {
    return <h1 className={`${_style["foo"]} bar ${_style["baz"]}`}> .... </h1>
}
```

In this example, `'bar'` might be coming from our global stylesheet while `'foo'` and `'bar'` are scoped to the imported module.

*The transformed code will use object indexing instead of dot-notation, this helps us to use dashes within our class names (eg. `className="foo-bar baz"`) or else, we would have to use camel-case pattern while using css classes.*

## Usage With Already Imported CSS-Module 
If you were already been using css-module with style objects, the plugin will see it and transform other css-classes accordingly.
for example:
```jsx
import style from "./component.module.css"

function Component() {
    return (
        <h1 className={style.foo}> 
            <div className="bar baz"> .... </div>
        </h1>
    )
}
```

```jsx
// modified
import style from "./component.module.css"

function Component() {
    return (
        <h1 className={style.foo}> 
            <div className={`${style["bar"]} ${style["baz"]}`}> .... </div>
        </h1>
    )
}
```


# Introducing Named CSS-Modules

In most cases, we would be using single css-module inside our components but sometimes 
it might make sense to import bunch of css-modules and use them together.

We can give names to our css-module imports, and then use it to apply specific css classes from different modules

eg. we can import two module and use them like:

```jsx
// original 

import "./layout.module.css#layout"
import "./component.module.css#comp"

function Component() {
    return <h1 className="foo#layout bar#comp baz#layout"> ..... </h1>
}

// modified

import _layout from "./layout.module.css"
import _comp from "./component.module.css"

function Component() {
    return (
        <h1 className={`${_layout["foo"]} ${_comp["bar"]} ${_layout["baz"]}`}> 
            <div className={`${_layout["grid-1"]}`}></div>
        </h1>
    )
}
```