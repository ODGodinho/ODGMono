import * as everything from "#app";

import * as portable from "../../src/portable.ts";

describe("portable entry", () => {
    test("leaves out only what needs Node: File", () => {
        expect(Object.keys(everything).filter((name) => !(name in portable))).toStrictEqual([ "File" ]);
    });

    test("keeps the decorators and the helpers", () => {
        expect(portable.ODGDecorators).toBe(everything.ODGDecorators);
        expect(portable.detach).toBe(everything.detach);
    });
});
