import { NodePath } from "@babel/core"
import chalk from "chalk"

export const splitModuleName = (classname: string, defaultModule: string): { classname: string; module?: string } => {
    if (shouldTransform(classname)) {
        // TODO: throw error if more than one '#' is present
        let [splittedClassName, module] = classname.split("#")
        return {
            classname: splittedClassName.trim(),
            module: module || defaultModule,
        }
    } else {
        return {
            classname: classname.slice(0, classname.length - 1),
        }
    }
}

export const isJSXComponent = (jsxIdentifier: string) => {
    return /^\p{Lu}/u.test(jsxIdentifier)
}

export const shouldTransform = (classname: string) => {
    return !classname.endsWith("#")
}

export const splitClassnames = (classes: string) => {
    return classes.split(" ")
}

export const splitModuleSource = (source: string): { moduleSource: string; moduleName?: string } => {
    if (!source.includes("#")) {
        return {
            moduleSource: source,
        }
    }
    let [moduleSource, moduleName] = source.split("#")
    return { moduleSource, moduleName }
}

export class CSSModuleError extends Error {
    errorMessage: string
    static path: NodePath

    constructor(errorMessage: string) {
        super()
        this.errorMessage = errorMessage
        this.name = chalk.red("CSSModuleError")
        CSSModuleError.path
        this.message = `at (${CSSModuleError.path.node.loc?.start.line}:${CSSModuleError.path.node.loc?.start.column})
        ${this.errorMessage.replace(/ +/g, " ")}
        `.replace(/ +/g, " ")
    }
}
