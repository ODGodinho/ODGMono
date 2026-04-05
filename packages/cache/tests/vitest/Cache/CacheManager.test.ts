import {
    beforeEach,
    describe,
    expect,
    it,
} from "vitest";

import { CacheManager } from "~/Cache/CacheManager";
import { CacheHandlerException } from "~/Exceptions/CacheHandlerException";

import { createMemoryHandler, type TestCacheSchema } from "./setup";

describe("CacheManager - Handler Management", () => {
    let manager: CacheManager<TestCacheSchema>;
    const nonExistentHandlerName = "non-existent";

    beforeEach(() => {
        manager = new CacheManager<TestCacheSchema>();
    });

    describe("addHandler", () => {
        it("should add handler to end by default", () => {
            const handler1 = createMemoryHandler("handler1");
            const handler2 = createMemoryHandler("handler2");

            manager.addHandler(handler1);
            manager.addHandler(handler2);

            const handlers = manager.getHandlers();

            expect(handlers).toHaveLength(2);
            expect(handlers[0].name).toBe("handler1");
            expect(handlers[1].name).toBe("handler2");
        });

        it("should add handler to start when position is 'start'", () => {
            const handler1 = createMemoryHandler("handler1");
            const handler2 = createMemoryHandler("handler2");

            manager.addHandler(handler1);
            manager.addHandler(handler2, "start");

            const handlers = manager.getHandlers();

            expect(handlers).toHaveLength(2);
            expect(handlers[0].name).toBe("handler2");
            expect(handlers[1].name).toBe("handler1");
        });

        it("should throw exception when adding duplicate handler", () => {
            const handler1 = createMemoryHandler("duplicate");
            const handler2 = createMemoryHandler("duplicate");

            manager.addHandler(handler1);

            expect(() => {
                manager.addHandler(handler2);
            }).toThrow(CacheHandlerException);

            expect(() => {
                manager.addHandler(handler2);
            }).toThrow("Handler with name \"duplicate\" already exists");
        });

        it("should maintain order with multiple start insertions", () => {
            const handler1 = createMemoryHandler("handler1");
            const handler2 = createMemoryHandler("handler2");
            const handler3 = createMemoryHandler("handler3");

            manager.addHandler(handler1);
            manager.addHandler(handler2, "start");
            manager.addHandler(handler3, "start");

            const handlers = manager.getHandlers();

            expect(handlers.map((handler) => handler.name)).toEqual([ "handler3", "handler2", "handler1" ]);
        });
    });

    describe("removeHandler", () => {
        it("should remove handler by name", () => {
            const handler1 = createMemoryHandler("handler1");
            const handler2 = createMemoryHandler("handler2");

            manager.addHandler(handler1);
            manager.addHandler(handler2);

            const removed = manager.removeHandler("handler1");

            expect(removed).toBe(true);
            expect(manager.getHandlers()).toHaveLength(1);
            expect(manager.getHandlers()[0].name).toBe("handler2");
        });

        it("should return false when removing non-existent handler", () => {
            const removed = manager.removeHandler(nonExistentHandlerName);

            expect(removed).toBe(false);
        });

        it("should remove handler from order list", () => {
            const handler1 = createMemoryHandler("handler1");
            const handler2 = createMemoryHandler("handler2");
            const handler3 = createMemoryHandler("handler3");

            manager.addHandler(handler1);
            manager.addHandler(handler2);
            manager.addHandler(handler3);

            manager.removeHandler("handler2");

            const handlers = manager.getHandlers();

            expect(handlers.map((handler) => handler.name)).toEqual([ "handler1", "handler3" ]);
        });
    });

    describe("getHandler", () => {
        it("should return handler by name", () => {
            const handler = createMemoryHandler("test");

            manager.addHandler(handler);

            const retrieved = manager.getHandler("test");

            expect(retrieved).toBe(handler);
            expect(retrieved.name).toBe("test");
        });

        it("should throw exception when handler not found", () => {
            expect(() => {
                manager.getHandler(nonExistentHandlerName);
            }).toThrow(CacheHandlerException);

            expect(() => {
                manager.getHandler(nonExistentHandlerName);
            }).toThrow("Handler \"non-existent\" not found");
        });
    });

    describe("hasHandler", () => {
        it("should return true when handler exists", () => {
            const handler = createMemoryHandler("test");

            manager.addHandler(handler);

            expect(manager.hasHandler("test")).toBe(true);
        });

        it("should return false when handler does not exist", () => {
            expect(manager.hasHandler(nonExistentHandlerName)).toBe(false);
        });

        it("should return false after handler is removed", () => {
            const handler = createMemoryHandler("test");

            manager.addHandler(handler);
            expect(manager.hasHandler("test")).toBe(true);

            manager.removeHandler("test");
            expect(manager.hasHandler("test")).toBe(false);
        });
    });

    describe("getHandlers", () => {
        it("should return empty array when no handlers", () => {
            const handlers = manager.getHandlers();

            expect(handlers).toEqual([]);
        });

        it("should return handlers in order", () => {
            const handler1 = createMemoryHandler("handler1");
            const handler2 = createMemoryHandler("handler2");
            const handler3 = createMemoryHandler("handler3");

            manager.addHandler(handler1);
            manager.addHandler(handler2);
            manager.addHandler(handler3);

            const handlers = manager.getHandlers();

            expect(handlers).toHaveLength(3);
            expect(handlers[0].name).toBe("handler1");
            expect(handlers[1].name).toBe("handler2");
            expect(handlers[2].name).toBe("handler3");
        });

        it("should remove handler from internal structures", () => {
            const handler1 = createMemoryHandler("handler1");
            const handler2 = createMemoryHandler("handler2");

            manager.addHandler(handler1);
            manager.addHandler(handler2);

            manager.removeHandler("handler1");

            const handlers = manager.getHandlers();

            expect(handlers).toHaveLength(1);
            expect(handlers[0].name).toBe("handler2");
        });
    });
});
