import * as tsParser from "@typescript-eslint/parser";
import { RuleTester } from "eslint";

import {
    getEnumMemberKey,
    getEnumMemberValue,
    isConstCase,
    isPascalCase,
    rule,
    toDotCase,
} from "../../../src/rules/enum-key-value-convention";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            sourceType: "module",
        },
    },
});

const options = [
    {
        "ContainerName": { key: "PASCAL_CASE", value: "DOT_CASE" },
        "EventName": { key: "PASCAL_CASE", value: "MIRROR_KEY" },
        "ConfigName": { key: "CONST_CASE", value: "MIRROR_KEY" },
    },
];

describe("enum-key-value-convention", () => {
    ruleTester.run("enum-key-value-convention", rule as never, {
        valid: [
            // 1. ContainerName com value dot.case correto.
            {
                code: `enum ContainerName {
                    "SearchPage" = "search.page",
                    "GoogleSearchToSelectionHandler" = "google.search.to.selection.handler",
                }`,
                options,
            },

            // 4. EventName com value == key.
            {
                code: `enum EventName {
                    "SearchEvent" = "SearchEvent",
                }`,
                options,
            },

            // ConfigName com key/value CONST_CASE + MIRROR_KEY corretos.
            {
                code: `enum ConfigName {
                    "USE_HEADLESS" = "USE_HEADLESS",
                }`,
                options,
            },

            // 7. Enum não listado na config, com qualquer key/value.
            {
                code: `enum SomeOtherEnum {
                    "whatever" = "not.matching.anything",
                }`,
                options,
            },

            // Quote test: key sem aspas + value certo.
            {
                code: "enum EventName { Foo = \"Foo\" }",
                options,
            },

            // Quote test: key com aspas + value certo.
            {
                code: "enum EventName { \"Foo\" = \"Foo\" }",
                options,
            },

            // Enum configurado com member sem initializer (numeric-like enum) deve ser ignorado.
            {
                code: "enum EventName { Foo }",
                options,
            },
        ],
        invalid: [
            // 2. ContainerName com value que não bate com a transformação da key.
            {
                code: `enum ContainerName {
                    "SearchPage" = "SearchPage",
                }`,
                options,
                errors: [ { messageId: "invalidValue" } ],
            },

            // 3. ContainerName com key fora de PASCAL_CASE.
            {
                code: `enum ContainerName {
                    "search_page" = "search.page",
                }`,
                options,
                errors: [ { messageId: "invalidKey" } ],
            },

            // 5. EventName com value != key.
            {
                code: `enum EventName {
                    "SearchEvent" = "search.event",
                }`,
                options,
                errors: [ { messageId: "invalidValue" } ],
            },

            // 6. ConfigName com key fora de CONST_CASE.
            {
                code: `enum ConfigName {
                    "appName" = "appName",
                }`,
                options,
                errors: [ { messageId: "invalidKey" } ],
            },

            // Quote test: key sem aspas + value errado.
            {
                code: "enum EventName { Foo = \"Bar\" }",
                options,
                errors: [ { messageId: "invalidValue" } ],
            },

            // Quote test: key com aspas + value errado.
            {
                code: "enum EventName { \"Foo\" = \"Bar\" }",
                options,
                errors: [ { messageId: "invalidValue" } ],
            },
        ],
    });

    test("helpers", () => {
        expect(isPascalCase("SearchPage")).toBeTruthy();
        expect(isPascalCase("search_page")).toBeFalsy();
        expect(isConstCase("USE_HEADLESS")).toBeTruthy();
        expect(isConstCase("appName")).toBeFalsy();
        expect(toDotCase("SearchPage")).toBe("search.page");
        expect(toDotCase("GoogleSearchToSelectionHandler")).toBe("google.search.to.selection.handler");
    });

    test("getEnumMemberKey / getEnumMemberValue return undefined for non literal nodes", () => {
        expect(getEnumMemberKey({
            id: { type: "Identifier", name: "" },
        } as never)).toBe("");
        expect(getEnumMemberKey({
            id: { type: "Literal", value: 1 },
        } as never)).toBeUndefined();
        expect(getEnumMemberValue({
            initializer: undefined,
        } as never)).toBeUndefined();
        expect(getEnumMemberValue({
            initializer: { type: "Literal", value: 1 },
        } as never)).toBeUndefined();
    });
});
