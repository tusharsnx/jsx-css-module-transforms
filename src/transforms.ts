import * as t from "@babel/types"

import { splitModuleName, splitModuleSource } from "./utils.js"
import { Modules } from "../types/global"

/**
 * creates a template literal by adding css-module classes as expression
 * and global classes as quasis
 */
const createTemplateLiteral = (cssModuleExpressions: (string | t.MemberExpression)[]) => {
    let templateLiteral: t.TemplateLiteral = t.templateLiteral([t.templateElement({ raw: "", cooked: "" })], []) // quasis must be 1 more than expression while creating templateLiteral

    cssModuleExpressions.forEach((expression) => {
        if (typeof expression === "string") {
            // overwrite the previous quasis element to include this classname
            templateLiteral.quasis[templateLiteral.quasis.length - 1].value.raw += expression + " "
            templateLiteral.quasis[templateLiteral.quasis.length - 1].value.cooked += expression + " " // assigning cooked value is not needed but it saves from weird edge cases where plugins only uses cooked value and ignores raw value (eg. @babel/preset-env).
            return
        }

        let spaceTemplateElement = t.templateElement({ raw: " ", cooked: " " })
        templateLiteral.expressions.push(expression)
        templateLiteral.quasis.push(spaceTemplateElement)
    })

    // removing extra spaces, this way we don't have to figure out the last quasis added was a class or a space
    templateLiteral.quasis[templateLiteral.quasis.length - 1].value.raw =
        templateLiteral.quasis[templateLiteral.quasis.length - 1].value.raw.trimEnd()
    templateLiteral.quasis[templateLiteral.quasis.length - 1].value.cooked =
        templateLiteral.quasis[templateLiteral.quasis.length - 1].value.cooked?.trimEnd()
    // last quasis element should have tail as true
    templateLiteral.quasis[templateLiteral.quasis.length - 1].tail = true

    return templateLiteral
}
/**
 * creates MemberExpression with module as the object and classname as the property.
 * eg. _module["classname"]
 */
export const createModuleMemberExpression = (
    classname: string,
    module: string,
    modules: Modules
): t.MemberExpression => {
    let moduleIdentifier: t.Identifier
    let classnameStringLiteral = t.stringLiteral(classname)

    if (module == modules.defaultModule) {
        moduleIdentifier = t.identifier(modules.defaultModule)
    } else {
        if (!(module in modules.namedModules))
            throw new Error(`CSSModuleError: module '${module}' on class '${classname}' not found`)

        moduleIdentifier = t.identifier(modules.namedModules[module])
    }

    return t.memberExpression(moduleIdentifier, classnameStringLiteral, true)
}

/**
 *
 * creates template literal out of classString that will be used to replace the original
 * classes in the classname attribute
 *
 * @param classString: classes mentioned in the source
 */
export const getTemplateFromStringClasses = (classString: string, modules: Modules): t.TemplateLiteral => {
    // let { defaultModule, namedModules: moduleNames } = modules
    if (!modules.defaultModule) {
        throw new Error("No default css-module found")
    }

    let classList = classString.split(" ")
    let splittedClass = classList.map((classname) => {
        return splitModuleName(classname, modules.defaultModule!) // typescript still complains even though we throw error when defaultModule is undefined
    })
    let classAsModule = splittedClass.map((classObj) => {
        if (classObj.module) return createModuleMemberExpression(classObj.classname, classObj.module, modules)
        else return classObj.classname
    })
    return createTemplateLiteral(classAsModule)
}

export const getImportInfo = (statement: t.ImportDeclaration): DefaultModule | ModuleWithSpecifier | NamedModule => {
    let module = splitModuleSource(statement.source.value)
    if (statement.specifiers.length) {
        // all the checks are done inside the visitor for the
        // presence of only default specifier in case if any specifier is present
        // eg. import style from "./m1.module.css"
        return {
            moduleSource: module.moduleSource,
            default: false,
            hasSpecifier: true,
        }
    } else if (!module.moduleName) {
        // eg. import "./moduleA.module.css"

        return {
            moduleSource: module.moduleSource,
            default: true,
            hasSpecifier: false,
        }
    }

    // eg. import "./moduleA.module.css#m1"
    return {
        moduleSource: module.moduleSource,
        moduleName: module.moduleName,
        default: false,
        hasSpecifier: false,
    }
}

type DefaultModule = {
    moduleSource: string
    default: true
    hasSpecifier: false
}

type NamedModule = {
    moduleSource: string
    moduleName: string
    default: false
    hasSpecifier: false
}

type ModuleWithSpecifier = {
    moduleSource: string
    default: false
    hasSpecifier: true
}
