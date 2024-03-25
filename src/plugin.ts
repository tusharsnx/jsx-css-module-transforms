import type { NodePath, PluginObj } from "@babel/core";
import { types as t } from "@babel/core";
import type babel from "@babel/core";
import chalk from "chalk";

import { getImportInfo, getTemplFromStrCls } from "./transforms";
import { CSSModuleError } from "./utils";

function ImportDeclaration(path: NodePath<t.ImportDeclaration>, state: PluginPass) {
    // we're only interested in scss/sass/css imports
    if (!/.module.(s[ac]ss|css)(:.*)?$/iu.test(path.node.source.value)) {
        return;
    }

    // saving path for error messages
    CSSModuleError.path = path;

    if (path.node.specifiers.length > 1 && !t.isImportDefaultSpecifier(path.node.specifiers[0])) {
        // Syntax: import { classA, classB } from "./m1.module.css"
        throw new CSSModuleError(`Import CSS-Module as a default import on '${chalk.cyan(path.node.source.value)}'`);
    }
    if (path.node.specifiers.length > 1) {
        // Syntax: import style, { classA, classB } from "./m1.module.css"
        throw new CSSModuleError(`More than one import found on '${chalk.cyan(path.node.source.value)}'`);
    }

    let moduleInfo = getImportInfo(path.node);
    if (moduleInfo.hasSpecifier) {
        let importSpecifier = path.node.specifiers[0].local;
        if (importSpecifier.name in state.pluginState.modules.namedModules) {
            throw new CSSModuleError(`CSS-Module ${chalk.yellow(`'${importSpecifier.name}'`)}  has already been declared`);
        }

        // saving new module
        state.pluginState.modules.namedModules[importSpecifier.name] = importSpecifier.name;
    } else if (moduleInfo.default) {
        if (state.pluginState.modules.defaultModule) {
            throw new CSSModuleError(`Only one default css-module import is allowed. Provide names for all except the default module`);
        }

        let importSpecifier = path.scope.generateUidIdentifier("style");
        let newSpecifiers = [t.importDefaultSpecifier(importSpecifier)];
        let newImportDeclaration = t.importDeclaration(newSpecifiers, t.stringLiteral(path.node.source.value));
        path.replaceWith<t.ImportDeclaration>(newImportDeclaration);

        // saving this module as the default module for the current translation unit.
        state.pluginState.modules.defaultModule = importSpecifier.name;
    } else {
        if (moduleInfo.moduleName in state.pluginState.modules.namedModules) {
            throw new CSSModuleError(`CSS-Module ${chalk.yellow(`'${moduleInfo.moduleName}'`)} has already been declared`);
        }

        let importSpecifier = path.scope.generateUidIdentifier(moduleInfo.moduleName);
        let newSpecifiers = [t.importDefaultSpecifier(importSpecifier)];
        let newImportDeclaration = t.importDeclaration(newSpecifiers, t.stringLiteral(path.node.source.value));
        path.replaceWith<t.ImportDeclaration>(newImportDeclaration);

        // saving new module
        state.pluginState.modules.namedModules[moduleInfo.moduleName] = importSpecifier.name;
    }

    // strips away module name from the source
    path.node.source.value = moduleInfo.moduleSource; // this inplace replacment does not causes any problem with the ast
}

function JSXAttribute(path: NodePath<t.JSXAttribute>, state: PluginPass) {
    const firstNamedModule = getFirstNamedModule(state.pluginState.modules.namedModules)

    // we only support className attribute having a string value
    if (path.node.name.name != "className" || !t.isStringLiteral(path.node.value)) {
        return;
    }
    // className values should be transformed only if we ever found a css module.
    // FirstNamedModule signifies that we found at least one named css module.
    if (!state.pluginState.modules.defaultModule && !firstNamedModule) {
        return;
    }

    // saving path for error messages
    CSSModuleError.path = path;

    // if no default modules is available, make the first modules as default
    if (!state.pluginState.modules.defaultModule) {
        if (firstNamedModule) {
            state.pluginState.modules.defaultModule = state.pluginState.modules.namedModules[firstNamedModule];
        }
    }

    let fileCSSModules = state.pluginState.modules;
    let templateLiteral = getTemplFromStrCls(path.node.value.value, fileCSSModules);
    let jsxExpressionContainer = t.jsxExpressionContainer(templateLiteral);
    let newJSXAttr = t.jsxAttribute(t.jsxIdentifier("className"), jsxExpressionContainer);
    path.replaceWith(newJSXAttr);
    path.skip();
}

function API({ types: t }: typeof babel): PluginObj<PluginPass> {
    /**
     *  Sets up the initial state of the plugin
     */
    function pre(this: PluginPass): void {
        this.pluginState = {
            modules: {
                namedModules: {},
            },
        };
    }

    return {
        pre,
        visitor: {
            ImportDeclaration,
            JSXAttribute,
        },
    };
}

export default API;

function getFirstNamedModule(namedModules: Modules["namedModules"]): string | null {
    for (let module in namedModules) return module;
    return null;
}

export type Modules = {
    defaultModule?: string;
    namedModules: { [moduleName: string]: string };
};

type PluginState = {
    modules: Modules;
};

interface PluginPass extends babel.PluginPass {
    pluginState: PluginState;
}
