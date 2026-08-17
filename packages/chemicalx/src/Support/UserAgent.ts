import { UserAgentPlatform, UserAgentVersionType } from "#enums";
import { InvalidArgumentException } from "#exceptions/InvalidArgumentException";
import type {
    CloneableInterface,
    NativeInterface,
    UserAgentBrandInterface,
    UserAgentHeadersInterface,
    UserAgentMetadataInterface,
    UserAgentOptionsInterface,
    UserAgentOverrideInterface,
    UserAgentPlatformProfileInterface,
} from "#interfaces";

/**
 * Builds a coherent browser identity: the reduced User-Agent string, the permuted
 * User-Agent Client Hints brand lists, the serialized `Sec-CH-UA-*` headers and the
 * `userAgentMetadata` payload consumed by CDP.
 *
 * The brand list reproduces Chromium's own GREASE algorithm
 * (`GenerateBrandVersionList` / `GetGreasedUserAgentBrandVersion` in
 * `components/embedder_support/user_agent_utils.cc`). The seed is always the major
 * version, which is what makes the fake brand rotate once per release and stay stable
 * for the whole cycle, exactly like the native browser. Randomizing it would itself be
 * a fingerprint: a GREASE brand that does not match the declared major is a signal.
 *
 * @class UserAgent
 * @implements {CloneableInterface}
 * @implements {NativeInterface<string>}
 */
export class UserAgent implements CloneableInterface, NativeInterface<string> {

    /**
     * GREASE character set from the Client Hints spec. The order is the literal order of
     * the `greasey_chars` vector in Chromium and changing it changes every brand produced.
     *
     * @memberof UserAgent
     */
    private static readonly GREASE_CHARS = [ " ", "(", ":", "-", ".", "/", ")", ";", "=", "?", "_" ];

    /**
     * Arbitrarily low versions Chromium attaches to the fake brand.
     *
     * @memberof UserAgent
     */
    private static readonly GREASE_VERSIONS = [ "8", "99", "24" ];

    /**
     * Padding that turns a major-only version into a four part one.
     *
     * @memberof UserAgent
     */
    private static readonly ZERO_VERSION_SUFFIX = ".0.0.0";

    /**
     * Engine brand every Chromium derivative advertises alongside its own.
     *
     * @memberof UserAgent
     */
    private static readonly CHROMIUM_BRAND = "Chromium";

    /**
     * Product brand assumed when the caller does not pick one.
     *
     * @memberof UserAgent
     */
    private static readonly DEFAULT_BRAND = "Google Chrome";

    /**
     * Plausible defaults per platform. Every field can be overridden through the options.
     *
     * @memberof UserAgent
     */
    private static readonly PLATFORM_PROFILES: Record<
        UserAgentPlatform,
        UserAgentPlatformProfileInterface
    > = {
        [UserAgentPlatform.Windows]: {
            platformVersion: "15.0.0",
            architecture: "x86",
            bitness: "64",
            model: "",
            isWow64: false,
            systemInformation: "Windows NT 10.0; Win64; x64",
            navigatorPlatform: "Win32",
        },
        [UserAgentPlatform.MacOS]: {
            platformVersion: "15.5.0",
            architecture: "arm",
            bitness: "64",
            model: "",
            isWow64: false,
            systemInformation: "Macintosh; Intel Mac OS X 10_15_7",
            navigatorPlatform: "MacIntel",
        },
        [UserAgentPlatform.Linux]: {
            platformVersion: "",
            architecture: "x86",
            bitness: "64",
            model: "",
            isWow64: false,
            systemInformation: "X11; Linux x86_64",
            navigatorPlatform: "Linux x86_64",
        },
        [UserAgentPlatform.Android]: {
            platformVersion: "14.0.0",
            architecture: "",
            bitness: "",
            model: "Pixel 8",
            isWow64: false,
            systemInformation: "Linux; Android 10; K",

            // Digit one, not an "l": the literal Chromium froze and the HTML spec now lists.
            navigatorPlatform: "Linux armv81",
        },
        [UserAgentPlatform.ChromeOS]: {
            platformVersion: "14541.0.0",
            architecture: "x86",
            bitness: "64",
            model: "",
            isWow64: false,
            systemInformation: "X11; CrOS x86_64 14541.0.0",
            navigatorPlatform: "Linux x86_64",
        },
    };

    /**
     * Leading digits of a version string, the number used as GREASE seed.
     *
     * @memberof UserAgent
     */
    private static readonly MAJOR_VERSION_REGEX = /^(?<major>\d+)/;

    public constructor(
        private readonly options: UserAgentOptionsInterface,
    ) {
    }

    /**
     * Fake brand Chromium injects so that servers cannot assume a fixed brand list.
     *
     * @param {UserAgentVersionType} versionType Granularity of the version to attach.
     * @throws {InvalidArgumentException} If the configured version has no leading digits.
     * @returns {UserAgentBrandInterface} The greased brand for the configured version.
     */
    public greasedBrand(
        versionType: UserAgentVersionType = UserAgentVersionType.Major,
    ): UserAgentBrandInterface {
        const seed = this.seed();
        const chars = UserAgent.GREASE_CHARS;
        const version = UserAgent.GREASE_VERSIONS[seed % UserAgent.GREASE_VERSIONS.length];

        return {
            brand: `Not${chars[seed % chars.length]}A${chars[(seed + 1) % chars.length]}Brand`,
            version: versionType === UserAgentVersionType.Full
                ? `${version}${UserAgent.ZERO_VERSION_SUFFIX}`
                : version,
        };
    }

    /**
     * Brand list carrying major versions, the one behind `Sec-CH-UA`.
     *
     * @throws {InvalidArgumentException} If the configured version has no leading digits.
     * @returns {UserAgentBrandInterface[]} Brands already in their permuted order.
     */
    public brands(): UserAgentBrandInterface[] {
        return this.brandVersionList(UserAgentVersionType.Major);
    }

    /**
     * Brand list carrying complete versions, the one behind `Sec-CH-UA-Full-Version-List`.
     * Same brands and same order as `brands()`; only the versions differ.
     *
     * @throws {InvalidArgumentException} If the configured version has no leading digits.
     * @returns {UserAgentBrandInterface[]} Brands already in their permuted order.
     */
    public fullVersionList(): UserAgentBrandInterface[] {
        return this.brandVersionList(UserAgentVersionType.Full);
    }

    /**
     * High entropy identity for `Emulation.setUserAgentOverride`.
     *
     * @throws {InvalidArgumentException} If the configured version has no leading digits.
     * @returns {UserAgentMetadataInterface} Metadata matching the generated User-Agent string.
     */
    public metadata(): UserAgentMetadataInterface {
        const profile = this.platformProfile();
        const formFactors = this.hasFormFactors() ? { formFactors: [ this.formFactor() ] } : {};

        return {
            brands: this.brands(),
            fullVersionList: this.fullVersionList(),
            fullVersion: this.version(),
            platform: this.platform(),
            platformVersion: this.options.platformVersion ?? profile.platformVersion,
            architecture: this.options.architecture ?? profile.architecture,
            model: this.model(),
            mobile: this.isMobile(),
            bitness: this.options.bitness ?? profile.bitness,
            wow64: this.isWow64(),
            ...formFactors,
        };
    }

    /**
     * Serialized request headers, ready for an HTTP client or `setExtraHTTPHeaders`.
     * `Sec-CH-UA-Form-Factors` is absent when form factors are disabled, mirroring the
     * releases that never sent it.
     *
     * @throws {InvalidArgumentException} If the configured version has no leading digits.
     * @returns {UserAgentHeadersInterface} Every `Sec-CH-UA-*` header for this identity.
     */
    public headers(): UserAgentHeadersInterface {
        const metadata = this.metadata();
        const formFactors = this.hasFormFactors()
            ? { "Sec-CH-UA-Form-Factors": this.structuredField(this.formFactor()) }
            : {};

        return {
            "Sec-CH-UA": this.serializeBrandList(metadata.brands),
            "Sec-CH-UA-Arch": this.structuredField(metadata.architecture),
            "Sec-CH-UA-Bitness": this.structuredField(metadata.bitness),
            "Sec-CH-UA-Full-Version": this.structuredField(metadata.fullVersion),
            "Sec-CH-UA-Full-Version-List": this.serializeBrandList(metadata.fullVersionList),
            "Sec-CH-UA-Mobile": this.isMobile() ? "?1" : "?0",
            "Sec-CH-UA-Model": this.structuredField(metadata.model),
            "Sec-CH-UA-Platform": this.structuredField(metadata.platform),
            "Sec-CH-UA-Platform-Version": this.structuredField(metadata.platformVersion),
            "Sec-CH-UA-WoW64": this.isWow64() ? "?1" : "?0",
            ...formFactors,
        };
    }

    /**
     * Payload for `Emulation.setUserAgentOverride`, the single call that keeps the
     * User-Agent string and the client hints telling the same story.
     *
     * The top level `platform` is the one `navigator.platform` will report, so it
     * carries the frozen value and never the `Sec-CH-UA-Platform` token that goes
     * into `userAgentMetadata.platform`.
     *
     * @throws {InvalidArgumentException} If the configured version has no leading digits.
     * @returns {UserAgentOverrideInterface} Parameters for the CDP command.
     */
    public cdpParams(): UserAgentOverrideInterface {
        return {
            userAgent: this.toString(),
            acceptLanguage: this.options.acceptLanguage,
            platform: this.navigatorPlatform(),
            userAgentMetadata: this.metadata(),
        };
    }

    /**
     * Reduced User-Agent string, with the build and patch numbers frozen at zero the way
     * Chromium ships them since the User-Agent reduction.
     *
     * @throws {InvalidArgumentException} If the configured version has no leading digits.
     * @returns {string} The User-Agent string for this identity.
     */
    public toString(): string {
        const mobileToken = this.isMobile() ? "Mobile " : "";
        const chromeToken = `Chrome/${this.majorVersion()}${UserAgent.ZERO_VERSION_SUFFIX}`;

        return `Mozilla/5.0 (${this.platformProfile().systemInformation})`
            + ` AppleWebKit/537.36 (KHTML, like Gecko) ${chromeToken} ${mobileToken}Safari/537.36`;
    }

    /**
     * Convert To String
     *
     * @throws {InvalidArgumentException} If the configured version has no leading digits.
     * @returns {string} The User-Agent string for this identity.
     */
    public toNative(): string {
        return this.toString();
    }

    /**
     * Clone This Object
     *
     * @returns {UserAgent} A copy that no longer shares the additional brand list.
     */
    public clone(): UserAgent {
        return new UserAgent({
            ...this.options,
            additionalBrands: this.options.additionalBrands?.map((brand) => ({ ...brand })),
        });
    }

    /**
     * Assemble the canonical list and apply the seeded permutation to it.
     *
     * @param {UserAgentVersionType} versionType Granularity of the versions in the list.
     * @throws {InvalidArgumentException} If the configured version has no leading digits.
     * @returns {UserAgentBrandInterface[]} Brands in the order Chromium would emit them.
     */
    private brandVersionList(versionType: UserAgentVersionType): UserAgentBrandInterface[] {
        const version = this.versionFor(versionType);
        const productBrand = this.options.brand === undefined ? UserAgent.DEFAULT_BRAND : this.options.brand;
        const canonical: UserAgentBrandInterface[] = [
            this.greasedBrand(versionType),
            { brand: UserAgent.CHROMIUM_BRAND, version },
        ];

        if (productBrand !== null) {
            canonical.push({ brand: productBrand, version });
        }

        canonical.push(...this.additionalBrands(versionType));

        const order = this.permutationOrder(canonical.length, this.seed());
        const permuted = Array.from<UserAgentBrandInterface>({ length: canonical.length });

        for (const [ index, brandVersion ] of canonical.entries()) {
            permuted[order[index]] = brandVersion;
        }

        return permuted;
    }

    /**
     * Pick which version of the browser goes into a brand list.
     *
     * @param {UserAgentVersionType} versionType Granularity of the version to return.
     * @throws {InvalidArgumentException} If the configured version has no leading digits.
     * @returns {string} The complete version, or only its release number.
     */
    private versionFor(versionType: UserAgentVersionType): string {
        if (versionType === UserAgentVersionType.Full) return this.version();

        return this.majorVersion();
    }

    /**
     * Normalize the brands of Chromium forks, defaulting them to the declared version.
     *
     * @param {UserAgentVersionType} versionType Granularity of the versions in the list.
     * @throws {InvalidArgumentException} If a declared version has no leading digits.
     * @returns {UserAgentBrandInterface[]} Extra brands appended after the product brand.
     */
    private additionalBrands(versionType: UserAgentVersionType): UserAgentBrandInterface[] {
        return (this.options.additionalBrands ?? []).map((additional) => {
            const version = additional.version ?? this.version();

            return {
                brand: additional.brand,
                version: versionType === UserAgentVersionType.Full ? version : this.majorOf(version),
            };
        });
    }

    /**
     * Permutation of index `seed % size!` over `[0..size-1]` in lexicographic order — the
     * generalization of the hardcoded `orders` table Chromium keeps for up to three brands.
     *
     * @param {number} size How many brands take part in the permutation.
     * @param {number} seed Major version driving the choice of permutation.
     * @returns {number[]} Destination index of each canonical brand.
     */
    private permutationOrder(size: number, seed: number): number[] {
        const pool = Array.from({ length: size }, (_unused, position) => position);
        const order: number[] = [];
        let rest = seed % this.factorialOf(size);

        for (let slot = size; slot > 0; slot--) {
            const block = this.factorialOf(slot - 1);
            const pick = Math.floor(rest / block);

            rest %= block;
            order.push(...pool.splice(pick, 1));
        }

        return order;
    }

    /**
     * Factorial of a small non negative integer.
     *
     * @param {number} value How many brands take part in the permutation.
     * @returns {number} How many distinct orders exist for that many brands.
     */
    private factorialOf(value: number): number {
        let result = 1;

        for (let current = value; current > 1; current--) {
            result *= current;
        }

        return result;
    }

    /**
     * Serialize a brand list as an RFC 8941 Structured Fields list.
     *
     * @param {UserAgentBrandInterface[]} brands Brands already in their permuted order.
     * @returns {string} Header value such as `"Chromium";v="124", "Not-A.Brand";v="99"`.
     */
    private serializeBrandList(brands: UserAgentBrandInterface[]): string {
        return brands
            .map((entry) => `${this.structuredField(entry.brand)};v=${this.structuredField(entry.version)}`)
            .join(", ");
    }

    /**
     * Quote a value as an RFC 8941 sf-string. `JSON.stringify` escapes exactly the two
     * characters the grammar requires, the backslash and the double quote.
     *
     * @param {string} value Raw value to place inside a header.
     * @returns {string} The value wrapped in double quotes, escaped.
     */
    private structuredField(value: string): string {
        return JSON.stringify(value);
    }

    /**
     * Defaults of the platform being impersonated.
     *
     * @returns {UserAgentPlatformProfileInterface} Fallback values for every unset field.
     */
    private platformProfile(): UserAgentPlatformProfileInterface {
        return UserAgent.PLATFORM_PROFILES[this.platform()];
    }

    /**
     * Operating system being impersonated.
     *
     * @returns {UserAgentPlatform} The configured platform, Windows when unset.
     */
    private platform(): UserAgentPlatform {
        return this.options.platform ?? UserAgentPlatform.Windows;
    }

    /**
     * Value `navigator.platform` reports, the one CDP takes as its top level `platform`.
     * Chromium froze it per platform, so it does not follow the platform hint.
     *
     * @returns {string} The configured value, or the frozen value of the platform.
     */
    private navigatorPlatform(): string {
        return this.options.navigatorPlatform ?? this.platformProfile().navigatorPlatform;
    }

    /**
     * Complete browser version, whitespace trimmed.
     *
     * @returns {string} The version exactly as it goes on the wire.
     */
    private version(): string {
        return this.options.version.trim();
    }

    /**
     * Release number of the configured version.
     *
     * @throws {InvalidArgumentException} If the configured version has no leading digits.
     * @returns {string} Leading digits of the version.
     */
    private majorVersion(): string {
        return this.majorOf(this.version());
    }

    /**
     * Number Chromium feeds to the GREASE algorithm.
     *
     * @throws {InvalidArgumentException} If the configured version has no leading digits.
     * @returns {number} The release number of the configured version.
     */
    private seed(): number {
        return Number(this.majorVersion());
    }

    /**
     * Extract the release number out of any version string.
     *
     * @param {string} version Version to read, complete or already reduced.
     * @throws {InvalidArgumentException} If the version has no leading digits.
     * @returns {string} Leading digits of the version.
     */
    private majorOf(version: string): string {
        const major = UserAgent.MAJOR_VERSION_REGEX.exec(version.trim())?.groups?.major;

        if (major === undefined) {
            throw new InvalidArgumentException(
                `Invalid browser version "${version}", expected a number first like "124.0.6367.60"`,
            );
        }

        return major;
    }

    /**
     * Device name to advertise. Desktop identities never report one.
     *
     * @returns {string} The configured model, the platform default, or an empty string.
     */
    private model(): string {
        if (this.options.model !== undefined) return this.options.model;

        return this.isMobile() ? this.platformProfile().model : "";
    }

    /**
     * Form factor matching the device class of this identity.
     *
     * @returns {string} Either `Mobile` or `Desktop`.
     */
    private formFactor(): string {
        return this.isMobile() ? "Mobile" : "Desktop";
    }

    /**
     * Whether this identity is a phone or a tablet.
     *
     * @returns {boolean} False unless the caller asked for a mobile identity.
     */
    private isMobile(): boolean {
        return this.options.isMobile ?? false;
    }

    /**
     * Whether this identity runs 32 bit under the Windows emulation layer.
     *
     * @returns {boolean} The configured value, or the platform default.
     */
    private isWow64(): boolean {
        return this.options.isWow64 ?? this.platformProfile().isWow64;
    }

    /**
     * Whether this identity advertises form factors at all.
     *
     * @returns {boolean} True unless the caller opted out for an old release.
     */
    private hasFormFactors(): boolean {
        return this.options.shouldIncludeFormFactors ?? true;
    }

}
