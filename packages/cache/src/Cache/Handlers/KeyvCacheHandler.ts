import type Keyv from "keyv";

import { CacheIteratorException } from "~/Exceptions";
import type { CacheHandlerInterface } from "~/Interfaces/CacheHandlerInterface";

export class KeyvCacheHandler<CacheType extends object> implements CacheHandlerInterface<CacheType> {

    public readonly name: string;

    public constructor(
        private readonly keyv: Keyv,
        name?: string,
    ) {
        this.name = name ?? "keyv";
    }

    public async get<K extends keyof CacheType>(key: K): Promise<CacheType[K] | undefined> {
        return this.keyv.get<CacheType[K]>(String(key));
    }

    public async set<K extends keyof CacheType>(key: K, value: CacheType[K], ttl?: number): Promise<boolean> {
        if (ttl === 0) {
            await this.delete(key);

            return true;
        }

        return this.keyv.set(String(key), value, ttl);
    }

    public async delete(key: keyof CacheType): Promise<boolean> {
        return this.keyv.delete(String(key));
    }

    public async clear(): Promise<void> {
        await this.keyv.clear();
    }

    public async has(key: keyof CacheType): Promise<boolean> {
        return this.keyv.has(String(key));
    }

    public async getMany<K extends keyof CacheType>(keys: K[]): Promise<Array<CacheType[K] | undefined>> {
        return this.keyv.getMany<CacheType[K]>(keys as string[]);
    }

    public async setMany(
        entries: Partial<CacheType>,
        ttl?: number,
    ): Promise<boolean[]> {
        if (ttl === 0) {
            const keys = Object.keys(entries);

            return this.deleteMany(keys as Array<keyof CacheType>);
        }

        return this.keyv.setMany(
            Object.entries(entries).map(([ key, value ]) => ({
                key,
                value,
                ttl,
            })),
        );
    }

    public async deleteMany(keys: Array<keyof CacheType>): Promise<boolean[]> {
        return Promise.all(keys.map(async (key) => this.delete(key)));
    }

    public async *[Symbol.asyncIterator](): AsyncGenerator<[keyof CacheType, CacheType[keyof CacheType]]> {
        if (!this.keyv.iterator) {
            throw new CacheIteratorException("The provided Keyv instance does not support iteration.");
        }

        for await (const [ key, value ] of this.keyv.iterator("*")) {
            yield [ key as keyof CacheType, value as CacheType[keyof CacheType] ];
        }
    }

}
