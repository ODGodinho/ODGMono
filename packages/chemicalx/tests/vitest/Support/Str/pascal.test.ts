import { Str } from "#app";

describe("pascal", () => {
    const words = {
        "": "",
        "hello world": "HelloWorld",
        "hello-world": "HelloWorld",
        "hello_world": "HelloWorld",
        "helloWorld": "HelloWorld",
        "Exemple Message with CONST": "ExempleMessageWithConst",
        "HELLO_WORLD": "HelloWorld",
        "test": "Test",
        "userName": "UserName",
        "dot.case": "DotCase",
    };

    test.each(Object.keys(words))("pascal word", async (word) => {
        const myString = new Str(word);
        const format = myString.pascalCase();

        expect(format).toBeInstanceOf(Str);
        expect(format.toString()).toBe(words[word as keyof typeof words]);
    });
});
