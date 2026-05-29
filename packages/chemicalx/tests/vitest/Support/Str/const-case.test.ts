import { Str } from "#app";

describe("constCase", () => {
    const words = {
        "hello world": "HELLO_WORLD",
        "hello-world": "HELLO_WORLD",
        "hello_world": "HELLO_WORLD",
        "helloWorld": "HELLO_WORLD",
        "HelloWorld": "HELLO_WORLD",
        "hello.world": "HELLO_WORLD",
        "test": "TEST",
        "userName": "USER_NAME",
    };

    test.each(Object.keys(words))("constCase word", async (word) => {
        const myString = new Str(word);
        const format = myString.constCase();

        expect(format).toBeInstanceOf(Str);
        expect(format.toString()).toBe(words[word as keyof typeof words]);
    });
});
