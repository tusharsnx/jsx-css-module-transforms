import { NodePath } from "@babel/core"
import chalk from "chalk"

/**
 * splits full classname (with ':') into classname and module name
 *
 * @param classname full classname with module
 * @param defaultModule default module for the file
 * @returns classname and module name used
 */
export const splitClsName = (classname: string, defaultModule: string): { classname: string; module?: string } => {
    if (shouldTransform(classname)) {
        // TODO: throw error if more than one sep is present, or use last sep in the classname to split
        let [splittedClassName, module] = classname.split(":")
        if (module === "") {
            throw new CSSModuleError(`no module name found after ':' on ${CSSModuleError.cls(classname)}`)
        }
        return {
            classname: splittedClassName.trim(),
            module: module || defaultModule,
        }
    } else {
        // global class
        return {
            classname: classname.slice(0, classname.length - 2),
        }
    }
}

export const shouldTransform = (classname: string) => {
    return !classname.endsWith(":g")
}

export const splitClassnames = (classes: string) => {
    return classes.split(" ")
}

export const splitModuleSource = (source: string): { moduleSource: string; moduleName?: string } => {
    if (!source.includes(":")) {
        return {
            moduleSource: source,
        }
    }
    let [moduleSource, moduleName] = source.split(":")
    return { moduleSource, moduleName }
}

export class CSSModuleError extends Error {
    errorMessage: string
    static path: NodePath | undefined

    constructor(errorMessage: string) {
        super()
        this.errorMessage = errorMessage
        this.name = chalk.red("CSSModuleError")
        this.message = `at (${CSSModuleError.path?.node.loc?.start.line}:${
            CSSModuleError.path?.node.loc?.start.column
        }): 
        ${this.errorMessage.replace(/ +/g, " ")}
        `.replace(/ +/g, " ")
    }

    static cls(cls: string) {
        return `'${chalk.cyan(cls)}'`
    }

    static mod(mod: string) {
        return `'${chalk.cyan(mod)}'`
    }
}
