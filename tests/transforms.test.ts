import babel from "@babel/core"
import API from "../src/index"
import { CSSModuleError } from "../src/utils"

async function runWithBabel(source: string) {
    let transformed = await babel.transformAsync(source, { plugins: [API] })
    return transformed?.code
}

describe("single imports", () => {
    test("default module", async () => {
        let source = `import "./foo.module.scss"`
        let code = await runWithBabel(source)
        expect(code).toMatchInlineSnapshot(`"import _style from \\"./foo.module.scss\\";"`)

        source = `import "./foo.module.css"`
        code = await runWithBabel(source)
        expect(code).toMatchInlineSnapshot(`"import _style from \\"./foo.module.css\\";"`)
    })

    test("with specifier", async () => {
        let source = `import style from "./foo.module.scss"`
        let code = await runWithBabel(source)
        expect(code).toMatchInlineSnapshot(`"import style from \\"./foo.module.scss\\";"`)

        source = `import style from "./foo.module.css"`
        code = await runWithBabel(source)
        expect(code).toMatchInlineSnapshot(`"import style from \\"./foo.module.css\\";"`)
    })

    test("with specifier (ignore names)", async () => {
        let source = `import style from "./foo.module.scss#m1"`
        let code = await runWithBabel(source)
        expect(code).toMatchInlineSnapshot(`"import style from \\"./foo.module.scss\\";"`)

        source = `import style from "./foo.module.css#m1"`
        code = await runWithBabel(source)
        expect(code).toMatchInlineSnapshot(`"import style from \\"./foo.module.css\\";"`)
    })

    test("with named-module", async () => {
        let source = `import "./foo.module.scss#m1"`
        let code = await runWithBabel(source)
        expect(code).toMatchInlineSnapshot(`"import _m from \\"./foo.module.scss\\";"`)

        source = `import "./foo.module.css#m1"`
        code = await runWithBabel(source)
        expect(code).toMatchInlineSnapshot(`"import _m from \\"./foo.module.css\\";"`)
    })

    test("multiple imports on single module", async () => {
        let source = `import { foo, bar } from "./foo.module.css"`
        await expect(runWithBabel(source)).rejects.toThrow(CSSModuleError)
    })

    test("multiple imports on single module (w/ default specifier)", async () => {
        let source = `import style, { foo, bar } from "./foo.module.css"`
        await expect(runWithBabel(source)).rejects.toThrow(CSSModuleError)
    })
})

describe("imports multiple module", () => {
    test("default module", async () => {
        let source = `
            import "./foo.module.css"
            import "./bar.module.css"
        `
        await expect(runWithBabel(source)).rejects.toThrow(CSSModuleError)
    })

    test("with named-modules", async () => {
        let source = `
            import "./module1.module.css#m1"
            import "./module2.module.css#m2"
        `
        let code = await runWithBabel(source)
        expect(code).toMatchInlineSnapshot(`
"import _m from \\"./module1.module.css\\";
import _m2 from \\"./module2.module.css\\";"
`)
    })

    test("with same named-modules twice", async () => {
        let source = `
            import "./module1.module.css#m1"
            import "./module2.module.css#m1"
        `
        await expect(runWithBabel(source)).rejects.toThrow(CSSModuleError)
    })

    test("with specifier", async () => {
        let source = `
            import style from "./module1.module.css#m1"
            import style1 from "./module2.module.css#m2"
        `
        let code = await runWithBabel(source)
        expect(code).toMatchInlineSnapshot(`
"import style from \\"./module1.module.css\\";
import style1 from \\"./module2.module.css\\";"
`)
    })

    test("with same specifier twice", async () => {
        let source = `
            import style from "./module1.module.css#m1"
            import style from "./module2.module.css#m2"
        `
        expect(runWithBabel(source)).rejects.toThrow(SyntaxError)
    })
})

describe("different kinds together", () => {
    test("each kind once", async () => {
        let source = `
            import style from "./module1.module.css"
            import "./module2.module.css#m2"
            import "./module3.module.css"
        `
        let code = await runWithBabel(source)
        expect(code).toMatchInlineSnapshot(`
"import style from \\"./module1.module.css\\";
import _m from \\"./module2.module.css\\";
import _style from \\"./module3.module.css\\";"
`)
    })
})
