import {
    bindingScopeValues,
} from "inversify";

import { ODGDecorators } from "#app";
import { Container } from "#app/Container";

describe("ODGDecorators.injectable transient scope", () => {
    const {
        metadataInjectable,
    } = ODGDecorators as unknown as {
        metadataInjectable: string;
    };

    const transientName = "TransientService";

    beforeEach(() => {
        Reflect.defineMetadata(metadataInjectable, undefined, Reflect);
    });

    afterEach(() => {
        Reflect.defineMetadata(metadataInjectable, undefined, Reflect);
    });

    test("creates new instance when scope is Transient", async () => {
        @ODGDecorators.injectable(transientName, bindingScopeValues.Transient)
        class TransientService {
        }

        const container = new Container<{
            [transientName]: TransientService;
        }>();

        await ODGDecorators.loadModule(container);

        const first = container.get(transientName);
        const second = container.get(transientName);

        expect(first).not.toBe(second);
    });
});
