import babel from "@babel/core";
import API from "../dev/plugin.js";
import { CSSModuleError } from "../dev/utils.js";

async function runWithBabel(source: string) {
    let transformed = await babel.transformAsync(source, {
        plugins: ["@babel/plugin-syntax-jsx", API],
    });
    return transformed?.code;
}

describe("single imports", () => {
    test("default module", async () => {
        let source = `import "./foo.module.scss"`;
        let code = await runWithBabel(source);
        expect(code).toMatchInlineSnapshot(`"import _style from "./foo.module.scss";"`);

        source = `import "./foo.module.css"`;
        code = await runWithBabel(source);
        expect(code).toMatchInlineSnapshot(`"import _style from "./foo.module.css";"`);
    });

    test("with specifier", async () => {
        let source = `import style from "./foo.module.scss"`;
        let code = await runWithBabel(source);
        expect(code).toMatchInlineSnapshot(`"import style from "./foo.module.scss";"`);

        source = `import style from "./foo.module.css"`;
        code = await runWithBabel(source);
        expect(code).toMatchInlineSnapshot(`"import style from "./foo.module.css";"`);
    });

    test("with specifier (ignore names)", async () => {
        let source = `import style from "./foo.module.scss:m1"`;
        let code = await runWithBabel(source);
        expect(code).toMatchInlineSnapshot(`"import style from "./foo.module.scss";"`);

        source = `import style from "./foo.module.css:m1"`;
        code = await runWithBabel(source);
        expect(code).toMatchInlineSnapshot(`"import style from "./foo.module.css";"`);
    });

    test("with named-module", async () => {
        let source = `import "./foo.module.scss:m1"`;
        let code = await runWithBabel(source);
        expect(code).toMatchInlineSnapshot(`"import _m from "./foo.module.scss";"`);

        source = `import "./foo.module.css:m1"`;
        code = await runWithBabel(source);
        expect(code).toMatchInlineSnapshot(`"import _m from "./foo.module.css";"`);
    });

    test("multiple imports on single module", async () => {
        let source = `import { foo, bar } from "./foo.module.css"`;
        await expect(runWithBabel(source)).rejects.toThrow(CSSModuleError);
    });

    test("multiple imports on single module (w/ default specifier)", async () => {
        let source = `import style, { foo, bar } from "./foo.module.css"`;
        await expect(runWithBabel(source)).rejects.toThrow(CSSModuleError);
    });
});

describe("imports multiple module", () => {
    test("default module", async () => {
        let source = `
            import "./foo.module.css"
            import "./bar.module.css"
        `;
        await expect(runWithBabel(source)).rejects.toThrow(CSSModuleError);
    });

    test("with named-modules", async () => {
        let source = `
            import "./module1.module.css:m1"
            import "./module2.module.css:m2"
        `;
        let code = await runWithBabel(source);
        expect(code).toMatchInlineSnapshot(`
"import _m from "./module1.module.css";
import _m2 from "./module2.module.css";"
`);
    });

    test("with same named-modules twice", async () => {
        let source = `
            import "./module1.module.css:m1"
            import "./module2.module.css:m1"
        `;
        await expect(runWithBabel(source)).rejects.toThrow(CSSModuleError);
    });

    test("with specifier", async () => {
        let source = `
            import style from "./module1.module.css:m1"
            import style1 from "./module2.module.css:m2"
        `;
        let code = await runWithBabel(source);
        expect(code).toMatchInlineSnapshot(`
"import style from "./module1.module.css";
import style1 from "./module2.module.css";"
`);
    });

    test("with same specifier twice", async () => {
        let source = `
            import style from "./module1.module.css:m1"
            import style from "./module2.module.css:m2"
        `;
        expect(runWithBabel(source)).rejects.toThrow(SyntaxError);
    });
});

describe("different kinds together", () => {
    test("each kind once", async () => {
        let source = `
            import style from "./module1.module.css"
            import "./module2.module.css:m2"
            import "./module3.module.css"
        `;
        let code = await runWithBabel(source);
        expect(code).toMatchInlineSnapshot(`
"import style from "./module1.module.css";
import _m from "./module2.module.css";
import _style from "./module3.module.css";"
`);
    });

    test("same module name used twice on different kinds (1)", async () => {
        let source = `
            import "./component.module.css"
            import layout from "./layout.module.css"
            import "./layout2.module.css:layout"
        `;
        await expect(runWithBabel(source)).rejects.toThrow(CSSModuleError);
    });

    test("same module name used twice on different kinds (2)", async () => {
        let source = `
            import "./component.module.css"
            import "./layout2.module.css:layout"
            import layout from "./layout.module.css"
        `;
        await expect(runWithBabel(source)).rejects.toThrow(CSSModuleError);
    });
});

describe("jsx with single css-module", () => {
    test("default module", async () => {
        let source = `
            import "./component.module.css"

            function Component() {
                return <h1 className="foo-bar baz"></h1>
            }
        `;
        let code = await runWithBabel(source);
        expect(code).toMatchInlineSnapshot(`
"import _style from "./component.module.css";
function Component() {
  return <h1 className={\`\${_style["foo-bar"]} \${_style["baz"]}\`}></h1>;
}"
`);
    });

    test("with specifier", async () => {
        let source = `
            import style from "./component.module.css"

            function Component() {
                return <h1 className="foo-bar baz"></h1>
            }
        `;
        let code = await runWithBabel(source);
        expect(code).toMatchInlineSnapshot(`
"import style from "./component.module.css";
function Component() {
  return <h1 className={\`\${style["foo-bar"]} \${style["baz"]}\`}></h1>;
}"
`);
    });

    test("with named-module", async () => {
        let source = `
            import "./component.module.css:m1"

            function Component() {
                return <h1 className="foo-bar:m1 baz:m1"></h1>
            }
        `;
        let code = await runWithBabel(source);
        expect(code).toMatchInlineSnapshot(`
"import _m from "./component.module.css";
function Component() {
  return <h1 className={\`\${_m["foo-bar"]} \${_m["baz"]}\`}></h1>;
}"
`);
    });

    test("named module class with colon only", async () => {
        let source = `
            import "./component.module.css"

            function Component() {
                return <h1 className="foo-bar: baz"></h1>
            }
        `;
        await expect(() => runWithBabel(source)).rejects.toThrow(CSSModuleError);
    });
});

describe("jsx with multiple modules", () => {
    test("no css-module present", async () => {
        let source = `
            import "./component.css"
            import "./layout.css"

            function component() {
                return <h1 className="foo-bar baz"></h1>
            }
        `;
        let code = await runWithBabel(source);
        expect(code).toMatchInlineSnapshot(`
"import "./component.css";
import "./layout.css";
function component() {
  return <h1 className="foo-bar baz"></h1>;
}"
`);
    });

    test("with specifier", async () => {
        let source = `
            import style from "./component.module.css"
            import layout from "./layout.module.css"

            function Component() {
                return <h1 className="foo-bar:layout baz:style"></h1>
            }
        `;
        let code = await runWithBabel(source);
        expect(code).toMatchInlineSnapshot(`
"import style from "./component.module.css";
import layout from "./layout.module.css";
function Component() {
  return <h1 className={\`\${layout["foo-bar"]} \${style["baz"]}\`}></h1>;
}"
`);
    });

    test("named-module", async () => {
        let source = `
            import "./component.module.css:style"
            import "./layout.module.css:layout"

            function Component() {
                return <h1 className="foo-bar:layout baz:style"></h1>
            }
        `;
        let code = await runWithBabel(source);
        expect(code).toMatchInlineSnapshot(`
"import _style from "./component.module.css";
import _layout from "./layout.module.css";
function Component() {
  return <h1 className={\`\${_layout["foo-bar"]} \${_style["baz"]}\`}></h1>;
}"
`);
    });

    test("with specifier (class uses non-existent module)", async () => {
        let source = `
            import style from "./component.module.css"
            import layout from "./layout.module.css"

            function Component() {
                return <h1 className="foo-bar:layout baz:style2"></h1>
            }
        `;
        await expect(runWithBabel(source)).rejects.toThrow(CSSModuleError);
    });

    test("named-module (class uses non-existent module)", async () => {
        let source = `
            import "./component.module.css:style"
            import "./layout.module.css:layout"

            function component() {
                return <h1 className="foo-bar:layout baz:style2"></h1>
            }
        `;
        await expect(runWithBabel(source)).rejects.toThrow(CSSModuleError);
    });
});

describe("jsx with multiple kinds of module", () => {
    test("each kind once", async () => {
        let source = `
            import style from "./component.module.css"
            import layout from "./layout.module.css"
            import "./layout2.module.css:altLayout"

            function Component() {
                return (
                    <div className="grid-1:layout col-3:altLayout">
                        <h1 className="clr-green:style"></h1>
                    </div>
                )
            }
        `;
        let code = await runWithBabel(source);
        expect(code).toMatchInlineSnapshot(`
"import style from "./component.module.css";
import layout from "./layout.module.css";
import _altLayout from "./layout2.module.css";
function Component() {
  return <div className={\`\${layout["grid-1"]} \${_altLayout["col-3"]}\`}>
                        <h1 className={\`\${style["clr-green"]}\`}></h1>
                    </div>;
}"
`);
    });

    test("each kind once (w/ global class)", async () => {
        let source = `
            import style from "./component.module.css"
            import layout from "./layout.module.css"
            import "./layout2.module.css:altLayout"

            function Component() {
                return (
                    <div className="grid-1:layout col-3:altLayout">
                        <h1 className="bg-primary:g clr-green:style"></h1>
                    </div>
                )
            }
        `;
        let code = await runWithBabel(source);
        expect(code).toMatchInlineSnapshot(`
"import style from "./component.module.css";
import layout from "./layout.module.css";
import _altLayout from "./layout2.module.css";
function Component() {
  return <div className={\`\${layout["grid-1"]} \${_altLayout["col-3"]}\`}>
                        <h1 className={\`bg-primary \${style["clr-green"]}\`}></h1>
                    </div>;
}"
`);
    });
});
