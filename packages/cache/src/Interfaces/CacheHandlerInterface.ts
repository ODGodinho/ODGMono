/**
 * Low-level cache handler contract implemented by concrete drivers.
 *
 * Handlers are responsible for interacting with the underlying storage engine.
 *
 * TTL behavior used by handler write methods:
 * - `ttl = 0`: value expires immediately and should not remain available.
 * - `ttl = undefined`: value is stored without expiration.
 * - `ttl = Infinity`: value is stored without expiration.
 * - `ttl > 0`: value expires after the informed number of milliseconds.
 *
 * @template {object} CacheType
 */
export interface CacheHandlerInterface<CacheType extends object> {
    /**
     * Unique handler name used for selection (for example by `drive(name)`).
     *
     * @type {string}
     */
    readonly name: string;

    /**
     * Retrieves a value from the underlying storage.
     *
     * @template {keyof CacheType} K
     * @param {K} key Typed cache key.
     * @returns {Promise<CacheType[K] | undefined>} The stored value or `undefined` when key is missing.
     */
    get<K extends keyof CacheType>(key: K): Promise<CacheType[K] | undefined>;

    /**
     * Stores a value in the underlying storage.
     *
     * TTL rules are described in the interface-level documentation.
     *
     * @template {keyof CacheType} K
     * @param {K} key Typed cache key.
     * @param {CacheType[K]} value Typed value for the key.
     * @param {number | undefined} ttl Optional expiration time in milliseconds.
     * @returns {Promise<boolean>} `true` when the write succeeds.
     */
    set<K extends keyof CacheType>(key: K, value: CacheType[K], ttl?: number): Promise<boolean>;

    /**
     * Deletes a single key from storage.
     *
     * @param {keyof CacheType} key Typed cache key.
     * @returns {Promise<boolean>} `true` when the key existed and was removed.
     */
    delete(key: keyof CacheType): Promise<boolean>;

    /**
     * Clears all entries from storage.
     *
     * @returns {Promise<void>} A promise that resolves when the handler is fully cleared.
     */
    clear(): Promise<void>;

    /**
     * Checks whether a key exists in storage.
     *
     * @param {keyof CacheType} key Typed cache key.
     * @returns {Promise<boolean>} `true` when key exists, otherwise `false`.
     */
    has(key: keyof CacheType): Promise<boolean>;

    /**
     * Retrieves multiple values in the same order as the provided keys.
     *
     * @template {keyof CacheType} K
     * @param {K[]} keys Typed key list.
     * @returns {Promise<(CacheType[K] | undefined)[]>} Array containing one value per key
     * with `undefined` for misses.
     */
    getMany<K extends keyof CacheType>(keys: K[]): Promise<Array<CacheType[K] | undefined>>;

    /**
     * Stores multiple key/value entries.
     *
     * TTL rules are described in the interface-level documentation and apply to all entries.
     *
     * @param {Partial<CacheType>} values Partial key/value map to store.
     * @param {number | undefined} ttl Optional expiration time in milliseconds.
     * @returns {Promise<boolean[]>} Per-entry success flags.
     */
    setMany(values: Partial<CacheType>, ttl?: number): Promise<boolean[]>;

    /**
     * Deletes multiple keys.
     *
     * @param {keyof CacheType[]} keys Typed key list.
     * @returns {Promise<boolean[]>} Per-key deletion results.
     */
    deleteMany(keys: Array<keyof CacheType>): Promise<boolean[]>;

    /**
     * Provides asynchronous key/value iteration for full handler traversal.
     *
     * @returns {AsyncIterator<[keyof CacheType, CacheType[keyof CacheType]]>} Async iterator yielding
     * `[key, value]` pairs.
     */
    [Symbol.asyncIterator](): AsyncIterator<[keyof CacheType, CacheType[keyof CacheType]]>;
}
