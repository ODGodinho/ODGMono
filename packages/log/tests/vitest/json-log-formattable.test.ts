import { isJSONLogFormattable, LogLevel } from "src";

describe("isJSONLogFormattable", () => {
    const base = {
        type: LogLevel.INFO,
        index: "i",
        instance: "n",
        message: "m",
        createdAt: new Date(),
    };

    test("returns false for null and non-objects", () => {
        expect(isJSONLogFormattable(null)).toBe(false);
        expect(isJSONLogFormattable("x")).toBe(false);
        expect(isJSONLogFormattable(1)).toBe(false);
    });

    test("returns false when required string fields are wrong", () => {
        expect(isJSONLogFormattable({ ...base, index: 1 })).toBe(false);
    });

    test("check is request is valid", () => {
        expect(isJSONLogFormattable({ ...base, request: 1 })).toBe(false);
        expect(isJSONLogFormattable({ ...base, request: {} })).toBe(true);
    });

    test("returns false when message is not a string", () => {
        expect(isJSONLogFormattable({ ...base, message: 1 as unknown as string })).toBe(false);
    });

    test("returns true for a valid payload", () => {
        expect(isJSONLogFormattable(base)).toBe(true);
    });
});
