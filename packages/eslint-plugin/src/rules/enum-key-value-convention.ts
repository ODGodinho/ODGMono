import { AST_NODE_TYPES, ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
import type { RuleContext } from "@typescript-eslint/utils/ts-eslint";

const { RuleCreator: ruleCreator } = ESLintUtils;
const createRule = ruleCreator(
    (name) => `https://example.com/rule/${name}`,
);

const PASCAL_CASE_REGEX = /^[A-Z][0-9A-Za-z]*$/u;
const CONST_CASE_SEGMENT_REGEX = /^[A-Z][0-9A-Z]*$/u;

export type KeyConvention = "CONST_CASE" | "PASCAL_CASE";

export type ValueConvention = "DOT_CASE" | "MIRROR_KEY";

export interface EnumConvention {
    key: KeyConvention;
    value: ValueConvention;
}

export type Options = [ Partial<Record<string, EnumConvention>> ];

export function isPascalCase(value: string): boolean {
    return PASCAL_CASE_REGEX.test(value);
}

export function isConstCase(value: string): boolean {
    return value.split("_").every((segment) => CONST_CASE_SEGMENT_REGEX.test(segment));
}

export function isKeyValid(key: string, convention: KeyConvention): boolean {
    if (convention === "PASCAL_CASE") return isPascalCase(key);

    return isConstCase(key);
}

export function toDotCase(key: string): string {
    let result = "";

    for (let index = 0; index < key.length; index += 1) {
        const char = key[index];
        const previous = index > 0 ? key[index - 1] : "";
        const next = index + 1 < key.length ? key[index + 1] : "";
        const isUpper = char >= "A" && char <= "Z";
        const isCamelBoundary = isUpper && previous >= "a" && previous <= "z";
        const isAcronymBoundary = isUpper
            && previous >= "A" && previous <= "Z"
            && next >= "a" && next <= "z";

        result += isCamelBoundary || isAcronymBoundary ? `.${char}` : char;
    }

    return result.toLowerCase();
}

export function isValueValid(key: string, value: string, convention: ValueConvention): boolean {
    if (convention === "MIRROR_KEY") return value === key;

    return value === toDotCase(key);
}

export function getEnumMemberKey(member: TSESTree.TSEnumMember): string | undefined {
    if (member.id.type === AST_NODE_TYPES.Identifier) return member.id.name;

    return typeof member.id.value === "string" ? member.id.value : undefined;
}

export function getEnumMemberValue(member: TSESTree.TSEnumMember): string | undefined {
    const { initializer } = member;

    if (!initializer) return undefined;

    if (initializer.type === AST_NODE_TYPES.Literal && typeof initializer.value === "string") {
        return initializer.value;
    }

    return undefined;
}

export function checkEnumMember(
    member: TSESTree.TSEnumMember,
    enumName: string,
    convention: EnumConvention,
    context: RuleContext<"invalidKey" | "invalidValue", Options>,
): void {
    const key = getEnumMemberKey(member);
    const value = getEnumMemberValue(member);

    if (key === undefined || value === undefined) return;

    if (!isKeyValid(key, convention.key)) {
        context.report({
            node: member,
            messageId: "invalidKey",
            data: {
                enumName,
                key,
                convention: convention.key,
            },
        });

        return;
    }

    if (!isValueValid(key, value, convention.value)) {
        const expected = convention.value === "MIRROR_KEY" ? key : toDotCase(key);
        const expectation = convention.value === "MIRROR_KEY"
            ? "mirror its key"
            : "be the dot.case transformation of its key";

        context.report({
            node: member,
            messageId: "invalidValue",
            data: {
                enumName,
                key,
                value,
                expected,
                expectation,
            },
        });
    }
}

export const rule = createRule<Options, "invalidKey" | "invalidValue">({
    name: "enum-key-value-convention",
    meta: {
        docs: {
            description: "Enforce key and value naming conventions on configured name enums "
                + "(e.g. ContainerName, EventName, ConfigName).",
        },
        messages: {
            invalidKey: "Enum \"{{enumName}}\" member key \"{{key}}\" must follow the {{convention}} convention.",
            invalidValue: "Enum \"{{enumName}}\" member \"{{key}}\" value must "
                + "{{expectation}}, expected \"{{expected}}\" but got \"{{value}}\".",
        },
        type: "suggestion",
        schema: [
            {
                type: "object",
                additionalProperties: {
                    type: "object",
                    properties: {
                        key: {
                            "type": "string",
                            "enum": [ "PASCAL_CASE", "CONST_CASE" ],
                        },
                        value: {
                            "type": "string",
                            "enum": [ "MIRROR_KEY", "DOT_CASE" ],
                        },
                    },
                    required: [ "key", "value" ],
                    additionalProperties: false,
                },
            },
        ],
    },
    defaultOptions: [ {} ],
    create: (context, [ options ]) => ({
        "TSEnumDeclaration": (node): void => {
            const enumName = node.id.name;
            const convention = options[enumName];

            if (!convention) return;

            for (const member of node.body.members) {
                checkEnumMember(member, enumName, convention, context);
            }
        },
    }),
});
