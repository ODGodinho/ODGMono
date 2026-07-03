import type { ProxyAuthInterface, ProxyObjectInterface } from "./interfaces";
import { ProxyValidator } from "./Validators/ProxyValidator";

/**
 * Proxy manager for handling proxy configurations.
 *
 * Provides bidirectional conversion between structured objects and inline URLs,
 * with automatic validation via zod schemas. Used by HTTP clients to configure
 * proxy settings for outbound requests.
 *
 * @example
 * ```typescript
 * // From structured object
 * const manager = ProxyManager.fromObject({
 *   protocol: "http",
 *   host: "proxy.example.com",
 *   port: 8080,
 *   name: "My Proxy",
 *   auth: { username: "user", password: "pass" }
 * });
 *
 * // From inline URL string
 * const manager = ProxyManager.fromInline("https://user:pass@proxy.example.com:8080", "My Proxy");
 *
 * // Serialize back
 * manager.toInline();  // "https://user:pass@proxy.example.com:8080"
 * manager.toObject();  // { protocol: "http", host: "proxy.example.com", ... }
 * ```
 */
export class ProxyManager {

    protected readonly IS_ODG_PROXY_MANAGER: boolean = true;

    protected constructor(protected readonly proxy: ProxyObjectInterface) {
    }

    /**
     * Create a ProxyManager from a structured object.
     *
     * Validates the object against {@link ProxyValidator.proxyValidator} schema.
     * Required fields: `host`, `name`. Optional: `protocol`, `port`, `auth`.
     *
     * @example
     * ```typescript
     * const manager = ProxyManager.fromObject({
     *   host: "proxy.com",
     *   name: "Primary"
     * });
     * ```
     *
     * @param {ProxyObjectInterface} object The proxy configuration object
     * @throws {Error} If the object fails validation
     * @returns {ProxyManager} A new ProxyManager instance
     */
    public static fromObject(object: ProxyObjectInterface): ProxyManager {
        const validated = ProxyValidator.proxyValidator.parse(object);

        return new ProxyManager(validated);
    }

    /**
     * Create a ProxyManager from an inline proxy URL string.
     *
     * Parses standard proxy URLs like `protocol://[user:pass@]host[:port]`.
     * Credentials with special characters must be URL-encoded in the input.
     * Protocol defaults to `http` if omitted.
     *
     * @example
     * ```typescript
     * const manager = ProxyManager.fromInline(
     *   "https://user%40domain:pass%3Aword@proxy.com:8080",
     *   "My Proxy"
     * );
     * console.log(manager.getAuth().username); // "user@domain"
     * ```
     *
     * @param {string} inline The inline proxy URL (e.g., `https://user:pass@proxy.com:8080`)
     * @param {string} name Human-readable label for the proxy
     * @throws {TypeError} If the inline string is not a valid URL
     * @throws {Error} If the parsed data fails validation
     * @returns {ProxyManager} A new ProxyManager instance
     */
    public static fromInline(inline: string, name: string): ProxyManager {
        const url = new URL(inline);

        const protocol = url.protocol.replace(/:$/, "");
        const host = url.hostname;
        const port = url.port ? Number.parseInt(url.port, 10) : undefined;

        const auth = url.username || url.password
            ? {
                username: decodeURIComponent(url.username),
                password: decodeURIComponent(url.password),
            }
            : undefined;

        return this.fromObject({
            protocol,
            host,
            port,
            name,
            auth,
        });
    }

    /**
     * Get the proxy protocol (e.g., `http`, `https`, `socks4`, `socks5`).
     *
     * @returns {string | undefined} The protocol string, or undefined if not set
     */
    public getProtocol(): string | undefined {
        return this.proxy.protocol;
    }

    /**
     * Get the proxy hostname.
     *
     * @returns {string} The hostname (required, always present)
     */
    public getHost(): string {
        return this.proxy.host;
    }

    /**
     * Get the proxy port number.
     *
     * @returns {number | undefined} The port, or undefined if not set
     */
    public getPort(): number | undefined {
        return this.proxy.port;
    }

    /**
     * Get the human-readable proxy name.
     *
     * @returns {string} The name label (required, always present)
     */
    public getName(): string {
        return this.proxy.name;
    }

    /**
     * Get the proxy authentication credentials.
     *
     * @returns {ProxyAuthInterface | undefined} Auth object, or undefined if not set
     */
    public getAuth(): ProxyAuthInterface | undefined {
        return this.proxy.auth;
    }

    /**
     * Check whether the proxy requires authentication.
     *
     * @returns {boolean} True if auth credentials are configured
     */
    public hasAuth(): boolean {
        return Boolean(this.proxy.auth);
    }

    /**
     * Serialize the proxy to a structured object.
     *
     * Returns a shallow copy of the internal configuration. Suitable for JSON storage,
     * HTTP request options, or passing to other HTTP clients.
     *
     * @returns {ProxyObjectInterface} A ProxyObjectInterface object
     */
    public toObject(): ProxyObjectInterface {
        return { ...this.proxy, auth: this.proxy.auth ? { ...this.proxy.auth } : undefined };
    }

    /**
     * Serialize the proxy to an inline URL string.
     *
     * Produces a standard proxy URL like `protocol://[user:pass@]host[:port]`.
     * Special characters in credentials are URL-encoded. The `name` is not included.
     * Protocol defaults to `http` if not set.
     *
     * @example
     * ```typescript
     * manager.toInline(); // "https://user:pass@proxy.com:8080"
     * ```
     *
     * @returns {string} An inline proxy URL string
     */
    public toInline(): string {
        const protocol = this.proxy.protocol ?? "http";
        const auth = this.proxy.auth
            ? `${encodeURIComponent(this.proxy.auth.username)}:${encodeURIComponent(this.proxy.auth.password)}@`
            : "";
        const port = this.proxy.port ? `:${this.proxy.port}` : "";

        return `${protocol}://${auth}${this.proxy.host}${port}`;
    }

    /**
     * JSON serialization hook for `JSON.stringify()`.
     *
     * Delegates to {@link toObject} to ensure consistent serialization.
     *
     * @returns {ProxyObjectInterface} A ProxyObjectInterface object
     */
    public toJSON(): ProxyObjectInterface {
        return this.toObject();
    }

    /**
     * String conversion hook for `String()` and template literals.
     *
     * Delegates to {@link toInline} for inline proxy format.
     *
     * @returns {string} An inline proxy URL string
     */
    public toString(): string {
        return this.toInline();
    }

}
