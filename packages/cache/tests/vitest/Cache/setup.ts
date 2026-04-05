import Keyv from "keyv";

import type { CacheHandlerInterface } from "@interfaces";
import { KeyvCacheHandler } from "~/Cache/Handlers/KeyvCacheHandler";

export const memoryHandlerName = "memory";

export const handler1Name = "handler1";

export const handler2Name = "handler2";

export const handler3Name = "handler3";

export const cacheKeyUser1 = "user:1" as const;

export const cacheKeyUser2 = "user:2" as const;

export const cacheKeyUser3 = "user:3" as const;

export const counterCacheKey = "counter:string" as const;

export const numberValueCacheKey = "numberValue" as const;

export const configCacheKey = "config" as const;

export const user1Data: UserCacheValue = { id: 1, name: "John", email: "john@example.com" };

export const user2Data: UserCacheValue = { id: 2, name: "Jane", email: "jane@example.com" };

export const user3Data: UserCacheValue = { id: 3, name: "Bob", email: "bob@example.com" };

export const defaultUserData: UserCacheValue = { id: 0, name: "Default", email: "default@example.com" };

export const emptyConfig: TestCacheSchema["config"] = { debug: false, apiUrl: "" };

export const apiConfigData: TestCacheSchema["config"] = { debug: false, apiUrl: "https://api.example.com" };

export interface TestCacheSchema {
    [key: `user:${number}`]: { id: number; name: string; email: string };
    [keyb: number]: string;
    "counter:string": number;
    "numberValue": number;
    "config": { debug: boolean; apiUrl: string };
    "short:key": string;
    "long:key": string;
}

export type UserCacheValue = TestCacheSchema[`user:${number}`];

export async function sleepTest(milles: number): Promise<void> {
    await new Promise((resolve) => {
        setTimeout(resolve, milles);
    });
}

export function createMemoryHandler<CacheType extends object = TestCacheSchema>(
    name = memoryHandlerName,
): CacheHandlerInterface<CacheType> {
    return new KeyvCacheHandler<CacheType>(new Keyv(), name);
}
