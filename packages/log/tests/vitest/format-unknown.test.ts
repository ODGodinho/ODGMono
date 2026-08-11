import { formatUnknown } from "#app";

function namedFunction(): number {
    return 123;
}

function anonymousFunction(): void {
    // No-op, only used to assert the "anonymous" fallback below.
}

Object.defineProperty(anonymousFunction, "name", { value: "" });

describe("formatUnknown.test.ts", () => {
    test("Returns string as-is", () => {
        expect(formatUnknown("hello")).toBe("hello");
    });

    test("Returns Error stack when available", () => {
        const error = new Error("boom");

        expect(formatUnknown(error)).toBe(error.stack);
    });

    test("Returns Error message when stack is unavailable", () => {
        const error = new Error("boom");

        error.stack = undefined;

        expect(formatUnknown(error)).toBe("boom");
    });

    test("Serializes plain object as JSON", () => {
        expect(formatUnknown({ key: 1 })).toBe(JSON.stringify({ key: 1 }));
    });

    test("Falls back to String() when JSON.stringify throws", () => {
        const circular: Record<string, unknown> = {};

        circular.self = circular;

        expect(formatUnknown(circular)).toBe("[object Object]");
    });

    test("Keeps top-level BigInt/Symbol/function/undefined as a plain placeholder", () => {
        expect(formatUnknown(7n)).toBe("7n");
        expect(formatUnknown(Symbol("test"))).toBe("Symbol(test)");
        expect(formatUnknown(undefined)).toBe("[undefined]");
        expect(formatUnknown(namedFunction)).toBe("[Function: namedFunction]");
        expect(formatUnknown(anonymousFunction)).toBe("[Function: anonymous]");
    });

    test("Keeps nested BigInt/undefined/functions as a readable JSON placeholder instead of dropping them", () => {
        expect(formatUnknown({ big: 7n })).toBe("{\"big\":\"7n\"}");
        expect(formatUnknown({ id: Symbol("nested") })).toBe("{\"id\":\"Symbol(nested)\"}");
        expect(formatUnknown({ value: undefined })).toBe("{\"value\":\"[undefined]\"}");
        expect(formatUnknown({ handler: namedFunction })).toBe("{\"handler\":\"[Function: namedFunction]\"}");
        expect(formatUnknown({ handler: () => 123 })).toBe("{\"handler\":\"[Function: handler]\"}");
        expect(formatUnknown({ handler: anonymousFunction })).toBe("{\"handler\":\"[Function: anonymous]\"}");
    });
});
