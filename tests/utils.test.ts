import * as t from "@babel/types";

import { splitClsName, shouldTransform, CSSModuleError } from "../dev/utils.js";
import { createModuleMemberExpression } from "../dev/transforms.js";

// testing splitModuleName
describe("split string into module and classnames", () => {
    test("class without modifier", () => {
        let { classname, module } = splitClsName("classB:m1", "m1");

        expect(classname).toBe("classB");
        expect(module).toBe("m1");
    });

    test("class with modifier", () => {
        let { classname, module } = splitClsName("classB-modifier:m2", "m1");

        expect(classname).toBe("classB-modifier");
        expect(module).toBe("m2");
    });

    test("global module", () => {
        let { classname, module } = splitClsName("classA:g", "m1");

        expect(classname).toBe("classA");
        expect(module).toBeUndefined();
    });

    test("classname with separator only", () => {
        expect(() => splitClsName("classA:", "m1")).toThrow(CSSModuleError);
    });

    test("use default module", () => {
        let { classname, module } = splitClsName("classA", "m1");

        expect(classname).toBe("classA");
        expect(module).toBe("m1");
    });
});

// testing checkShouldTransform
describe("transform are applied correctly", () => {
    test("should transform", () => {
        let transform = shouldTransform("foo-bar");
        expect(transform).toBe(true);
    });

    test("should transform (only sep)", () => {
        let transform = shouldTransform("foo-bar:");
        expect(transform).toBe(true);
    });

    test("should not transform", () => {
        let transform = shouldTransform("foo-bar:g");
        expect(transform).toBe(false);
    });
});

// testing createModuleMemberExpression
describe("member expression from module and classname created as expected", () => {
    test("creating MemberExpression from module and classname", () => {
        let classname = "foo-bar",
            module = "m1",
            modules = {
                namedModules: {
                    m1: "_module",
                },
            };
        let memberExpressionNode = createModuleMemberExpression(classname, module, modules);
        expect(t.isMemberExpression(memberExpressionNode)).toBe(true);
        expect(memberExpressionNode).toHaveProperty("computed", true);

        // checking .object and .property to have expected props
        expect(t.isIdentifier(memberExpressionNode.object)).toBe(true);
        expect(memberExpressionNode.object).toHaveProperty("name", "_module");
        expect(t.isStringLiteral(memberExpressionNode.property)).toBe(true);
        expect(memberExpressionNode.property).toHaveProperty("value", "foo-bar");
    });
});
