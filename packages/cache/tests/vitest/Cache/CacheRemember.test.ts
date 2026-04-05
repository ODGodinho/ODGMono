import {
    beforeEach,
    describe,
    expect,
    it,
} from "vitest";

import { Cache } from "~/Cache/Cache";

import { createMemoryHandler, type TestCacheSchema } from "./setup";

describe("Cache - Remember Operations", () => {
    let cache: Cache<TestCacheSchema>;
    let callCount: number;
    const user1Data = { id: 1, name: "John", email: "john@example.com" };

    beforeEach(() => {
        cache = new Cache<TestCacheSchema>();
        cache.pushHandler(createMemoryHandler());
        callCount = 0;
    });

    it("should execute callback on cache miss", async () => {
        const result = await cache.remember("user:1", async () => {
            callCount++;

            return user1Data;
        }, 30_000);

        expect(result).toEqual(user1Data);
        expect(callCount).toBe(1);
    });

    it("should return cached value on cache hit", async () => {
        await cache.set("user:1", user1Data);

        const result = await cache.remember("user:1", async () => {
            callCount++;

            return { id: 2, name: "Jane", email: "jane@example.com" };
        }, 30_000);

        expect(result).toEqual(user1Data);
        expect(callCount).toBe(0);
    });

    it("should cache callback result", async () => {
        await cache.remember("user:1", async () => {
            callCount++;

            return user1Data;
        }, 30_000);

        const cached = await cache.get("user:1");

        expect(cached).toEqual(user1Data);
    });

    it("should handle rememberForever", async () => {
        const result = await cache.rememberForever("user:1", async () => {
            callCount++;

            return user1Data;
        });

        expect(result).toEqual(user1Data);
        expect(callCount).toBe(1);

        // Second call should use cache
        const result2 = await cache.rememberForever("user:1", async () => {
            callCount++;

            return { id: 2, name: "Jane", email: "jane@example.com" };
        });

        expect(result2).toEqual(user1Data);
        expect(callCount).toBe(1);
    });

    it("should respect TTL in milliseconds", async () => {
        await cache.remember("user:1", async () => user1Data, 100);

        const value1 = await cache.get("user:1");

        expect(value1).toBeDefined();

        await new Promise((resolve) => {
            setTimeout(resolve, 150);
        });

        const value2 = await cache.get("user:1");

        expect(value2).toBeUndefined();
    });
});
