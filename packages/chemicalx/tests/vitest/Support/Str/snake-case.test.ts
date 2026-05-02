import { Str } from "src";

describe("snakeCase", () => {
    const words = {
        "hello world": "hello_world",
        "hello-world": "hello_world",
        "helloWorld": "hello_world",
        "HelloWorld": "hello_world",
        "hello.world": "hello_world",
        "HELLO_WORLD": "hello_world",
        "test": "test",
    };

    test.each(Object.keys(words))("snakeCase word", async (word) => {
        const myString = new Str(word);
        const format = myString.snakeCase();

        expect(format).toBeInstanceOf(Str);
        expect(format.toString()).toBe(words[word as keyof typeof words]);
    });
});
