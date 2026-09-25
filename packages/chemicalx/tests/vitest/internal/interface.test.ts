import { ContainerMetadataClass } from "./ContainerMetadataClass.ts";

describe("Container Test", () => {
    test("Test new Container", async () => {
        const instance = new ContainerMetadataClass();

        expect(instance.name).equal("example");
    });
});
