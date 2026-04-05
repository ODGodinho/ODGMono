import type { CacheHandlerInterface } from "./CacheHandlerInterface";

/**
 * High-level cache contract used by application code.
 *
 * This interface describes a typed cache API where keys and values are inferred from
 * the provided `CacheType` schema.
 *
 * TTL behavior used across methods that accept `ttl`:
 * - `ttl = 0`: value expires immediately and should not remain available.
 * - `ttl = undefined`: value is stored without expiration.
 * - `ttl = Infinity`: value is stored without expiration.
 * - `ttl > 0`: value expires after the informed number of milliseconds.
 *
 * @template {object} CacheType
 */
export interface CacheInterface<CacheType extends object = Record<string, unknown>> {
    /**
     * Retrieves a value by key.
     *
     * If the key does not exist and `defaultValue` is provided, the callback is executed
     * and its result is returned. Implementations may choose to cache this fallback value.
     *
     * @template {keyof CacheType} K
     * @param {K} key Typed cache key.
     * @param {() => CacheType[K] | Promise<CacheType[K]> | undefined} defaultValue Optional fallback callback for cache
     * misses.
     * @returns {Promise<CacheType[K] | undefined>} The cached value, the fallback value, or `undefined`
     * when no value is found.
     */
    get<K extends keyof CacheType>(
        key: K,
        defaultValue?: () => CacheType[K] | Promise<CacheType[K]>
    ): Promise<CacheType[K] | undefined>;

    /**
     * Stores a value by key.
     *
     * TTL rules:
     * - `ttl = 0`: immediate expiration (effectively removes or prevents persistence).
     * - `ttl = undefined` or `Infinity`: no expiration.
     * - `ttl > 0`: expiration after `ttl` milliseconds.
     *
     * @template {keyof CacheType} K
     * @param {K} key Typed cache key.
     * @param {CacheType[K]} value Typed value for the key.
     * @param {number | undefined} ttl Optional expiration time in milliseconds.
     * @returns {Promise<boolean>} `true` when the operation succeeds according to the implementation strategy.
     */
    set<K extends keyof CacheType>(
        key: K,
        value: CacheType[K],
        ttl?: number
    ): Promise<boolean>;

    /**
     * Stores a value only when the key does not already exist.
     *
     * TTL rules are the same as `set`.
     *
     * @template {keyof CacheType} K
     * @param {K} key Typed cache key.
     * @param {CacheType[K]} value Typed value for the key.
     * @param {number | undefined} ttl Optional expiration time in milliseconds.
     * @returns {Promise<boolean>} `true` when the value is inserted, `false` when the key already exists.
     */
    add<K extends keyof CacheType>(
        key: K,
        value: CacheType[K],
        ttl?: number
    ): Promise<boolean>;

    /**
     * Returns the existing cached value or computes and stores it using `callback`.
     *
     * TTL rules are the same as `set`.
     *
     * @template {keyof CacheType} K
     * @param {K} key Typed cache key.
     * @param {() => CacheType[K] | Promise<CacheType[K]>} callback Lazy producer used only on cache miss.
     * @param {number | undefined} ttl Optional expiration time in milliseconds.
     * @returns {Promise<CacheType[K]>} The cached or computed value.
     */
    remember<K extends keyof CacheType>(
        key: K,
        callback: () => CacheType[K] | Promise<CacheType[K]>,
        ttl?: number,
    ): Promise<CacheType[K]>;

    /**
     * Returns the existing cached value or computes and stores it permanently.
     *
     * This method is equivalent to `remember` with infinite lifetime behavior.
     *
     * @template {keyof CacheType} K
     * @param {K} key Typed cache key.
     * @param {() => CacheType[K] | Promise<CacheType[K]>} callback Lazy producer used only on cache miss.
     * @returns {Promise<CacheType[K]>} The cached or computed value.
     */
    rememberForever<K extends keyof CacheType>(
        key: K,
        callback: () => CacheType[K] | Promise<CacheType[K]>
    ): Promise<CacheType[K]>;

    /**
     * Increments a numeric value.
     *
     * Only numeric keys are allowed by type.
     *
     * @template {keyof CacheType} K
     * @param {K extends keyof CacheType ? (CacheType[K] extends number ? K : never) : never} key Cache Key
     * @param {number | undefined} value Increment delta. Defaults to `1` when omitted.
     * @returns {Promise<number>} The updated numeric value.
     */
    increment<K extends keyof CacheType>(
        key: K extends keyof CacheType ? (CacheType[K] extends number ? K : never) : never,
        value?: number
    ): Promise<number>;

    /**
     * Decrements a numeric value.
     *
     * Only numeric keys are allowed by type.
     *
     * @template {keyof CacheType} K
     * @param {K extends keyof CacheType ? (CacheType[K] extends number ? K : never) : never} key Cache key.
     * @param {number | undefined} value Decrement delta. Defaults to `1` when omitted.
     * @returns {Promise<number>} The updated numeric value.
     */
    decrement<K extends keyof CacheType>(
        key: K extends keyof CacheType ? (CacheType[K] extends number ? K : never) : never,
        value?: number
    ): Promise<number>;

    /**
     * Checks whether a key exists in cache.
     *
     * @param {keyof CacheType} key Typed cache key.
     * @returns {Promise<boolean>} `true` when the key exists, otherwise `false`.
     */
    has(key: keyof CacheType): Promise<boolean>;

    /**
     * Checks whether a key is missing from cache.
     *
     * @param {keyof CacheType} key Typed cache key.
     * @returns {Promise<boolean>} `true` when the key does not exist, otherwise `false`.
     */
    missing(key: keyof CacheType): Promise<boolean>;

    /**
     * Reads and removes a value in a single operation.
     *
     * If the key is missing and `defaultValue` is provided, the callback result is returned.
     * Implementations typically do not persist this fallback value.
     *
     * @template {keyof CacheType} K
     * @param {K} key Typed cache key.
     * @param {(() => CacheType[K] | Promise<CacheType[K]>) | undefined} defaultValue Optional fallback callback for
     * cache misses.
     * @returns {Promise<CacheType[K] | undefined>} The removed value, fallback value, or `undefined`.
     */
    pull<K extends keyof CacheType>(
        key: K,
        defaultValue?: () => CacheType[K] | Promise<CacheType[K]>
    ): Promise<CacheType[K] | undefined>;

    /**
     * Deletes a key from cache.
     *
     * @param {keyof CacheType} key Typed cache key.
     * @returns {Promise<boolean>} `true` when at least one value is removed by the implementation.
     */
    delete(key: keyof CacheType): Promise<boolean>;

    /**
     * Removes all cache entries.
     *
     * @returns {Promise<void>} A promise that resolves when flush is complete.
     */
    flush(): Promise<void>;

    /**
     * Retrieves multiple values in the same order as the provided keys.
     *
     * @template {keyof CacheType} K
     * @param {K[]} keys Typed key list.
     * @returns {Promise<(CacheType[K] | undefined)[]>} An array with one value per key.
     * Missing entries are `undefined`.
     */
    getMany<K extends keyof CacheType>(
        keys: K[]
    ): Promise<Array<CacheType[K] | undefined>>;

    /**
     * Stores multiple key/value pairs.
     *
     * TTL rules are the same as `set` for all informed entries.
     *
     * @param {Partial<CacheType>} values Partial map of keys and values to store.
     * @param {number | undefined} ttl Optional expiration time in milliseconds.
     * @returns {Promise<boolean[]>} An array of per-entry success flags, preserving implementation order.
     */
    setMany(
        values: Partial<CacheType>,
        ttl?: number
    ): Promise<boolean[]>;

    /**
     * Adds a cache handler/driver to the cache manager.
     *
     * @param {CacheHandlerInterface<CacheType>} handler Concrete handler implementation.
     */
    pushHandler(handler: CacheHandlerInterface<CacheType>): void;

    /**
     * Creates a new cache instance bound to a specific handler name.
     *
     * The original instance is not mutated.
     *
     * @param {string} name Handler name to bind.
     * @returns {CacheInterface<CacheType>} A new cache instance scoped to the selected handler.
     */
    drive(name: string): CacheInterface<CacheType>;
}
