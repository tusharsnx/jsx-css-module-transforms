import * as t from "@babel/types";
import chalk from "chalk";

import { CSSModuleError, splitClsName, splitModuleSource } from "./utils";
import type { Modules } from "./index";

/**
 * generates template literal using css-module classes as expressions
 * and global classes as quasis
 *
 * @param cssModExpr array of string(representing global class) and memberExpression(representing css-module class)
 */
function createTemplateLiteral(cssModExpr: (string | t.MemberExpression)[]) {
    let templateLiteral: t.TemplateLiteral = t.templateLiteral([t.templateElement({ raw: "", cooked: "" })], []); // quasis must be 1 more than expression while creating templateLiteral

    cssModExpr.forEach((expression) => {
        if (typeof expression === "string") {
            // overwrite the previous quasis element to include this classname
            templateLiteral.quasis[templateLiteral.quasis.length - 1].value.raw += expression + " ";
            templateLiteral.quasis[templateLiteral.quasis.length - 1].value.cooked += expression + " "; // assigning cooked value is not needed but it saves from weird edge cases where plugins only uses cooked value and ignores raw value (eg. @babel/preset-env).
            return;
        }

        let spaceTemplateElement = t.templateElement({ raw: " ", cooked: " " });
        templateLiteral.expressions.push(expression);
        templateLiteral.quasis.push(spaceTemplateElement);
    });

    // removing extra spaces, this way we don't have to figure out the last quasis added was a class or a space
    templateLiteral.quasis[templateLiteral.quasis.length - 1].value.raw = templateLiteral.quasis[templateLiteral.quasis.length - 1].value.raw.trimEnd();
    templateLiteral.quasis[templateLiteral.quasis.length - 1].value.cooked = templateLiteral.quasis[templateLiteral.quasis.length - 1].value.cooked?.trimEnd();
    // last quasis element should have tail as true
    templateLiteral.quasis[templateLiteral.quasis.length - 1].tail = true;

    return templateLiteral;
}
/**
 * creates MemberExpression using module as object and classname as property.
 *
 * eg. `<module-name>[<class-name>]`
 */
export function createModuleMemberExpression(classname: string, module: string, modules: Modules): t.MemberExpression {
    let moduleIdentifier: t.Identifier;
    let classnameStringLiteral = t.stringLiteral(classname);

    if (module == modules.defaultModule) {
        moduleIdentifier = t.identifier(modules.defaultModule);
    } else {
        if (!(module in modules.namedModules)) {
            throw new CSSModuleError(`Module '${chalk.green(module)}' on class '${chalk.cyan(classname)}' not found`);
        }

        moduleIdentifier = t.identifier(modules.namedModules[module]);
    }

    return t.memberExpression(moduleIdentifier, classnameStringLiteral, true);
}

/**
 *
 * generates template literal from string classes
 *
 * @param classString string containing classes for the className attribute (eg. "classA classB")
 * @returns templateLiteral based on string classes and modules
 */
export function getTemplFromStrCls(classString: string, modules: Modules): t.TemplateLiteral {
    if (!modules.defaultModule) {
        throw new CSSModuleError("No default css-module found");
    }

    let classList = classString.split(" ");
    let splittedClass = classList.map((classname) => {
        return splitClsName(classname, modules.defaultModule ?? "");
    });
    let classAsModule = splittedClass.map((classObj) => {
        if (classObj.module) {
            return createModuleMemberExpression(classObj.classname, classObj.module, modules);
        } else {
            return classObj.classname;
        }
    });
    return createTemplateLiteral(classAsModule);
}

/**
 * A helper function to identify Kind of import source.
 * @param statement import statement from the source
 * @returns object representing type of import used and specifier present
 */
export function getImportInfo(statement: t.ImportDeclaration): DefaultModule | ModuleWithSpecifier | NamedModule {
    let module = splitModuleSource(statement.source.value);

    // .length is either 0 or 1.
    if (statement.specifiers.length) {
        // Syntax: import style from "./m1.module.css"
        //
        // all the checks are done inside the visitor for the
        // presence of only default specifier in case if any specifier is present
        return {
            moduleSource: module.moduleSource,
            default: false,
            hasSpecifier: true,
        };
    } else if (!module.moduleName) {
        // Syntax: import "./moduleA.module.css"
        return {
            moduleSource: module.moduleSource,
            default: true,
            hasSpecifier: false,
        };
    } else {
        // Syntax: import "./moduleA.module.css:m1"
        return {
            moduleSource: module.moduleSource,
            moduleName: module.moduleName,
            default: false,
            hasSpecifier: false,
        };
    }
}

type DefaultModule = {
    moduleSource: string;
    default: true;
    hasSpecifier: false;
};

type NamedModule = {
    moduleSource: string;
    moduleName: string;
    default: false;
    hasSpecifier: false;
};

type ModuleWithSpecifier = {
    moduleSource: string;
    default: false;
    hasSpecifier: true;
};
