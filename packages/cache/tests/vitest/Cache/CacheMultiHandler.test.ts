import { Exception } from "@odg/exception";
import {
    beforeEach,
    describe,
    expect,
    it,
} from "vitest";

import { Cache } from "~/Cache/Cache";
import { CacheHandlerException } from "~/Exceptions/CacheHandlerException";

import {
    cacheKeyUser1,
    cacheKeyUser2,
    counterCacheKey,
    createMemoryHandler,
    defaultUserData,
    handler1Name,
    handler2Name,
    handler3Name,
    sleepTest,
    type TestCacheSchema,
    user1Data,
    user2Data,
    user3Data,
} from "./setup";

const nonExistentHandlerName = "non-existent";
const nonExistentHandlerError = "Handler \"non-existent\" not found";
const handlerErrorMessage = "Handler error";

describe("Cache - Multiple Handlers & Fallback", () => {
    let cache: Cache<TestCacheSchema>;

    beforeEach(() => {
        cache = new Cache<TestCacheSchema>();
    });

    describe("Handler Management", () => {
        it("should add handler and retrieve value", async () => {
            cache.pushHandler(createMemoryHandler(handler1Name));

            await cache.set(cacheKeyUser1, user1Data);
            const value = await cache.get(cacheKeyUser1);

            expect(value).toEqual(user1Data);
        });

        it("should initialize with handlers in constructor", async () => {
            const handler1 = createMemoryHandler(handler1Name);
            const handler2 = createMemoryHandler(handler2Name);

            cache = new Cache<TestCacheSchema>({
                handlers: [ handler1, handler2 ],
            });

            await cache.set(cacheKeyUser1, user1Data);
            const value = await cache.get(cacheKeyUser1);

            expect(value).toEqual(user1Data);
        });

        it("should throw when initializing with non-existent handlerName", () => {
            const handler = createMemoryHandler(handler1Name);

            expect(() => {
                cache = new Cache<TestCacheSchema>({
                    handlers: [ handler ],
                    handlerName: nonExistentHandlerName,
                });
            }).toThrow(CacheHandlerException);

            expect(() => {
                cache = new Cache<TestCacheSchema>({
                    handlers: [ handler ],
                    handlerName: nonExistentHandlerName,
                });
            }).toThrow(nonExistentHandlerError);
        });
    });

    describe("Fallback Logic - getFirstValueFromHandlers", () => {
        it("should get value from first handler with value", async () => {
            const handler1 = createMemoryHandler(handler1Name);
            const handler2 = createMemoryHandler(handler2Name);

            cache.pushHandler(handler1);
            cache.pushHandler(handler2);

            // Set in both handlers
            await cache.set(cacheKeyUser1, user1Data);

            // Get should return from handler1 (first)
            const value = await cache.get(cacheKeyUser1);

            expect(value).toEqual(user1Data);
        });

        it("should fallback to next handler when first returns undefined", async () => {
            const handler1 = createMemoryHandler(handler1Name);
            const handler2 = createMemoryHandler(handler2Name);

            cache.pushHandler(handler1);
            cache.pushHandler(handler2);

            // Set only in handler2
            await handler2.set(cacheKeyUser2, user2Data);

            // Get should fallback to handler2
            const value = await cache.get(cacheKeyUser2);

            expect(value).toEqual(user2Data);
        });

        it("should fallback through multiple handlers", async () => {
            const handler1 = createMemoryHandler(handler1Name);
            const handler2 = createMemoryHandler(handler2Name);
            const handler3 = createMemoryHandler(handler3Name);

            cache.pushHandler(handler1);
            cache.pushHandler(handler2);
            cache.pushHandler(handler3);

            // Set only in handler3
            await handler3.set(cacheKeyUser2, user3Data);

            // Get should fallback through handler1, handler2 to handler3
            const value = await cache.get(cacheKeyUser2);

            expect(value).toEqual(user3Data);
        });

        it("should return undefined when value not in any handler", async () => {
            const handler1 = createMemoryHandler(handler1Name);
            const handler2 = createMemoryHandler(handler2Name);

            cache.pushHandler(handler1);
            cache.pushHandler(handler2);

            const value = await cache.get(cacheKeyUser1);

            expect(value).toBeUndefined();
        });

        it("should interrupt fallback on exception and re-throw", async () => {
            const handler1 = createMemoryHandler(handler1Name);
            const handler2 = createMemoryHandler(handler2Name);

            cache.pushHandler(handler1);
            cache.pushHandler(handler2);

            // Mock handler1.get to throw
            const getError = new Exception(handlerErrorMessage);

            async function throwGetError(): Promise<never> {
                throw getError;
            }

            handler1.get = throwGetError;

            // Should throw and not try handler2
            await expect(cache.get(cacheKeyUser1)).rejects.toThrow(getError);
        });

        it("should use default value when all handlers return undefined", async () => {
            const handler = createMemoryHandler(handler1Name);

            cache.pushHandler(handler);

            const value = await cache.get(cacheKeyUser1, () => defaultUserData);

            expect(value).toEqual(defaultUserData);
        });
    });

    describe("Set to Multiple Handlers", () => {
        it("should set value in all handlers", async () => {
            const handler1 = createMemoryHandler(handler1Name);
            const handler2 = createMemoryHandler(handler2Name);
            const handler3 = createMemoryHandler(handler3Name);

            cache.pushHandler(handler1);
            cache.pushHandler(handler2);
            cache.pushHandler(handler3);

            await cache.set(cacheKeyUser1, user1Data);

            // Verify in all handlers
            expect(await handler1.get(cacheKeyUser1)).toEqual(user1Data);
            expect(await handler2.get(cacheKeyUser1)).toEqual(user1Data);
            expect(await handler3.get(cacheKeyUser1)).toEqual(user1Data);
        });

        it("should set with TTL in all handlers", async () => {
            const handler1 = createMemoryHandler(handler1Name);
            const handler2 = createMemoryHandler(handler2Name);

            cache.pushHandler(handler1);
            cache.pushHandler(handler2);

            await cache.set(cacheKeyUser1, user1Data, 100);

            const value1 = await cache.get(cacheKeyUser1);

            expect(value1).toEqual(user1Data);

            await sleepTest(150);

            const value2 = await cache.get(cacheKeyUser1);

            expect(value2).toBeUndefined();
        });

        it("should return true if any handler succeeds", async () => {
            const handler1 = createMemoryHandler(handler1Name);
            const handler2 = createMemoryHandler(handler2Name);

            cache.pushHandler(handler1);
            cache.pushHandler(handler2);

            const result = await cache.set(cacheKeyUser1, user1Data);

            expect(result).toBe(true);
        });
    });

    describe("Delete from Multiple Handlers", () => {
        it("should delete from all handlers", async () => {
            const handler1 = createMemoryHandler(handler1Name);
            const handler2 = createMemoryHandler(handler2Name);

            cache.pushHandler(handler1);
            cache.pushHandler(handler2);

            await cache.set(cacheKeyUser1, user1Data);

            const result = await cache.delete(cacheKeyUser1);

            expect(result).toBe(true);
            expect(await handler1.has(cacheKeyUser1)).toBe(false);
            expect(await handler2.has(cacheKeyUser1)).toBe(false);
        });

        it("should return true if any handler had the key", async () => {
            const handler1 = createMemoryHandler(handler1Name);
            const handler2 = createMemoryHandler(handler2Name);

            cache.pushHandler(handler1);
            cache.pushHandler(handler2);

            // Set only in handler1
            await handler1.set(cacheKeyUser1, user1Data);

            const result = await cache.delete(cacheKeyUser1);

            expect(result).toBe(true);
            expect(await handler1.has(cacheKeyUser1)).toBe(false);
        });

        it("should return false if key not in any handler", async () => {
            const handler = createMemoryHandler();

            cache.pushHandler(handler);

            const result = await cache.delete(cacheKeyUser1);

            expect(result).toBe(false);
        });
    });

    describe("Flush Multiple Handlers", () => {
        it("should clear all handlers", async () => {
            const handler1 = createMemoryHandler(handler1Name);
            const handler2 = createMemoryHandler(handler2Name);

            cache.pushHandler(handler1);
            cache.pushHandler(handler2);

            await cache.set(cacheKeyUser1, user1Data);
            await cache.set(counterCacheKey, 10);

            await cache.flush();

            expect(await cache.has(cacheKeyUser1)).toBe(false);
            expect(await cache.has(counterCacheKey)).toBe(false);
        });

        it("should flush only selected handler when handlerName is set", async () => {
            const handler1 = createMemoryHandler(handler1Name);
            const handler2 = createMemoryHandler(handler2Name);

            cache.pushHandler(handler1);
            cache.pushHandler(handler2);

            await cache.set(cacheKeyUser1, user1Data);

            // Flush only handler1
            const cache1 = cache.drive(handler1Name);

            await cache1.flush();

            expect(await handler1.has(cacheKeyUser1)).toBe(false);
            expect(await handler2.has(cacheKeyUser1)).toBe(true);
        });
    });

    describe("Batch Operations", () => {
        it("should get many values when distributed across handlers", async () => {
            const handler1 = createMemoryHandler(handler1Name);
            const handler2 = createMemoryHandler(handler2Name);

            cache.pushHandler(handler1);
            cache.pushHandler(handler2);

            // Set user:1 in handler1
            await handler1.set(cacheKeyUser1, user1Data);

            // Set user:2 in handler2
            await handler2.set(cacheKeyUser2, user2Data);

            const values = await cache.getMany([ cacheKeyUser1, cacheKeyUser2 ]);

            expect(values).toHaveLength(2);
            expect(values[0]).toEqual(user1Data);
            expect(values[1]).toEqual(user2Data);
        });

        it("should set many values in all handlers", async () => {
            const handler1 = createMemoryHandler(handler1Name);
            const handler2 = createMemoryHandler(handler2Name);

            cache.pushHandler(handler1);
            cache.pushHandler(handler2);

            const result = await cache.setMany({
                [cacheKeyUser1]: user1Data,
                [counterCacheKey]: 10,
            });

            expect(result).toEqual([ true, true ]);
            expect(await handler1.get(cacheKeyUser1)).toEqual(user1Data);
            expect(await handler2.get(counterCacheKey)).toBe(10);
        });

        it("should set many values with TTL in all handlers", async () => {
            const handler = createMemoryHandler();

            cache.pushHandler(handler);

            await cache.setMany({
                [cacheKeyUser1]: user1Data,
                [counterCacheKey]: 10,
            }, 100);

            const value1 = await cache.getMany([ cacheKeyUser1, counterCacheKey ]);

            expect(value1).toHaveLength(2);
            expect(value1[0]).toBeDefined();

            await sleepTest(150);

            const value2 = await cache.getMany([ cacheKeyUser1, counterCacheKey ]);

            expect(value2).toHaveLength(2);
            expect(value2[0]).toBeUndefined();
        });
    });
});
