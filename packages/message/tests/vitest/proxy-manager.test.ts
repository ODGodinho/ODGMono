import { describe, expect, it } from "vitest";

import { ProxyManager, type ProxyObjectInterface } from "../../src";

const proxyHost = "proxy.example.com";

describe("ProxyManager", () => {
    describe("fromObject", () => {
        it("should create ProxyManager from valid object", () => {
            const object: ProxyObjectInterface = {
                protocol: "http",
                host: proxyHost,
                port: 8080,
                name: "Example Proxy",
                auth: {
                    username: "user",
                    password: "pass",
                },
            };

            const manager = ProxyManager.fromObject(object);

            expect(manager).toBeInstanceOf(ProxyManager);
            expect(manager.getHost()).toBe(proxyHost);
            expect(manager.getPort()).toBe(8080);
            expect(manager.getName()).toBe("Example Proxy");
        });

        it("should create ProxyManager without optional protocol and port", () => {
            const object: ProxyObjectInterface = {
                host: proxyHost,
                name: "Minimal Proxy",
            };

            const manager = ProxyManager.fromObject(object);

            expect(manager.getHost()).toBe(proxyHost);
            expect(manager.getPort()).toBeUndefined();
            expect(manager.getProtocol()).toBeUndefined();
        });

        it("should throw on invalid object (missing host)", () => {
            const object = {
                protocol: "http",
                port: 8080,
                name: "Invalid",
            };

            expect(() => ProxyManager.fromObject(object as unknown as ProxyObjectInterface)).toThrow();
        });

        it("should throw on invalid port (negative)", () => {
            const object = {
                host: proxyHost,
                port: -1,
                name: "Invalid",
            };

            expect(() => ProxyManager.fromObject(object)).toThrow();
        });
    });

    describe("fromInline", () => {
        it("should parse inline proxy with auth", () => {
            const inline = `https://user:pass@${proxyHost}:8080`;
            const manager = ProxyManager.fromInline(inline, "My Proxy");

            expect(manager.getProtocol()).toBe("https");
            expect(manager.getHost()).toBe(proxyHost);
            expect(manager.getPort()).toBe(8080);
            expect(manager.getName()).toBe("My Proxy");
            expect(manager.getAuth()).toEqual({
                username: "user",
                password: "pass",
            });
        });

        it("should parse inline proxy without auth", () => {
            const inline = `https://${proxyHost}:3128`;
            const manager = ProxyManager.fromInline(inline, "Secure Proxy");

            expect(manager.getProtocol()).toBe("https");
            expect(manager.getHost()).toBe(proxyHost);
            expect(manager.getPort()).toBe(3128);
            expect(manager.hasAuth()).toBe(false);
        });

        it("should parse inline proxy without port", () => {
            const inline = `http://${proxyHost}`;
            const manager = ProxyManager.fromInline(inline, "No Port");

            expect(manager.getProtocol()).toBe("http");
            expect(manager.getHost()).toBe(proxyHost);
            expect(manager.getPort()).toBeUndefined();
            expect(manager.hasAuth()).toBe(false);
        });

        it("should decode URL-encoded credentials", () => {
            const inline = `https://user%40domain:pass%3Aword@${proxyHost}:8080`;
            const manager = ProxyManager.fromInline(inline, "Encoded Proxy");

            expect(manager.getAuth()).toEqual({
                username: "user@domain",
                password: "pass:word",
            });
        });

        it("should throw on malformed inline proxy", () => {
            expect(() => ProxyManager.fromInline("not-a-url", "Invalid")).toThrow();
        });
    });

    describe("toObject", () => {
        it("should serialize back to object", () => {
            const original: ProxyObjectInterface = {
                protocol: "http",
                host: proxyHost,
                port: 8080,
                name: "Test Proxy",
                auth: {
                    username: "user",
                    password: "pass",
                },
            };

            const manager = ProxyManager.fromObject(original);
            const serialized = manager.toObject();

            expect(serialized).toEqual(original);
        });
    });

    describe("toInline", () => {
        it("should serialize to inline format with auth", () => {
            const manager = ProxyManager.fromObject({
                protocol: "https",
                host: proxyHost,
                port: 8080,
                name: "Test",
                auth: {
                    username: "user",
                    password: "pass",
                },
            });

            expect(manager.toInline()).toBe(`https://user:pass@${proxyHost}:8080`);
        });

        it("should serialize to inline format without auth", () => {
            const manager = ProxyManager.fromObject({
                protocol: "https",
                host: proxyHost,
                port: 3128,
                name: "Test",
            });

            expect(manager.toInline()).toBe(`https://${proxyHost}:3128`);
        });

        it("should default protocol to http", () => {
            const manager = ProxyManager.fromObject({
                host: proxyHost,
                port: 8080,
                name: "Test",
            });

            expect(manager.toInline()).toBe(`http://${proxyHost}:8080`);
        });

        it("should omit port when undefined", () => {
            const manager = ProxyManager.fromObject({
                protocol: "https",
                host: proxyHost,
                name: "Test",
            });

            expect(manager.toInline()).toBe(`https://${proxyHost}`);
        });

        it("should encode special characters in credentials", () => {
            const manager = ProxyManager.fromObject({
                protocol: "https",
                host: proxyHost,
                port: 8080,
                name: "Test",
                auth: {
                    username: "user@domain",
                    password: "pass:word",
                },
            });

            expect(manager.toInline()).toBe(`https://user%40domain:pass%3Aword@${proxyHost}:8080`);
        });
    });

    describe("round-trip conversion", () => {
        it("should convert object → inline → object correctly", () => {
            const original: ProxyObjectInterface = {
                protocol: "http",
                host: proxyHost,
                port: 8080,
                name: "Test Proxy",
                auth: {
                    username: "user",
                    password: "pass",
                },
            };

            const manager1 = ProxyManager.fromObject(original);
            const inline = manager1.toInline();
            const manager2 = ProxyManager.fromInline(inline, original.name);

            expect(manager2.toObject()).toEqual(original);
        });
    });

    describe("string conversion", () => {
        it("toString() should return inline format", () => {
            const manager = ProxyManager.fromObject({
                protocol: "https",
                host: proxyHost,
                port: 8080,
                name: "Test",
            });

            expect(String(manager)).toBe("https://proxy.example.com:8080");
        });
    });

    describe("JSON serialization", () => {
        it("toJSON() should return object interface", () => {
            const original: ProxyObjectInterface = {
                protocol: "http",
                host: proxyHost,
                port: 8080,
                name: "Test",
            };

            const manager = ProxyManager.fromObject(original);

            expect(JSON.parse(JSON.stringify(manager))).toEqual(original);
        });
    });
});
