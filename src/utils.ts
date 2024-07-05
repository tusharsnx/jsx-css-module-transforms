import { NodePath } from "@babel/core";
import chalk from "chalk";

export class CSSModuleError extends Error {
    errorMessage: string;
    static path: NodePath | undefined;

    constructor(errorMessage: string) {
        super();
        this.errorMessage = errorMessage;
        this.name = chalk.red("CSSModuleError");
        this.message = `at (${CSSModuleError.path?.node.loc?.start.line}:${CSSModuleError.path?.node.loc?.start.column}):
        ${this.errorMessage.replace(/ +/g, " ")}
        `.replace(/ +/g, " ");
    }

    static cls(cls: string) {
        return `'${chalk.cyan(cls)}'`;
    }

    static mod(mod: string) {
        return `'${chalk.cyan(mod)}'`;
    }
}
