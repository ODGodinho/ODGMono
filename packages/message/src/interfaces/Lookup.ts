import type {
    LookupAddress,
    LookupOptions,
} from "node:dns";

export type LookupPromiseResult = LookupAddress | LookupAddress[];

export type LookupKeyType = `dns:${string}:${("all" | "one")}:${(LookupOptions["family"] | "any")}:${(LookupOptions["hints"] | "none")}:${(LookupOptions["order"] | "default")}`;

export type LookupCacheType = Record<
    LookupKeyType,
    LookupPromiseResult
>;

export interface CacheableLookupConfig {
    shouldWriteCache?: boolean;
    shouldReadCache?: boolean;
    maxTTL?: number;
    lookup?(hostname: string, options: LookupOptions): Promise<LookupPromiseResult>;
}
