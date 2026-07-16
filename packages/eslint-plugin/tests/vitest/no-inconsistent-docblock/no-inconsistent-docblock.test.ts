import { readFile } from "node:fs/promises";

import * as tsParser from "@typescript-eslint/parser";
import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import type { Spec } from "comment-parser";
import { RuleTester } from "eslint";

import {
    doesParameterNotMatch,
    doesReturnNotMatch,
    rule,
} from "../../../src/rules/no-inconsistent-docblock";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            ecmaFeatures: {
                jsx: true,
            },
            ecmaVersion: 2022,
            sourceType: "module",
        },
    },
});

const currentFolder = `${process.cwd()}/tests/vitest/no-inconsistent-docblock/cases`;

describe("no-inconsistent-docblock", async () => {
    const [
        valid1,
        valid2,
        valid3,
        valid4,
        valid5,
        valid6,
        valid7,
        valid8,
        valid9,
        valid10,
        valid11,
        valid12,
        invalid1,
        invalid2,
        invalid3,
        invalid4,
        invalid5,
        invalid6,
    ] = await Promise.all([
        readFile(`${currentFolder}/valid1.ts`, "utf8"),
        readFile(`${currentFolder}/valid2.ts`, "utf8"),
        readFile(`${currentFolder}/valid3.ts`, "utf8"),
        readFile(`${currentFolder}/valid4.ts`, "utf8"),
        readFile(`${currentFolder}/valid5.ts`, "utf8"),
        readFile(`${currentFolder}/valid6.ts`, "utf8"),
        readFile(`${currentFolder}/valid7.ts`, "utf8"),
        readFile(`${currentFolder}/valid8.ts`, "utf8"),
        readFile(`${currentFolder}/valid9.ts`, "utf8"),
        readFile(`${currentFolder}/valid10.ts`, "utf8"),
        readFile(`${currentFolder}/valid11.ts`, "utf8"),
        readFile(`${currentFolder}/valid12.ts`, "utf8"),
        readFile(`${currentFolder}/invalid1.ts`, "utf8"),
        readFile(`${currentFolder}/invalid2.ts`, "utf8"),
        readFile(`${currentFolder}/invalid3.ts`, "utf8"),
        readFile(`${currentFolder}/invalid4.ts`, "utf8"),
        readFile(`${currentFolder}/invalid5.ts`, "utf8"),
        readFile(`${currentFolder}/invalid6.ts`, "utf8"),
    ]);

    ruleTester.run("no-inconsistent-docblock-return", rule as never, {
        valid: [
            {
                code: valid1,
            },
            {
                code: valid2,
            },
            {
                code: valid3,
            },
            {
                code: valid4,
            },
            {
                code: valid5,
            },
            {
                code: valid6,
            },
            {
                code: valid7,
            },
            {
                code: valid8,
            },
            {
                code: valid9,
            },
            {
                code: valid10,
            },
            {
                code: valid11,
            },
            {
                code: valid12,
            },
        ],
        invalid: [
            {
                code: invalid1,
                errors: [
                    {
                        messageId: "invalidParamType",
                    },
                ],
            },
            {
                code: invalid2,
                errors: [
                    {
                        messageId: "invalidParamType",
                    },
                ],
            },
            {
                code: invalid3,
                errors: [
                    {
                        messageId: "invalidReturnType",
                    },
                ],
            },
            {
                code: invalid4,
                errors: [
                    {
                        messageId: "invalidReturnType",
                    },
                ],
            },
            {
                code: invalid5,
                errors: [
                    {
                        messageId: "invalidParamType",
                    },
                ],
            },
            {
                code: invalid6,
                errors: [
                    {
                        messageId: "invalidParamType",
                    },
                ],
            },
        ],
    });

    test("doesParameterNotMatch", () => {
        const parameter = {
            type: AST_NODE_TYPES.AssignmentPattern,
            typeAnnotation: {
                type: AST_NODE_TYPES.TSTypeAnnotation,
                range: [ 0, 0 ],
                typeAnnotation: {
                    type: AST_NODE_TYPES.TSFunctionType,
                    range: [ 0, 0 ],
                    params: [],
                    loc: {
                        start: { line: 0, column: 0 },
                        end: { line: 0, column: 0 },
                    },
                },
            },
        };

        expect(doesParameterNotMatch(
            [ parameter as unknown as TSESTree.Parameter ],
            [ { type: "" } as unknown as Spec ],
            "",
        )).toBeFalsy();

        expect(doesReturnNotMatch(
            parameter as unknown as TSESTree.TSTypeAnnotation,
            [ { type: "" } as unknown as Spec ],
            "",
        )).toBeFalsy();
    });

    test("Test Not TypeNotation", () => {
        const parameter = {
            type: AST_NODE_TYPES.AssignmentPattern,
            typeAnnotation: undefined,
        };

        expect(doesParameterNotMatch(
            [ parameter as unknown as TSESTree.Parameter ],
            [ { type: "" } as unknown as Spec ],
            "",
        )).toBeFalsy();
    });
});
