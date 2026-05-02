import { Str } from "src";

describe("dotCase", () => {
    const dotResult = "hello.world";

    const words = {
        "hello world": dotResult,
        "hello-world": dotResult,
        "hello_world": dotResult,
        "helloWorld": dotResult,
        "HelloWorld": dotResult,
        "HELLO_WORLD": dotResult,
    };

    test.each(Object.keys(words))("dotCase word", async (word) => {
        const myString = new Str(word);
        const format = myString.dotCase();

        expect(format).toBeInstanceOf(Str);
        expect(format.toString()).toBe(words[word as keyof typeof words]);
    });
});
