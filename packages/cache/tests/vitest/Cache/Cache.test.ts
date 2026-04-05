import {
    beforeEach,
    describe,
    expect,
    it,
} from "vitest";

import { Cache } from "~/Cache/Cache";

import {
    cacheKeyUser1,
    counterCacheKey,
    createMemoryHandler,
    defaultUserData,
    sleepTest,
    type TestCacheSchema,
    user1Data,
    user2Data,
} from "./setup";

describe("Cache - Basic Operations", () => {
    let cache: Cache<TestCacheSchema>;

    beforeEach(() => {
        cache = new Cache<TestCacheSchema>();
        cache.pushHandler(createMemoryHandler());
    });

    it("should set and get value", async () => {
        await cache.set(cacheKeyUser1, user1Data);
        const user = await cache.get(cacheKeyUser1);

        expect(user).toEqual(user1Data);
    });

    it("should return undefined for missing key", async () => {
        const value = await cache.get(cacheKeyUser1);

        expect(value).toBeUndefined();
    });

    it("should execute default callback and return value when key is missing", async () => {
        const user = await cache.get(cacheKeyUser1, () => defaultUserData);

        expect(user).toEqual(defaultUserData);
    });

    it("should handle TTL expiration (em ms)", async () => {
        await cache.set(cacheKeyUser1, user1Data, 100);

        const value1 = await cache.get(cacheKeyUser1);

        expect(value1).toBeDefined();

        await sleepTest(150);

        const value2 = await cache.get(cacheKeyUser1);

        expect(value2).toBeUndefined();
    });

    it("should add value only if not exists", async () => {
        const result1 = await cache.add(cacheKeyUser1, user1Data);

        expect(result1).toBe(true);

        const result2 = await cache.add(cacheKeyUser1, user2Data);

        expect(result2).toBe(false);

        const user = await cache.get(cacheKeyUser1);

        expect(user?.id).toBe(1); // First value should remain
    });

    it("should increment numeric values", async () => {
        await cache.set(counterCacheKey, 10);
        const result = await cache.increment(counterCacheKey, 5);

        expect(result).toBe(15);

        const value = await cache.get(counterCacheKey);

        expect(value).toBe(15);
    });

    it("should decrement numeric values", async () => {
        await cache.set(counterCacheKey, 10);
        const result = await cache.decrement(counterCacheKey, 3);

        expect(result).toBe(7);

        const value = await cache.get(counterCacheKey);

        expect(value).toBe(7);
    });

    it("should check if key exists with has()", async () => {
        expect(await cache.has(cacheKeyUser1)).toBe(false);

        await cache.set(cacheKeyUser1, user1Data);
        expect(await cache.has(cacheKeyUser1)).toBe(true);
    });

    it("should check if key missing with missing()", async () => {
        expect(await cache.missing(cacheKeyUser1)).toBe(true);

        await cache.set(cacheKeyUser1, user1Data);
        expect(await cache.missing(cacheKeyUser1)).toBe(false);
    });

    it("should pull value and remove it", async () => {
        await cache.set(cacheKeyUser1, user1Data);

        const user = await cache.pull(cacheKeyUser1);

        expect(user).toEqual(user1Data);

        const afterPull = await cache.get(cacheKeyUser1);

        expect(afterPull).toBeUndefined();
    });

    it("should execute pull default callback when key is missing", async () => {
        const user = await cache.pull(cacheKeyUser1, () => defaultUserData);

        expect(user).toEqual(defaultUserData);
        expect(await cache.has(cacheKeyUser1)).toBe(false);
    });

    it("should flush all keys", async () => {
        await cache.set(cacheKeyUser1, user1Data);
        await cache.set(counterCacheKey, 42);

        await cache.flush();

        expect(await cache.get(cacheKeyUser1)).toBeUndefined();
        expect(await cache.get(counterCacheKey)).toBeUndefined();
    });
});
