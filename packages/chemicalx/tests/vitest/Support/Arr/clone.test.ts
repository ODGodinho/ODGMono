import { Arr } from "../../../../src/index.ts";

describe("Cloneable", () => {
    test("Clone", async () => {
        const myArray = new Arr([ "" ]);
        const clone = myArray.clone();

        expect(clone).toBeInstanceOf(Arr);
        expect(clone === myArray).toBeFalsy();
    });
});
