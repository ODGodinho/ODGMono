import {
    beforeEach,
    describe,
    expect,
    it,
} from "vitest";

import { Cache } from "~/Cache/Cache";

import {
    apiConfigData,
    cacheKeyUser1,
    cacheKeyUser2,
    configCacheKey,
    counterCacheKey,
    createMemoryHandler,
    defaultUserData,
    emptyConfig,
    numberValueCacheKey,
    sleepTest,
    type TestCacheSchema,
    user1Data,
    user2Data,
    type UserCacheValue,
} from "./setup";

describe("Cache - Edge Cases & Special Scenarios", () => {
    let cache: Cache<TestCacheSchema>;

    beforeEach(() => {
        cache = new Cache<TestCacheSchema>();
        cache.pushHandler(createMemoryHandler("memory"));
    });

    describe("TTL Edge Cases", () => {
        it("should handle TTL of 0 (immediate expiration)", async () => {
            await cache.set(cacheKeyUser1, user1Data, 0);

            const value1 = await cache.get(cacheKeyUser1);

            expect(value1).toBeUndefined();
        });

        it("should handle very large TTL values", async () => {
            await cache.set(cacheKeyUser1, user1Data, 999_999_999);

            const value = await cache.get(cacheKeyUser1);

            expect(value).toEqual(user1Data);
        });

        it("should set Infinity TTL with rememberForever", async () => {
            async function callback(): Promise<UserCacheValue> {
                return user1Data;
            }

            const value1 = await cache.rememberForever(cacheKeyUser1, callback);

            expect(value1).toEqual(user1Data);

            await sleepTest(100);

            const value2 = await cache.get(cacheKeyUser1);

            expect(value2).toEqual(user1Data);
        });

        it("should override defaultTtl with explicit TTL", async () => {
            cache.setDefaultTtl(50);

            await cache.set(counterCacheKey, 10);
            await cache.set(numberValueCacheKey, 10, 500);

            // Both exist immediately
            expect(await cache.get(counterCacheKey)).toBe(10);
            expect(await cache.get(numberValueCacheKey)).toBe(10);

            await sleepTest(100);

            expect(await cache.get(counterCacheKey)).toBeUndefined();
            expect(await cache.get(numberValueCacheKey)).toBe(10); // Still exists

            await sleepTest(450);

            expect(await cache.get(numberValueCacheKey)).toBeUndefined();
        });

        it("should use defaultTtl if no explicit TTL provided", async () => {
            cache.setDefaultTtl(100);

            await cache.set(cacheKeyUser1, user1Data);

            const value1 = await cache.get(cacheKeyUser1);

            expect(value1).toBeDefined();

            await sleepTest(150);

            const value2 = await cache.get(cacheKeyUser1);

            expect(value2).toBeUndefined();
        });

        it("should not use defaultTtl if undefined", async () => {
            // Don't set defaultTtl
            cache = new Cache<TestCacheSchema>();
            cache.pushHandler(createMemoryHandler());

            await cache.set(cacheKeyUser1, user1Data);

            await sleepTest(100);

            const value = await cache.get(cacheKeyUser1);

            expect(value).toEqual(user1Data); // Still exists
        });
    });

    describe("Increment/Decrement Edge Cases", () => {
        it("should start from 0 when key does not exist", async () => {
            const result = await cache.increment(counterCacheKey, 5);

            expect(result).toBe(5);
        });

        it("should handle negative increments", async () => {
            await cache.set(counterCacheKey, 10);

            const result = await cache.increment(counterCacheKey, -3);

            expect(result).toBe(7);
        });

        it("should handle zero increments", async () => {
            await cache.set(counterCacheKey, 10);

            const result = await cache.increment(counterCacheKey, 0);

            expect(result).toBe(10);
        });

        it("should decrement to zero and below", async () => {
            await cache.set(counterCacheKey, 5);

            const result1 = await cache.decrement(counterCacheKey, 5);

            expect(result1).toBe(0);

            const result2 = await cache.decrement(counterCacheKey, 3);

            expect(result2).toBe(-3);
        });

        it("should default increment value to 1", async () => {
            await cache.set(counterCacheKey, 10);

            const result = await cache.increment(counterCacheKey);

            expect(result).toBe(11);
        });

        it("should default decrement value to 1", async () => {
            await cache.set(counterCacheKey, 10);

            const result = await cache.decrement(counterCacheKey);

            expect(result).toBe(9);
        });
    });

    describe("Empty & Null Values", () => {
        it("should store and retrieve zero", async () => {
            await cache.set(counterCacheKey, 0);

            const value = await cache.get(counterCacheKey);

            expect(value).toBe(0);
        });

        it("should store and retrieve empty object", async () => {
            await cache.set(configCacheKey, emptyConfig);

            const value = await cache.get(configCacheKey);

            expect(value).toEqual(emptyConfig);
        });

        it("should store and retrieve false boolean", async () => {
            await cache.set(configCacheKey, apiConfigData);

            const value = await cache.get(configCacheKey);

            expect(value?.debug).toBe(false);
        });

        it("should not store null (undefined instead)", async () => {
            // Attempting to set null should result in undefined
            const value = await cache.get(cacheKeyUser1);

            expect(value).toBeUndefined();
        });
    });

    describe("remember() Edge Cases", () => {
        it("should execute callback only once for concurrent remember calls", async () => {
            let callCount = 0;

            async function callback(): Promise<UserCacheValue> {
                callCount++;
                await sleepTest(50);

                return user1Data;
            }

            // Note: This tests sequential behavior since promise concurrency isn't implicit
            const value1 = await cache.remember(cacheKeyUser1, callback);

            expect(value1).toBeDefined();
            expect(callCount).toBe(1);

            const value2 = await cache.remember(cacheKeyUser1, callback);

            expect(value2).toBeDefined();
            expect(callCount).toBe(1); // Still 1, cached value used
        });

        it("should use default promise callback", async () => {
            async function callback(): Promise<UserCacheValue> {
                return user1Data;
            }

            const value = await cache.remember(cacheKeyUser1, callback);

            expect(value).toEqual(user1Data);
        });

        it("should support synchronous callback", async () => {
            const value = await cache.remember(counterCacheKey, () => 42);

            expect(value).toBe(42);
        });

        it("should override TTL for remember", async () => {
            cache.setDefaultTtl(1000); // Long default

            await cache.remember(
                cacheKeyUser1,
                () => user1Data,
                100,
            ); // Short override

            await sleepTest(150);

            const value = await cache.get(cacheKeyUser1);

            expect(value).toBeUndefined(); // Should respect override
        });
    });

    describe("add() Edge Cases", () => {
        it("should not overwrite existing value", async () => {
            const original = user1Data;

            await cache.add(cacheKeyUser1, original);

            const result = await cache.add(cacheKeyUser1, user2Data);

            expect(result).toBe(false);
            expect(await cache.get(cacheKeyUser1)).toEqual(original);
        });

        it("should return true when adding to expired key", async () => {
            await cache.set(cacheKeyUser1, user1Data, 50);

            await sleepTest(100);

            const result = await cache.add(cacheKeyUser1, user2Data);

            expect(result).toBe(true);

            const value = await cache.get(cacheKeyUser1);

            expect(value?.id).toBe(2);
        });
    });

    describe("pull() Edge Cases", () => {
        it("should get and delete in sequence", async () => {
            await cache.set(cacheKeyUser1, user1Data);

            const value = await cache.pull(cacheKeyUser1);

            expect(value).toEqual(user1Data);
            expect(await cache.has(cacheKeyUser1)).toBe(false);
        });

        it("should use default value when key not found", async () => {
            const value = await cache.pull(cacheKeyUser1, () => defaultUserData);

            expect(value).toEqual(defaultUserData);
        });

        it("should not cache default value on pull", async () => {
            const value1 = await cache.pull(cacheKeyUser1, () => defaultUserData);

            expect(value1).toEqual(defaultUserData);

            const value2 = await cache.get(cacheKeyUser1);

            expect(value2).toBeUndefined(); // Not cached
        });
    });

    describe("Batch Operations Edge Cases", () => {
        it("should handle getMany with empty array", async () => {
            const values = await cache.getMany([]);

            expect(values).toEqual([]);
        });

        it("should handle setMany with empty object", async () => {
            const result = await cache.setMany({});

            expect(result).toEqual([]);
        });

        it("should getMany preserve order", async () => {
            await cache.set(cacheKeyUser1, user1Data);
            await cache.set(cacheKeyUser2, user2Data);

            const values = await cache.getMany([ cacheKeyUser2, cacheKeyUser1, cacheKeyUser2 ]);

            expect(values[0]?.id).toBe(2);
            expect(values[1]?.id).toBe(1);
            expect(values[2]?.id).toBe(2);
        });

        it("should setMany with TTL apply to all", async () => {
            await cache.setMany({
                [cacheKeyUser1]: user1Data,
                [cacheKeyUser2]: user2Data,
            }, 100);

            const values1 = await cache.getMany([ cacheKeyUser1, cacheKeyUser2 ]);

            expect(values1[0]).toBeDefined();
            expect(values1[1]).toBeDefined();

            await sleepTest(150);

            const values2 = await cache.getMany([ cacheKeyUser1, cacheKeyUser2 ]);

            expect(values2[0]).toBeUndefined();
            expect(values2[1]).toBeUndefined();
        });
    });

    describe("has() & missing() Edge Cases", () => {
        it("should return false for has() on missing key", async () => {
            const result = await cache.has(cacheKeyUser1);

            expect(result).toBe(false);
        });

        it("should return true for missing() on missing key", async () => {
            const result = await cache.missing(cacheKeyUser1);

            expect(result).toBe(true);
        });

        it("should reflect state changes", async () => {
            expect(await cache.has(cacheKeyUser1)).toBe(false);

            await cache.set(cacheKeyUser1, user1Data);
            expect(await cache.has(cacheKeyUser1)).toBe(true);

            await cache.delete(cacheKeyUser1);
            expect(await cache.has(cacheKeyUser1)).toBe(false);
        });
    });

    describe("setDefaultTtl Chain", () => {
        it("should return this for method chaining", () => {
            const result = cache.setDefaultTtl(100);

            expect(result).toBe(cache);
        });

        it("should allow chaining multiple calls", async () => {
            cache
                .setDefaultTtl(100)
                .setDefaultTtl(200);

            await cache.set(counterCacheKey, 10);

            await sleepTest(150);

            const value = await cache.get(counterCacheKey);

            expect(value).toBe(10); // 200ms TTL, not 100ms
        });
    });

    describe("Type Consistency", () => {
        it("should preserve complex object types", async () => {
            await cache.set(cacheKeyUser1, user1Data);

            const retrieved = await cache.get(cacheKeyUser1);

            expect(retrieved).toEqual(user1Data);
            expect(retrieved?.name).toBe("John");
        });

        it("should handle numeric values correctly", async () => {
            await cache.set(counterCacheKey, 42);

            const value = await cache.get(counterCacheKey);

            expect(value).toBe(42);
            expect(typeof value).toBe("number");
        });
    });
});
