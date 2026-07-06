import {
    bindingScopeValues,
} from "inversify";

import { ODGDecorators } from "#app";
import { Container } from "#app/Container";

describe("ODGDecorators.injectable scope", () => {
    const {
        metadataInjectable,
    } = ODGDecorators as unknown as {
        metadataInjectable: string;
    };

    const singletonName = "SingletonService";

    beforeEach(() => {
        Reflect.defineMetadata(metadataInjectable, undefined, Reflect);
    });

    afterEach(() => {
        Reflect.defineMetadata(metadataInjectable, undefined, Reflect);
    });

    test("keeps singleton binding when scope is Singleton", async () => {
        @ODGDecorators.injectable(singletonName, bindingScopeValues.Singleton)
        class SingletonService {
        }

        const container = new Container<{
            [singletonName]: SingletonService;
        }>();

        await ODGDecorators.loadModule(container);

        const first = container.get(singletonName);
        const second = container.get(singletonName);

        expect(first).toBe(second);
    });
});
