import * as t from "@babel/types";
import chalk from "chalk";

import { CSSModuleError } from "./utils.js";
import type { Modules } from "./plugin.js";

type TransformImportResult = {
    transformedNode: t.ImportDeclaration;
    generatedSpecifier: boolean;
    moduleLabel?: string;
};

/**
 * Generates a replacement node for the given import declaration after
 * removing any plugin specific syntax.
 * @param importDecalaration The import declaration to transform
 * @param idGenerator A helper callback to generate a unique identifier(/variable)
 *                    to use as the import specifier in case none was provided
 */
export function transformImport(node: t.ImportDeclaration, idGenerator: (hint: string) => t.Identifier): TransformImportResult {
    let modSrc = node.source.value;

    // We only support having only a default specifier in the
    // import declaration. It's okay to have no specifiers.
    const nSpecifiers = node.specifiers.length;
    if (nSpecifiers > 1 || (nSpecifiers == 1 && !t.isImportDefaultSpecifier(node.specifiers[0]))) {
        throw new CSSModuleError(`Invalid CSS module import '${chalk.yellow(modSrc)}': Only default specifiers are allowed`);
    }

    // Extract module label and real source from the given import source
    const SourcePattern = /(?<moduleLabel>.+?):(?<moduleSource>.+)/;
    const matches = modSrc.match(SourcePattern);

    let modLabel: string | undefined;
    if (matches && matches.groups) {
        // Update the module source with the real module source
        modSrc = matches.groups["moduleSource"];
        modLabel = matches.groups["moduleLabel"];
    }

    const hasSpecifier = !!nSpecifiers;
    const newImportSpecId = hasSpecifier ? t.identifier(node.specifiers[0].local.name) : idGenerator(modLabel || "style");
    const newImportDefSpec = t.importDefaultSpecifier(newImportSpecId);
    const specifiers = [newImportDefSpec];
    const newModSrc = t.stringLiteral(modSrc);
    const newNode = t.importDeclaration(specifiers, newModSrc);

    return {
        transformedNode: newNode,
        generatedSpecifier: !hasSpecifier,
        moduleLabel: modLabel,
    };
}

/**
 * Generates a template literal as a result of transformation applied to the given classNames
 * @param classNames The string we got from the `className` JSX attribute
 * @param modules  The CSS modules found in the file
 */
export function transformClassNames(classNames: string, modules: Modules): t.TemplateLiteral {
    let quasis: t.TemplateElement[] = [];
    let expressions: t.Expression[] = [];

    // Template literals uses alternating quasis and expressions to build
    // the final template literal. They start and end with a quasis.
    // So, if quasis = [q1, q2, q3] and expressions = [e1, e2], the
    // final template literal will be: <q1><e1><q2><e2><q3>
    let quasisStr = "";

    const addExpression = (mod: string, cn: string) => {
        // Add the accumulated quasis string.
        // Always add the cooked value as some transpilers exclusively
        // use it while ignoring the raw value.
        let ele = t.templateElement({ raw: quasisStr, cooked: quasisStr });
        quasis.push(ele);

        // Reset the quasis string -- but with a space so that there's always
        // a space between two expressions in the final template string.
        quasisStr = " ";

        // A classname like '.my-class-a' can be accessed from the css module style object in two ways:
        // - Using dot notation, but remove the dashes from the classname and camelCase it: style.myClassA.
        // - Using bracket notation: style["my-class-a"].
        // The latter has the benefit that we don't have to transform the classname, and it can be used directly
        // in the member expression as the property name. Set `computed` to true to use the bracket notation.
        const expr = t.memberExpression(t.identifier(mod), t.stringLiteral(cn), true);

        expressions.push(expr);
    };

    classNames.split(" ").forEach((className) => {
        if (!className) {
            return;
        }

        if (className.startsWith(":") || className.endsWith(":")) {
            throw new CSSModuleError(`Invalid classname '${className}': Classname can't start or end with ':'`);
        }

        const ClassNamePattern = /(?<moduleLabel>.+?):(?<className>.+)/;
        const matches = className.match(ClassNamePattern);

        if (!matches || !matches.groups) {
            // ClassName uses default module as no module label was provided

            if (!modules.defaultModule) {
                throw new CSSModuleError(`No default module found in the file to use with class '${className}'`);
            }

            addExpression(modules.defaultModule, className);
            return;
        }

        // Named or global module

        let modLabel = matches.groups["moduleLabel"];
        let cn = matches.groups["className"];

        if (!modLabel || !cn) {
            throw new CSSModuleError(`Invalid classname: '${className}'`);
        }

        // Global classname
        const GlobalClassNameLabel = "g";
        if (modLabel === GlobalClassNameLabel) {
            // Classnames tagged with the global label are left unchanged.
            // Add them to the quasis string and bail.
            quasisStr += cn + " ";
            return;
        }

        // Named module
        let module = modules.namedModules[modLabel];
        if (!module) {
            throw new CSSModuleError(`Module matching label '${chalk.green(modLabel)}' on '${chalk.cyan(className)}' not found`);
        }
        addExpression(module, cn);
    });

    // Trim extra spaces at the end of the quasis
    quasisStr = quasisStr.trimEnd();
    // Add the last quasis to compelete the alternating sequence.
    // Also, mark it as the tail element.
    const elem = t.templateElement({ raw: quasisStr, cooked: quasisStr }, true);
    quasis.push(elem);

    return t.templateLiteral(quasis, expressions);
}
