import type { Node } from "@babel/core";
import chalk from "chalk";

export class CSSModuleError extends Error {
    static filename?: string;
    static node?: Node;

    constructor(errorMessage: string) {
        super();
        this.name = chalk.red("CSSModuleError");
        this.message = errorMessage;
        this.message += "\n    at " + (CSSModuleError.filename ?? "<anonymous>") + ":" + CSSModuleError.node?.loc?.start.line + ":" + CSSModuleError.node?.loc?.start.column;
    }
}
