import { Str } from "src";

describe("camelCase", () => {
    const words = {
        "hello world": "helloWorld",
        "hello-world": "helloWorld",
        "hello_world": "helloWorld",
        "HelloWorld": "helloWorld",
        "hello.world": "helloWorld",
        "HELLO_WORLD": "helloWorld",
        "test": "test",
        "userName": "userName",
    };

    test.each(Object.keys(words))("camelCase word", async (word) => {
        const myString = new Str(word);
        const format = myString.camelCase();

        expect(format).toBeInstanceOf(Str);
        expect(format.toString()).toBe(words[word as keyof typeof words]);
    });
});
