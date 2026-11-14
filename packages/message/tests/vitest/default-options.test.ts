import { Methods, ODGMessage } from "../../src/index.ts";

describe("ODGMessage.defaultOptions", () => {
    test("default values", () => {
        const { validateStatus, ...defaults } = ODGMessage.defaultOptions;

        expect(defaults).toStrictEqual({
            method: Methods.GET,
            headers: { accept: "application/json, text/plain, */*" },
            timeout: 60_000,
            maxContentLength: -1,
            maxBodyLength: -1,
        });
        expect(validateStatus).toBeTypeOf("function");
    });

    test.each([
        [ 199, false ],
        [ 200, true ],
        [ 299, true ],
        [ 300, false ],
    ])("validateStatus(%d) is %s", (status, isValid) => {
        expect(ODGMessage.defaultOptions.validateStatus?.(status)).toBe(isValid);
    });

    test("is frozen", () => {
        expect(Object.isFrozen(ODGMessage.defaultOptions)).toBe(true);
        expect(Object.isFrozen(ODGMessage.defaultOptions.headers)).toBe(true);
    });
});
