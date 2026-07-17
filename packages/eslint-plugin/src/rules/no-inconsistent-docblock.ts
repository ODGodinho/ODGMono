import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
import type { RuleContext } from "@typescript-eslint/utils/ts-eslint";
import type { Spec } from "comment-parser";

import DocblockHelper from "../helpers/DocblockHelper";

const { RuleCreator: ruleCreator } = ESLintUtils;
const createRule = ruleCreator(
    (name) => `https://example.com/rule/${name}`,
);

export function doesReturnNotMatch(
    codeReturn: TSESTree.TSTypeAnnotation | undefined,
    docblockParameter: Spec[],
    content: string,
): boolean {
    if (!codeReturn) return false;

    const parameterTypeRange = codeReturn.typeAnnotation.range;
    const unionTokenReturn = content.slice(parameterTypeRange[0], parameterTypeRange[1]);

    if (!docblockParameter[0]) return false;

    return unionTokenReturn !== docblockParameter[0].type;
}

export function doesParameterNotMatch(
    codeParameter: TSESTree.Parameter[],
    docblockParameter: Spec[],
    content: string,
): boolean {
    for (const [ index, parameter ] of codeParameter.entries()) {
        const parameterTypeRange = "typeAnnotation" in parameter
            && parameter.typeAnnotation?.typeAnnotation.range;

        if (!parameterTypeRange) continue;

        const unionTokenParameter = content.slice(parameterTypeRange[0], parameterTypeRange[1]);

        if (!docblockParameter[index]) return false;

        const isValidOptional = "optional" in parameter && parameter.optional
            ? `undefined | ${unionTokenParameter}` !== docblockParameter[index].type
            && `${unionTokenParameter} | undefined` !== docblockParameter[index].type
            : unionTokenParameter !== docblockParameter[index].type;

        if (isValidOptional) {
            return true;
        }
    }

    return false;
}

export function methodRule(
    node: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression,
    context: RuleContext<string, unknown[]>,
    docblockHelper: DocblockHelper,
): void {
    const { sourceCode } = context;
    const docblock = docblockHelper.getDocblockNode(sourceCode, node);

    if (!docblock) return;

    const docblockParameter = docblock.parse.tags.filter((tag) => tag.tag === "param");
    const docblockReturn = docblock.parse.tags.filter((tag) => tag.tag === "returns");
    const codeParameter = node.params;

    if (doesParameterNotMatch(codeParameter, docblockParameter, sourceCode.getText())) {
        context.report({
            node,
            messageId: "invalidParamType",
        });
    }

    if (doesReturnNotMatch(node.returnType, docblockReturn, sourceCode.getText())) {
        context.report({
            node,
            messageId: "invalidReturnType",
        });
    }
}

export const rule = createRule({
    name: "no-inconsistent-docblock",
    meta: {
        docs: {
            description: "Function declaration names should start with an upper-case letter.",
        },
        messages: {
            invalidParamType: "@param not match with function type",
            invalidReturnType: "@returns not match with function type",
        },
        type: "suggestion",
        schema: [],
    },
    defaultOptions: [],
    create(context) {
        const docblockHelper = new DocblockHelper();

        return {
            "FunctionDeclaration": (node): void => {
                methodRule(node, context, docblockHelper);
            },
            "FunctionExpression": (node): void => {
                methodRule(node, context, docblockHelper);
            },
        };
    },
});
