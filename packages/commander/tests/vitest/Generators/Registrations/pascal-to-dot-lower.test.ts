import { describe, expect, test } from "vitest";

import {
    pascalCaseToDotLower,
    resolveContainerEnumMemberValue,
} from "#app/Registrations/pascal-to-dot-lower";

describe("pascal-to-dot-lower", () => {
    test("pascalCaseToDotLower splits PascalCase into dot.lower", () => {
        expect(pascalCaseToDotLower("ExampleEventListener")).toBe("example.event.listener");
    });

    test("resolveContainerEnumMemberValue uses override when set", () => {
        expect(resolveContainerEnumMemberValue("custom.key", "ExampleEventListener")).toBe("custom.key");
    });

    test("resolveContainerEnumMemberValue falls back to dot.lower", () => {
        expect(resolveContainerEnumMemberValue(undefined, "ExampleEventListener")).toBe(
            "example.event.listener",
        );
    });
});
