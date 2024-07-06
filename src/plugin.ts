import type { NodePath, PluginObj } from "@babel/core";
import { types as t } from "@babel/core";
import type babel from "@babel/core";
import chalk from "chalk";

import { transformClassNames, transformImport } from "./transforms.js";
import { CSSModuleError } from "./utils.js";

function ImportDeclaration(path: NodePath<t.ImportDeclaration>, { pluginState }: PluginPass) {
    // saving node for error messages
    CSSModuleError.node = path.node;

    // we're only interested in scss/sass/css imports
    if (!/.module.(s[ac]ss|css)(:.*)?$/iu.test(path.node.source.value)) {
        return;
    }

    // 1. Transform import declaration
    const idGenerator = (hint: string) => path.scope.generateUidIdentifier(hint);
    const res = transformImport(path.node, idGenerator);
    path.replaceWith(res.transformedNode);
    path.skip();

    // 2. Add CSS module to the list
    const importSpecifier = res.transformedNode.specifiers[0].local.name;
    if (res.generatedSpecifier) {
        if (res.moduleLabel) {
            addCheckedModule(res.moduleLabel, importSpecifier, pluginState.modules);
        } else {
            // this is a default module
            addCheckedDefaultModule(importSpecifier, pluginState.modules);
        }
    } else {
        // Verify that the module label is unique.
        // Prevents scenarios where the same value is used as both a module
        // label and an import specifier in different import declarations.
        addCheckedModule(importSpecifier, importSpecifier, pluginState.modules);

        if (res.moduleLabel && res.moduleLabel != importSpecifier) {
            // Make module label an alias to the provided specifier
            addCheckedModule(res.moduleLabel, importSpecifier, pluginState.modules);
        }
    }
}

function JSXAttribute(path: NodePath<t.JSXAttribute>, { pluginState }: PluginPass) {
    // saving node for error messages
    CSSModuleError.node = path.node;

    const firstNamedModule = getFirstNamedModule(pluginState.modules.namedModules);

    // we only support className attribute having a string value
    if (path.node.name.name != "className" || !path.node.value || !t.isStringLiteral(path.node.value)) {
        return;
    }
    // className values should be transformed only if we ever found a css module.
    // FirstNamedModule signifies that we found at least one named css module.
    if (!pluginState.modules.defaultModule && !firstNamedModule) {
        return;
    }

    // if no default modules is available, make the first modules as default
    if (!pluginState.modules.defaultModule) {
        if (firstNamedModule) {
            pluginState.modules.defaultModule = pluginState.modules.namedModules[firstNamedModule];
        }
    }

    let classNames = path.node.value.value;
    let templateLiteral = transformClassNames(classNames, pluginState.modules);
    let jsxExpressionContainer = t.jsxExpressionContainer(templateLiteral);
    let newJSXAttr = t.jsxAttribute(t.jsxIdentifier("className"), jsxExpressionContainer);
    path.replaceWith(newJSXAttr);
    path.skip();
}

function API(): PluginObj<PluginPass> {
    // Set up the initial state for the plugin
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

function addCheckedModule(moduleLabel: string, module: string, modules: Modules) {
    if (moduleLabel in modules.namedModules) {
        throw new CSSModuleError(`Duplicate CSS module '${chalk.yellow(module)}' found`);
    }
    modules.namedModules[moduleLabel] = module;
}

function addCheckedDefaultModule(module: string, modules: Modules) {
    if (modules.defaultModule) {
        throw new CSSModuleError(`Only one default css-module import is allowed. Provide names for all except the default module`);
    }
    modules.defaultModule = module;
}

export default API;

function getFirstNamedModule(namedModules: Modules["namedModules"]): string | null {
    for (let module in namedModules) return module;
    return null;
}

type CSSModuleLabel = string;
type CSSModuleIdentifier = string;
export type Modules = {
    defaultModule?: string;
    namedModules: { [moduleLabel: CSSModuleLabel]: CSSModuleIdentifier };
};

type PluginState = {
    modules: Modules;
};

interface PluginPass extends babel.PluginPass {
    pluginState: PluginState;
}
