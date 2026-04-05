import type { CacheInterface } from "@interfaces";
import { CacheHandlerException } from "~/Exceptions/CacheHandlerException";
import type { CacheHandlerInterface } from "~/Interfaces/CacheHandlerInterface";

import { CacheManager } from "./CacheManager";

export class Cache<CacheType extends object> implements CacheInterface<CacheType> {

    protected handlerName?: string;

    private readonly manager: CacheManager<CacheType>;

    public constructor(options?: {
        handlers?: Array<CacheHandlerInterface<CacheType>>;
        defaultTtl?: number; // Em milissegundos
        handlerName?: string;
        manager?: CacheManager<CacheType>;
    }) {
        this.manager = options?.manager ?? new CacheManager<CacheType>();
        this.manager.setDefaultTtl(options?.defaultTtl ?? this.manager.getDefaultTtl());
        this.handlerName = options?.handlerName;

        if (options?.handlers) {
            for (const handler of options.handlers) {
                this.pushHandler(handler);
            }
        }

        if (this.handlerName && !this.manager.hasHandler(this.handlerName)) {
            throw new CacheHandlerException(`Handler "${this.handlerName}" not found. Add it before using handlerName.`);
        }
    }

    public drive(name: string): CacheInterface<CacheType> {
        return new Cache<CacheType>({
            handlerName: name,
            manager: this.manager,
        });
    }

    public setDefaultTtl(ttl: number): this {
        this.manager.setDefaultTtl(ttl);

        return this;
    }

    public pushHandler(handler: CacheHandlerInterface<CacheType>): void {
        this.manager.addHandler(handler, "end");
    }

    public async get<K extends keyof CacheType>(
        key: K,
        defaultValue?: () => CacheType[K] | Promise<CacheType[K]>,
    ): Promise<CacheType[K] | undefined> {
        const value = await this.getFirstValueFromHandlers(key);

        if (value !== undefined) {
            return value;
        }

        return defaultValue?.();
    }

    public async set<K extends keyof CacheType>(
        key: K,
        value: CacheType[K],
        ttl?: number,
    ): Promise<boolean> {
        const finalTtl = this.getTtl(ttl);
        const handlers = this.getSelectedHandlers();

        const results = await Promise.all(handlers.map(async (handler) => handler.set(key, value, finalTtl)));

        return results.some(Boolean);
    }

    public async add<K extends keyof CacheType>(
        key: K,
        value: CacheType[K],
        ttl?: number,
    ): Promise<boolean> {
        const exists = await this.has(key);

        if (exists) {
            return false;
        }

        return this.set(key, value, ttl);
    }

    public async remember<K extends keyof CacheType>(
        key: K,
        callback: () => CacheType[K] | Promise<CacheType[K]>,
        ttl?: number,
    ): Promise<CacheType[K]> {
        const value = await this.get(key);
        const finalTtl = this.getTtl(ttl);

        if (value !== undefined) {
            return value;
        }

        const result = await callback();

        await this.set(key, result, finalTtl);

        return result;
    }

    public async rememberForever<K extends keyof CacheType>(
        key: K,
        callback: () => CacheType[K] | Promise<CacheType[K]>,
    ): Promise<CacheType[K]> {
        return this.remember(key, callback, Infinity);
    }

    public async increment<K extends keyof CacheType>(
        key: K extends keyof CacheType ? (CacheType[K] extends number ? K : never) : never,
        value = 1,
    ): Promise<number> {
        const current = await this.get(key);
        const currentValue = (current as number | undefined) ?? 0;
        const newValue = currentValue + value;

        await this.set(key, newValue as CacheType[K]);

        return newValue;
    }

    public async decrement<K extends keyof CacheType>(
        key: K extends keyof CacheType ? (CacheType[K] extends number ? K : never) : never,
        value = 1,
    ): Promise<number> {
        return this.increment(key, -value);
    }

    public async has(key: keyof CacheType): Promise<boolean> {
        const value = await this.get(key);

        return value !== undefined;
    }

    public async missing(key: keyof CacheType): Promise<boolean> {
        return !await this.has(key);
    }

    public async pull<K extends keyof CacheType>(
        key: K,
        defaultValue?: () => CacheType[K] | Promise<CacheType[K]>,
    ): Promise<CacheType[K] | undefined> {
        const value = await this.get(key, defaultValue);

        await this.delete(key);

        return value;
    }

    public async delete(key: keyof CacheType): Promise<boolean> {
        const handlers = this.getSelectedHandlers();
        const results = await Promise.all(handlers.map(async (handler) => handler.delete(key)));

        return results.some(Boolean);
    }

    public async flush(): Promise<void> {
        const handlers = this.getSelectedHandlers();

        await Promise.all(handlers.map(async (handler) => handler.clear()));
    }

    public async getMany<K extends keyof CacheType>(
        keys: K[],
    ): Promise<Array<CacheType[K] | undefined>> {
        return Promise.all(keys.map(async (key) => this.getFirstValueFromHandlers(key)));
    }

    public async setMany(
        values: Partial<CacheType>,
        ttl?: number,
    ): Promise<boolean[]> {
        const valueEntries = Object.entries(values);
        const finalTtl = this.getTtl(ttl);
        const handlers = this.getSelectedHandlers();
        const promises = handlers.map(async (handler) => handler.setMany(values, finalTtl));
        const results = await Promise.all(promises);

        return valueEntries.map((_valueSet, index) => results.every((handlerResult) => handlerResult[index]));
    }

    protected getTtl(ttl?: number): number | undefined {
        return ttl ?? this.manager.getDefaultTtl();
    }

    private getForcedHandler(): CacheHandlerInterface<CacheType> {
        if (!this.handlerName) {
            throw new CacheHandlerException("forcedHandlerName is not set");
        }

        return this.manager.getHandler(this.handlerName);
    }

    private getSelectedHandlers(): Array<CacheHandlerInterface<CacheType>> {
        return this.handlerName ? [ this.getForcedHandler() ] : this.manager.getHandlers();
    }

    private async getFirstValueFromHandlers<K extends keyof CacheType>(key: K): Promise<CacheType[K] | undefined> {
        const handlers = this.getSelectedHandlers();

        for (const handler of handlers) {
            const value = await handler.get(key);

            if (value !== undefined) {
                return value;
            }
        }

        return undefined;
    }

}
