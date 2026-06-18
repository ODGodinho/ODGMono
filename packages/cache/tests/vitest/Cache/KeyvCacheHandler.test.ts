import Keyv from "keyv";
import {
    beforeEach,
    describe,
    expect,
    it,
} from "vitest";

import { KeyvCacheHandler } from "#app/Cache/Handlers/KeyvCacheHandler";
import { CacheIteratorException } from "#app/Exceptions";

import {
    cacheKeyUser1,
    cacheKeyUser2,
    sleepTest,
    type TestCacheSchema,
} from "./setup";

describe("KeyvCacheHandler - Batch Operations", () => {
    let handler: KeyvCacheHandler<TestCacheSchema>;
    let keyv: Keyv;
    const counterKey = "counter:string";
    const exampleUserId1 = { id: 1, name: "John", email: "john@example.com" };
    const exampleUserId2 = { id: 2, name: "Jane", email: "jane@example.com" };

    beforeEach(() => {
        keyv = new Keyv();
        handler = new KeyvCacheHandler<TestCacheSchema>(keyv, "test");
    });

    function getStoreKey(key: string): string {
        if (!keyv.useKeyPrefix || !keyv.namespace) {
            return key;
        }

        return `${keyv.namespace}:${key}`;
    }

    async function writeRawStoreValue(key: string, value: unknown): Promise<void> {
        await (keyv.store as { set(storeKey: string, storeValue: unknown): Promise<unknown> })
            .set(getStoreKey(key), value);
    }

    it("should use default handler name when name is not provided", () => {
        const defaultNamedHandler = new KeyvCacheHandler<TestCacheSchema>(new Keyv());

        expect(defaultNamedHandler.name).toBe("keyv");
    });

    describe("Basic Operations", () => {
        it("should set and get value", async () => {
            await handler.set(cacheKeyUser1, exampleUserId1);
            const value = await handler.get(cacheKeyUser1);

            expect(value).toEqual(exampleUserId1);
        });

        it("should return undefined for missing key", async () => {
            const value = await handler.get(cacheKeyUser1);

            expect(value).toBeUndefined();
        });

        it("should read Keyv raw envelope and return only value", async () => {
            await writeRawStoreValue(cacheKeyUser1, {
                value: exampleUserId1,
                expires: undefined,
            });

            const value = await handler.get(cacheKeyUser1);

            expect(value).toEqual(exampleUserId1);
        });

        it("should not unwrap value when raw object has extra keys besides value and expires", async () => {
            const legacyLikeObject = {
                value: exampleUserId1,
                expires: undefined,
                meta: "legacy",
            };

            await writeRawStoreValue(cacheKeyUser1, legacyLikeObject);

            const value = await handler.get(cacheKeyUser1);

            expect(value).toEqual(legacyLikeObject);
        });

        it("should return legacy raw value as-is", async () => {
            await writeRawStoreValue(counterKey, 42);

            const value = await handler.get(counterKey);

            expect(value).toBe(42);
        });

        it("should return raw object as-is when it does not have value key", async () => {
            const rawLegacyObject = {
                expires: undefined,
                payload: exampleUserId1,
            };

            await writeRawStoreValue(cacheKeyUser1, rawLegacyObject);

            const value = await handler.get(cacheKeyUser1);

            expect(value).toEqual(rawLegacyObject);
        });

        it("should set with TTL", async () => {
            await handler.set(cacheKeyUser1, exampleUserId1, 100);
            const value1 = await handler.get(cacheKeyUser1);

            expect(value1).toBeDefined();

            // Wait for expiration
            await new Promise((resolve) => {
                setTimeout(resolve, 150);
            });

            const value2 = await handler.get(cacheKeyUser1);

            expect(value2).toBeUndefined();
        });

        it("should delete value", async () => {
            await handler.set(cacheKeyUser1, exampleUserId1);
            expect(await handler.has(cacheKeyUser1)).toBe(true);

            const didDeleted = await handler.delete(cacheKeyUser1);

            expect(didDeleted).toBe(true);
            expect(await handler.has(cacheKeyUser1)).toBe(false);
        });

        it("should return false when deleting non-existent key", async () => {
            const didDeleted = await handler.delete(cacheKeyUser1);

            expect(didDeleted).toBe(false);
        });

        it("should check if key exists", async () => {
            expect(await handler.has(cacheKeyUser1)).toBe(false);

            await handler.set(cacheKeyUser1, exampleUserId1);
            expect(await handler.has(cacheKeyUser1)).toBe(true);
        });

        it("should clear all values", async () => {
            await handler.set(cacheKeyUser1, exampleUserId1);
            await handler.set(counterKey, 10);

            expect(await handler.has(cacheKeyUser1)).toBe(true);
            expect(await handler.has(counterKey)).toBe(true);

            await handler.clear();

            expect(await handler.has(cacheKeyUser1)).toBe(false);
            expect(await handler.has(counterKey)).toBe(false);
        });
    });

    describe("Batch Operations - getMany", () => {
        it("should get multiple values", async () => {
            await handler.set(cacheKeyUser1, exampleUserId1);
            await handler.set("user:2", exampleUserId2);

            const values = await handler.getMany([ cacheKeyUser1, "user:2" ]);

            expect(values).toHaveLength(2);
            expect(values[0]).toEqual(exampleUserId1);
            expect(values[1]).toEqual(exampleUserId2);
        });

        it("should return undefined for missing keys", async () => {
            await handler.set(cacheKeyUser1, exampleUserId1);

            const values = await handler.getMany([ cacheKeyUser1, "user:2" ]);

            expect(values).toHaveLength(2);
            expect(values[0]).toEqual(exampleUserId1);
            expect(values[1]).toBeUndefined();
        });

        it("should return empty array for empty keys", async () => {
            const values = await handler.getMany([]);

            expect(values).toEqual([]);
        });

        it("should read mixed Keyv envelope and legacy raw values", async () => {
            await writeRawStoreValue(cacheKeyUser1, {
                value: exampleUserId1,
                expires: undefined,
            });
            await writeRawStoreValue(counterKey, 77);

            const values = await handler.getMany([ cacheKeyUser1, counterKey, cacheKeyUser2 ]);

            expect(values).toEqual([ exampleUserId1, 77, undefined ]);
        });
    });

    describe("Batch Operations - setMany", () => {
        it("should set multiple values", async () => {
            const entries = {
                [cacheKeyUser1]: exampleUserId1,
                [counterKey]: 10,
            };

            const result = await handler.setMany(entries);

            expect(result).toEqual([ true, true ]);
            expect(await handler.get(cacheKeyUser1)).toEqual(exampleUserId1);
            expect(await handler.get(counterKey)).toBe(10);
        });

        it("should set multiple values with TTL", async () => {
            const entries = {
                [cacheKeyUser1]: exampleUserId1,
                "counterKey": 10,
            };

            const result = await handler.setMany(entries, 500);

            expect(result).toEqual([ true, true ]);

            const value1 = await handler.get(cacheKeyUser1);

            expect(value1).toBeDefined();

            // Wait for expiration
            await sleepTest(550);

            const value2 = await handler.get(cacheKeyUser1);

            expect(value2).toBeUndefined();
        });

        it("should return false if any set fails", async () => {
            const entries = {
                user1Key: exampleUserId1,
            };

            const result = await handler.setMany(entries);

            expect(result).toEqual([ true ]);
        });

        it("should delete keys when setMany receives ttl 0", async () => {
            await handler.set(cacheKeyUser1, exampleUserId1);
            await handler.set(counterKey, 10);

            const result = await handler.setMany({
                [cacheKeyUser1]: exampleUserId2,
                [counterKey]: 20,
            }, 0);

            expect(result).toEqual([ true, true ]);
            expect(await handler.get(cacheKeyUser1)).toBeUndefined();
            expect(await handler.get(counterKey)).toBeUndefined();
        });
    });

    describe("Batch Operations - deleteMany", () => {
        it("should delete multiple values", async () => {
            await handler.set(cacheKeyUser1, exampleUserId1);
            await handler.set("user:2", exampleUserId2);
            await handler.set(counterKey, 10);

            const result = await handler.deleteMany([ cacheKeyUser1, "user:2" ]);

            expect(result).toEqual([ true, true ]);
            expect(await handler.has(cacheKeyUser1)).toBe(false);
            expect(await handler.has("user:2")).toBe(false);
            expect(await handler.has(counterKey)).toBe(true);
        });

        it("should handle mixed existing and non-existent keys", async () => {
            await handler.set(cacheKeyUser1, exampleUserId1);

            const result = await handler.deleteMany([ cacheKeyUser1, "user:2" ]);

            expect(result).toEqual([ true, false ]);
            expect(await handler.has(cacheKeyUser1)).toBe(false);
        });

        it("should handle non-existent keys", async () => {
            const result = await handler.deleteMany([ cacheKeyUser1, "user:2" ]);

            expect(result).toEqual([ false, false ]);
        });
    });

    describe("Iterator", () => {
        it("should iterate over all entries", async () => {
            await handler.set(cacheKeyUser1, exampleUserId1);
            await handler.set("user:2", exampleUserId2);
            await handler.set(counterKey, 10);

            const entries: Array<[keyof TestCacheSchema, TestCacheSchema[keyof TestCacheSchema]]> = [];

            for await (const [ key, value ] of handler) {
                entries.push([ key, value ]);
            }

            expect(entries).toHaveLength(3);
            expect(entries.some(([ key ]) => key === cacheKeyUser1)).toBe(true);
            expect(entries.some(([ key ]) => key === "user:2")).toBe(true);
            expect(entries.some(([ key ]) => key === counterKey)).toBe(true);
        });

        it("should iterate over empty cache", async () => {
            const entries: Array<[keyof TestCacheSchema, TestCacheSchema[keyof TestCacheSchema]]> = [];

            for await (const [ key, value ] of handler) {
                entries.push([ key, value ]);
            }

            expect(entries).toHaveLength(0);
        });

        it("should throw exception if iterator not supported", async () => {
            const keyvNoIterator = new Keyv();

            // Mock iterator as undefined
            delete keyvNoIterator.iterator;

            const handlerNoIterator = new KeyvCacheHandler<TestCacheSchema>(keyvNoIterator, "test");

            await expect(async () => {
                for await (const entry of handlerNoIterator) {
                    // Iterate
                    expect(entry).toBeDefined();
                }
            }).rejects.toThrow(CacheIteratorException);

            await expect(async () => {
                for await (const entry of handlerNoIterator) {
                    // Iterate
                    expect(entry).toBeDefined();
                }
            }).rejects.toThrow("The provided Keyv instance does not support iteration.");
        });

        it("should track entries correctly after modifications", async () => {
            await handler.set(cacheKeyUser1, exampleUserId1);
            await handler.set(cacheKeyUser2, exampleUserId2);

            let count = 0;

            for await (const entry of handler) {
                expect(entry).toBeDefined();
                count++;
            }

            expect(count).toBe(2);

            await handler.delete(cacheKeyUser1);

            count = 0;

            for await (const entry of handler) {
                expect(entry).toBeDefined();
                count++;
            }

            expect(count).toBe(1);
        });
    });
});
