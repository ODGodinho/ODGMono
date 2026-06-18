import { Str } from "#app";

describe("isJson", () => {
    const words = {
        "{}": true,
        "{'a': 1}": false,
        "{\"a\": 1}": true,
        "z": false,
        "": false,
        "null": false,
    };

    test.each(Object.keys(words))("isJson tests", async (word) => {
        const myString = new Str(word);
        const isJson = myString.isJson();

        expect(isJson).toBeTypeOf("boolean");
        expect(isJson).toBe(words[word as keyof typeof words]);
    });
});
