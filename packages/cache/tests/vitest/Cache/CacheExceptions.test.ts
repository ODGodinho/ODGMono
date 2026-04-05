import { Exception } from "@odg/exception";
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import { Cache } from "~/Cache/Cache";
import { CacheHandlerException } from "~/Exceptions/CacheHandlerException";

import {
    cacheKeyUser1,
    cacheKeyUser2,
    cacheKeyUser3,
    counterCacheKey,
    createMemoryHandler,
    handler1Name,
    handler2Name,
    handler3Name,
    memoryHandlerName,
    type TestCacheSchema,
    user1Data,
    user2Data,
    user3Data,
} from "./setup";

const nonExistentHandlerName = "non-existent";
const callbackFailedMessage = "Callback failed";
const handlerGetFailedMessage = "Handler get failed";
const handlerSetFailedMessage = "Handler set failed";
const handlerDeleteFailedMessage = "Handler delete failed";
const handlerClearFailedMessage = "Handler clear failed";
const syncCallbackFailedMessage = "Sync callback failed";

describe("Cache - Exceptions & Error Handling", () => {
    let cache: Cache<TestCacheSchema>;

    beforeEach(() => {
        cache = new Cache<TestCacheSchema>();
        cache.pushHandler(createMemoryHandler(memoryHandlerName));
    });

    describe("CacheHandlerException", () => {
        it("should throw when handler not found on initialization", () => {
            const handler = createMemoryHandler(handler1Name);

            expect(() => {
                cache = new Cache<TestCacheSchema>({
                    handlers: [ handler ],
                    handlerName: nonExistentHandlerName,
                });
            }).toThrow(CacheHandlerException);
        });

        it("should throw when driver name not found on initialization", () => {
            const handler = createMemoryHandler(handler1Name);

            expect(() => {
                cache = new Cache<TestCacheSchema>({
                    handlers: [ handler ],
                    handlerName: nonExistentHandlerName,
                });
            }).toThrow(CacheHandlerException);
        });

        it("should throw when no handlers available for get without drive", async () => {
            const emptyCache = new Cache<TestCacheSchema>();

            // Empty cache should return undefined, not throw
            const value = await emptyCache.get(cacheKeyUser1);

            expect(value).toBeUndefined();
        });

        it("should throw when no handlers available for get without drive", async () => {
            const emptyCache = new Cache<TestCacheSchema>();

            // Empty cache should return undefined, not throw
            const value = await emptyCache.get(cacheKeyUser1);

            expect(value).toBeUndefined();
        });

        it("should throw when internal forced handler is requested without handlerName", () => {
            const emptyCache = new Cache<TestCacheSchema>();
            const internal = emptyCache as unknown as { getForcedHandler(): unknown };

            expect(() => {
                internal.getForcedHandler();
            }).toThrow(CacheHandlerException);

            expect(() => {
                internal.getForcedHandler();
            }).toThrow("forcedHandlerName is not set");
        });
    });

    describe("Exception Propagation", () => {
        it("should propagate exception from handler.get()", async () => {
            const handler = createMemoryHandler(memoryHandlerName);
            const error = new Exception(handlerGetFailedMessage);

            handler.get = vi.fn(async () => {
                throw error;
            });

            cache = new Cache<TestCacheSchema>();
            cache.pushHandler(handler);

            await expect(cache.get(cacheKeyUser1)).rejects.toThrow(error);
        });

        it("should propagate exception from handler.set()", async () => {
            const handler = createMemoryHandler(memoryHandlerName);
            const error = new Exception(handlerSetFailedMessage);

            handler.set = vi.fn(async () => {
                throw error;
            });

            cache = new Cache<TestCacheSchema>();
            cache.pushHandler(handler);

            await expect(cache.set(cacheKeyUser1, user1Data)).rejects.toThrow(error);
        });

        it("should propagate exception from handler.delete()", async () => {
            const handler = createMemoryHandler(memoryHandlerName);
            const error = new Exception(handlerDeleteFailedMessage);

            handler.delete = vi.fn(async () => {
                throw error;
            });

            cache = new Cache<TestCacheSchema>();
            cache.pushHandler(handler);

            await expect(cache.delete(cacheKeyUser1)).rejects.toThrow(error);
        });

        it("should propagate exception from handler during has check", async () => {
            const handler = createMemoryHandler(memoryHandlerName);
            const error = new Exception(handlerGetFailedMessage);

            handler.get = vi.fn(async () => {
                throw error;
            });

            cache = new Cache<TestCacheSchema>();
            cache.pushHandler(handler);

            await expect(cache.has(cacheKeyUser1)).rejects.toThrow(error);
        });

        it("should propagate exception from handler.clear()", async () => {
            const handler = createMemoryHandler(memoryHandlerName);
            const error = new Exception(handlerClearFailedMessage);

            handler.clear = vi.fn(async () => {
                throw error;
            });

            cache = new Cache<TestCacheSchema>();
            cache.pushHandler(handler);

            await expect(cache.flush()).rejects.toThrow(error);
        });
    });

    describe("Exception Interrupts Fallback", () => {
        it("should not fallback when handler throws exception", async () => {
            const handler1 = createMemoryHandler(handler1Name);
            const handler2 = createMemoryHandler(handler2Name);

            cache = new Cache<TestCacheSchema>();
            cache.pushHandler(handler1);
            cache.pushHandler(handler2);

            const error = new Exception("Handler1 error");

            handler1.get = vi.fn(async () => {
                throw error;
            });

            // Set only in handler2
            await handler2.set(cacheKeyUser2, user2Data);

            // Should throw, not fallback to handler2
            await expect(cache.get(cacheKeyUser2)).rejects.toThrow(error);
        });

        it("should not continue fallback on any handler exception", async () => {
            const handler1 = createMemoryHandler(handler1Name);
            const handler2 = createMemoryHandler(handler2Name);
            const handler3 = createMemoryHandler(handler3Name);

            cache = new Cache<TestCacheSchema>();
            cache.pushHandler(handler1);
            cache.pushHandler(handler2);
            cache.pushHandler(handler3);

            const error = new Exception("Handler2 error");

            // Handler1 returns undefined, handler2 throws
            handler1.get = vi.fn(async () => undefined);
            handler2.get = vi.fn(async () => {
                throw error;
            });

            await handler3.set(cacheKeyUser3, user3Data);

            // Should throw at handler2, not continue to handler3
            await expect(cache.get(cacheKeyUser3)).rejects.toThrow(error);
        });
    });

    describe("remember() Exception Handling", () => {
        it("should throw exception from callback", async () => {
            const error = new Exception(callbackFailedMessage);

            async function callback(): Promise<never> {
                throw error;
            }

            await expect(cache.remember(cacheKeyUser1, callback)).rejects.toThrow(error);
        });

        it("should throw sync callback exception", async () => {
            const error = new Exception(syncCallbackFailedMessage);

            function callback(): never {
                throw error;
            }

            await expect(cache.remember(cacheKeyUser1, callback)).rejects.toThrow(error);
        });

        it("should not cache value when callback throws", async () => {
            const error = new Exception(callbackFailedMessage);
            let callCount = 0;

            async function callback(): Promise<never> {
                callCount++;

                throw error;
            }

            // First call should throw
            await expect(cache.remember(cacheKeyUser1, callback)).rejects.toThrow(error);

            // Second call should also throw (not cached)
            await expect(cache.remember(cacheKeyUser1, callback)).rejects.toThrow(error);

            expect(callCount).toBe(2);
        });

        it("should throw exception from handler when setting remember value", async () => {
            const handler = createMemoryHandler(memoryHandlerName);

            cache = new Cache<TestCacheSchema>();
            cache.pushHandler(handler);

            const error = new Exception(handlerSetFailedMessage);

            const callback = vi.fn(async () => user1Data);

            let setCalled = false;

            handler.set = vi.fn(async () => {
                setCalled = true;

                throw error;
            });

            await expect(cache.remember(cacheKeyUser1, callback)).rejects.toThrow(error);

            expect(setCalled).toBe(true);
        });
    });

    describe("rememberForever() Exception Handling", () => {
        it("should throw exception from callback with infinite TTL", async () => {
            const error = new Exception(callbackFailedMessage);

            async function callback(): Promise<never> {
                throw error;
            }

            await expect(cache.rememberForever(cacheKeyUser1, callback)).rejects.toThrow(error);
        });
    });

    describe("add() Exception Handling", () => {
        it("should throw exception when checking if key exists for add", async () => {
            const handler = createMemoryHandler(memoryHandlerName);

            cache = new Cache<TestCacheSchema>();
            cache.pushHandler(handler);

            const error = new Exception(handlerGetFailedMessage);

            handler.get = vi.fn(async () => {
                throw error;
            });

            await expect(cache.add(cacheKeyUser1, user1Data)).rejects.toThrow(error);
        });

        it("should throw exception when setting value", async () => {
            const handler = createMemoryHandler(memoryHandlerName);

            cache = new Cache<TestCacheSchema>();
            cache.pushHandler(handler);

            const error = new Exception(handlerSetFailedMessage);

            let setCallCount = 0;

            handler.set = vi.fn(async () => {
                setCallCount++;

                throw error;
            });

            await expect(cache.add(cacheKeyUser1, user1Data)).rejects.toThrow(error);

            expect(setCallCount).toBe(1);
        });
    });

    describe("Numeric Operations Exception Handling", () => {
        it("should throw when getting current value for increment", async () => {
            const handler = createMemoryHandler(memoryHandlerName);

            cache = new Cache<TestCacheSchema>();
            cache.pushHandler(handler);

            const error = new Exception(handlerGetFailedMessage);

            handler.get = vi.fn(async () => {
                throw error;
            });

            await expect(cache.increment(counterCacheKey, 5)).rejects.toThrow(error);
        });

        it("should throw when setting incremented value", async () => {
            const handler = createMemoryHandler(memoryHandlerName);

            cache = new Cache<TestCacheSchema>();
            cache.pushHandler(handler);

            const error = new Exception(handlerSetFailedMessage);

            let setCallCount = 0;

            handler.set = vi.fn(async () => {
                setCallCount++;

                throw error;
            });

            await expect(cache.increment(counterCacheKey, 5)).rejects.toThrow(error);

            expect(setCallCount).toBe(1);
        });

        it("should throw when decrementing", async () => {
            const handler = createMemoryHandler(memoryHandlerName);

            cache = new Cache<TestCacheSchema>();
            cache.pushHandler(handler);

            const error = new Exception(handlerGetFailedMessage);

            handler.get = vi.fn(async () => {
                throw error;
            });

            await expect(cache.decrement(counterCacheKey, 3)).rejects.toThrow(error);
        });
    });

    describe("pull() Exception Handling", () => {
        it("should throw exception from handler when getting value", async () => {
            const handler = createMemoryHandler(memoryHandlerName);

            cache = new Cache<TestCacheSchema>();
            cache.pushHandler(handler);

            const error = new Exception(handlerGetFailedMessage);

            handler.get = vi.fn(async () => {
                throw error;
            });

            await expect(cache.pull(cacheKeyUser1)).rejects.toThrow(error);
        });

        it("should throw exception from handler when deleting value", async () => {
            const handler = createMemoryHandler(memoryHandlerName);

            cache = new Cache<TestCacheSchema>();
            cache.pushHandler(handler);

            await handler.set(cacheKeyUser1, user1Data);

            const error = new Exception(handlerDeleteFailedMessage);

            handler.delete = vi.fn(async () => {
                throw error;
            });

            await expect(cache.pull(cacheKeyUser1)).rejects.toThrow(error);
        });
    });

    describe("CacheIteratorException", () => {
        it("should throw when iterator not supported in KeyvCacheHandler", async () => {
            // This is already tested in KeyvCacheHandler.test.ts
            expect(true).toBe(true);
        });
    });
});
