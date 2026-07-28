import { UnknownException } from "#app";

describe("Test Default Exception", () => {
    test("Test UnknownException", async () => {
        const message = "test default";

        await expect((async (): Promise<never> => {
            throw UnknownException.parseOrDefault(undefined, message);
        })()).rejects.toThrow(new UnknownException(message));
    });

    test("Test Error", async () => {
        const message = "ok";
        const baseError = new Error(message);
        const newError = new UnknownException(message);

        newError.original = new Error(message);

        await expect((async (): Promise<never> => {
            throw UnknownException.parseOrDefault(baseError, "anything");
        })()).rejects.toThrow(newError);
    });
});
