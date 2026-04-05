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
    handler1Name,
    handler2Name,
    handler3Name,
    sleepTest,
    type TestCacheSchema,
    user1Data,
    user2Data,
    user3Data,
    type UserCacheValue,
} from "./setup";

const nonExistentHandlerName = "non-existent";

describe("Cache - drive() & Handler Selection", () => {
    let cache: Cache<TestCacheSchema>;

    beforeEach(() => {
        const handler1 = createMemoryHandler(handler1Name);
        const handler2 = createMemoryHandler(handler2Name);
        const handler3 = createMemoryHandler(handler3Name);

        cache = new Cache<TestCacheSchema>({
            handlers: [ handler1, handler2, handler3 ],
        });
    });

    describe("drive() - Handler Selection", () => {
        it("should select specific handler with drive()", async () => {
            const cache1 = cache.drive(handler1Name);

            await cache1.set(cacheKeyUser1, user1Data);

            // Value should be only in handler1
            const handler1Cache = cache.drive(handler1Name);
            const handler2Cache = cache.drive(handler2Name);

            expect(await handler1Cache.get(cacheKeyUser1)).toEqual(user1Data);
            expect(await handler2Cache.get(cacheKeyUser1)).toBeUndefined();
        });

        it("should throw when driving to non-existent handler", () => {
            expect(() => {
                cache.drive(nonExistentHandlerName);
            }).toThrow(CacheHandlerException);
        });

        it("should get from correct handler when driven", async () => {
            const cache1 = cache.drive(handler1Name);
            const cache2 = cache.drive(handler2Name);

            await cache1.set(cacheKeyUser1, user1Data);
            await cache2.set(cacheKeyUser1, user2Data);

            const value1 = await cache1.get(cacheKeyUser1);
            const value2 = await cache2.get(cacheKeyUser1);

            expect(value1).toEqual(user1Data);
            expect(value2).toEqual(user2Data);
            expect(value1).not.toEqual(value2);
        });

        it("should create new Cache instance with drive()", () => {
            const cache1 = cache.drive(handler1Name);
            const cache2 = cache.drive(handler1Name);

            expect(cache1).not.toBe(cache2); // Different instances
            expect(cache1).not.toBe(cache); // Different from parent
        });

        it("should inherit defaultTtl with drive()", async () => {
            cache.setDefaultTtl(100);

            const cache1 = cache.drive(handler1Name);

            await cache1.set(cacheKeyUser1, user1Data);

            const value1 = await cache1.get(cacheKeyUser1);

            expect(value1).toEqual(user1Data);

            await sleepTest(150);

            const value2 = await cache1.get(cacheKeyUser1);

            expect(value2).toBeUndefined();
        });

        it("should override inherited defaultTtl with explicit TTL", async () => {
            cache.setDefaultTtl(10);

            const cache1 = cache.drive(handler1Name);

            await cache1.set(cacheKeyUser1, user1Data, 1000);

            await sleepTest(50);

            const value1 = await cache1.get(cacheKeyUser1);

            expect(value1).toEqual(user1Data); // Should still exist
        });

        it("should share manager with drive()", async () => {
            const cache1 = cache.drive(handler1Name);
            const cache2 = cache.drive(handler2Name);

            // Set in handler1
            await cache1.set(cacheKeyUser1, user1Data);

            // Verify it's not in handler2 (separate handlers)
            expect(await cache2.get(cacheKeyUser1)).toBeUndefined();
        });
    });

    describe("Driven Cache Operations", () => {
        it("should add value in specific handler", async () => {
            const cache1 = cache.drive(handler1Name);

            const result = await cache1.add(cacheKeyUser1, user1Data);

            expect(result).toBe(true);

            const value = await cache1.get(cacheKeyUser1);

            expect(value).toEqual(user1Data);
        });

        it("should remember in specific handler", async () => {
            const cache1 = cache.drive(handler1Name);

            let callCount = 0;

            async function callback(): Promise<UserCacheValue> {
                callCount++;

                return user1Data;
            }

            // First call should execute callback
            const value1 = await cache1.remember(cacheKeyUser1, callback);

            expect(value1).toEqual(user1Data);
            expect(callCount).toBe(1);

            // Second call should use cache
            const value2 = await cache1.remember(cacheKeyUser1, callback);

            expect(value2).toEqual(user1Data);
            expect(callCount).toBe(1); // Callback not called again
        });

        it("should increment in specific handler", async () => {
            const cache1 = cache.drive(handler1Name);
            const cache2 = cache.drive(handler2Name);

            await cache1.set(counterCacheKey, 10);

            const result1 = await cache1.increment(counterCacheKey, 5);

            expect(result1).toBe(15);

            // Handler2 should not be affected
            const value2 = await cache2.get(counterCacheKey);

            expect(value2).toBeUndefined();
        });

        it("should delete from specific handler", async () => {
            const cache1 = cache.drive(handler1Name);
            const cache2 = cache.drive(handler2Name);

            await cache1.set(cacheKeyUser1, user1Data);
            await cache2.set(cacheKeyUser1, user1Data);

            await cache1.delete(cacheKeyUser1);

            expect(await cache1.get(cacheKeyUser1)).toBeUndefined();
            expect(await cache2.get(cacheKeyUser1)).toEqual(user1Data); // Still in handler2
        });

        it("should flush specific handler only", async () => {
            const cache1 = cache.drive(handler1Name);
            const cache2 = cache.drive(handler2Name);

            await cache1.set(cacheKeyUser1, user1Data);
            await cache2.set(cacheKeyUser1, user1Data);

            await cache1.flush();

            expect(await cache1.get(cacheKeyUser1)).toBeUndefined();
            expect(await cache2.get(cacheKeyUser1)).toBeDefined();
        });

        it("should getMany from specific handler", async () => {
            const cache1 = cache.drive(handler1Name);

            await cache1.set(cacheKeyUser1, user1Data);
            await cache1.set(cacheKeyUser2, user2Data);

            const values = await cache1.getMany([ cacheKeyUser1, cacheKeyUser2 ]);

            expect(values).toHaveLength(2);
            expect(values[0]).toEqual(user1Data);
        });

        it("should setMany in specific handler", async () => {
            const cache1 = cache.drive(handler1Name);
            const cache2 = cache.drive(handler2Name);

            const result = await cache1.setMany({
                [cacheKeyUser1]: user1Data,
                [counterCacheKey]: 10,
            });

            expect(result).toEqual([ true, true ]);

            // Verify not in handler2
            const value2 = await cache2.get(cacheKeyUser1);

            expect(value2).toBeUndefined();
        });
    });

    describe("Multiple Driven Caches", () => {
        it("should isolate data between driven caches", async () => {
            const cache1 = cache.drive(handler1Name);
            const cache2 = cache.drive(handler2Name);
            const cache3 = cache.drive(handler3Name);

            await cache1.set(cacheKeyUser1, user1Data);
            await cache2.set(cacheKeyUser1, user2Data);
            await cache3.set(cacheKeyUser1, user3Data);

            const value1 = await cache1.get(cacheKeyUser1);
            const value2 = await cache2.get(cacheKeyUser1);
            const value3 = await cache3.get(cacheKeyUser1);

            expect(value1?.id).toBe(1);
            expect(value2?.id).toBe(2);
            expect(value3?.id).toBe(3);
        });

        it("should not affect other driven caches when deleting", async () => {
            const cache1 = cache.drive(handler1Name);
            const cache2 = cache.drive(handler2Name);

            // Set in both
            await cache1.set(cacheKeyUser1, user1Data);
            await cache2.set(cacheKeyUser1, user1Data);

            // Delete from cache1
            await cache1.delete(cacheKeyUser1);

            expect(await cache1.get(cacheKeyUser1)).toBeUndefined();
            expect(await cache2.get(cacheKeyUser1)).toEqual(user1Data);
        });

        it("should inherit parent TTL settings", async () => {
            cache.setDefaultTtl(100);

            const cache1 = cache.drive(handler1Name);
            const cache2 = cache.drive(handler2Name);

            await cache1.set(cacheKeyUser1, user1Data);
            await cache2.set(cacheKeyUser1, user1Data);

            const value1 = await cache1.get(cacheKeyUser1);

            expect(value1).toBeDefined();

            await sleepTest(150);

            const value2 = await cache1.get(cacheKeyUser1);
            const value3 = await cache2.get(cacheKeyUser1);

            expect(value2).toBeUndefined();
            expect(value3).toBeUndefined();
        });
    });
});
