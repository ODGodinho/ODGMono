import type { UserAgentPlatform } from "#enums";

/**
 * One entry of a User-Agent Client Hints brand list.
 *
 * @interface UserAgentBrandInterface
 */
export interface UserAgentBrandInterface {

    /**
     * Brand name as it appears on the wire, already unescaped (`Google Chrome`).
     *
     * @type {string}
     * @memberof UserAgentBrandInterface
     */
    brand: string;

    /**
     * Version advertised for this brand, major only or complete depending on the list.
     *
     * @type {string}
     * @memberof UserAgentBrandInterface
     */
    version: string;
}

/**
 * Extra brand appended to the canonical list, used by Chromium forks such as Edge or Opera.
 *
 * @interface UserAgentAdditionalBrandInterface
 */
export interface UserAgentAdditionalBrandInterface {

    /**
     * Brand name of the fork.
     *
     * @type {string}
     * @memberof UserAgentAdditionalBrandInterface
     */
    brand: string;

    /**
     * Version of the fork. Falls back to the declared browser version when omitted.
     *
     * @type {string}
     * @memberof UserAgentAdditionalBrandInterface
     */
    version?: string;
}

/**
 * Per platform defaults applied whenever the caller does not override a field.
 *
 * @interface UserAgentPlatformProfileInterface
 */
export interface UserAgentPlatformProfileInterface {

    /**
     * Value for `Sec-CH-UA-Platform-Version`. Empty on the platforms Chromium leaves blank.
     *
     * @type {string}
     * @memberof UserAgentPlatformProfileInterface
     */
    platformVersion: string;

    /**
     * Value for `Sec-CH-UA-Arch` (`x86`, `arm`). Empty where the platform omits it.
     *
     * @type {string}
     * @memberof UserAgentPlatformProfileInterface
     */
    architecture: string;

    /**
     * Value for `Sec-CH-UA-Bitness` (`64`). Empty where the platform omits it.
     *
     * @type {string}
     * @memberof UserAgentPlatformProfileInterface
     */
    bitness: string;

    /**
     * Device name for `Sec-CH-UA-Model`. Only mobile platforms report one.
     *
     * @type {string}
     * @memberof UserAgentPlatformProfileInterface
     */
    model: string;

    /**
     * Whether a 32 bit build is running under the Windows emulation layer.
     *
     * @type {boolean}
     * @memberof UserAgentPlatformProfileInterface
     */
    isWow64: boolean;

    /**
     * Token written between the parentheses of the User-Agent string
     * (`Windows NT 10.0; Win64; x64`).
     *
     * @type {string}
     * @memberof UserAgentPlatformProfileInterface
     */
    systemInformation: string;
}

/**
 * Everything needed to derive a coherent browser identity.
 *
 * Only `version` is required: every other field falls back to the profile of the
 * chosen platform, so a partial input never produces a contradictory identity.
 *
 * @interface UserAgentOptionsInterface
 */
export interface UserAgentOptionsInterface {

    /**
     * Complete browser version, four parts (`124.0.6367.60`). Drives the GREASE seed.
     *
     * @type {string}
     * @memberof UserAgentOptionsInterface
     */
    version: string;

    /**
     * Operating system to impersonate. Defaults to Windows.
     *
     * @type {UserAgentPlatform}
     * @memberof UserAgentOptionsInterface
     */
    platform?: UserAgentPlatform;

    /**
     * Whether the identity is a phone or tablet. Adds the `Mobile` token to the
     * User-Agent string and flips `Sec-CH-UA-Mobile`.
     *
     * @type {boolean}
     * @memberof UserAgentOptionsInterface
     */
    isMobile?: boolean;

    /**
     * Product brand shipped next to Chromium. Defaults to `Google Chrome`;
     * pass `null` to advertise a plain Chromium build.
     *
     * @type {string | null}
     * @memberof UserAgentOptionsInterface
     */
    brand?: string | null;

    /**
     * Brands appended after the product brand, for forks that advertise themselves.
     *
     * @type {UserAgentAdditionalBrandInterface[]}
     * @memberof UserAgentOptionsInterface
     */
    additionalBrands?: UserAgentAdditionalBrandInterface[];

    /**
     * Overrides `Sec-CH-UA-Platform-Version`. On Windows this is the UniversalApiContract
     * number, not the operating system release: `15.0.0` and above means Windows 11.
     *
     * @type {string}
     * @memberof UserAgentOptionsInterface
     */
    platformVersion?: string;

    /**
     * Overrides `Sec-CH-UA-Arch`.
     *
     * @type {string}
     * @memberof UserAgentOptionsInterface
     */
    architecture?: string;

    /**
     * Overrides `Sec-CH-UA-Bitness`.
     *
     * @type {string}
     * @memberof UserAgentOptionsInterface
     */
    bitness?: string;

    /**
     * Overrides `Sec-CH-UA-Model`. Desktop identities report an empty model.
     *
     * @type {string}
     * @memberof UserAgentOptionsInterface
     */
    model?: string;

    /**
     * Overrides `Sec-CH-UA-WoW64`.
     *
     * @type {boolean}
     * @memberof UserAgentOptionsInterface
     */
    isWow64?: boolean;

    /**
     * Whether to advertise `formFactors`. Old Chromium releases never sent it, so
     * disable it when impersonating one. Enabled by default.
     *
     * @type {boolean}
     * @memberof UserAgentOptionsInterface
     */
    shouldIncludeFormFactors?: boolean;

    /**
     * Value forwarded as `acceptLanguage` to the CDP override payload.
     *
     * @type {string}
     * @memberof UserAgentOptionsInterface
     */
    acceptLanguage?: string;
}

/**
 * High entropy identity consumed by `Emulation.setUserAgentOverride`.
 *
 * @interface UserAgentMetadataInterface
 */
export interface UserAgentMetadataInterface {

    /**
     * Permuted brand list carrying major versions, mirrors `Sec-CH-UA`.
     *
     * @type {UserAgentBrandInterface[]}
     * @memberof UserAgentMetadataInterface
     */
    brands: UserAgentBrandInterface[];

    /**
     * Same brands in the same order, carrying complete versions.
     *
     * @type {UserAgentBrandInterface[]}
     * @memberof UserAgentMetadataInterface
     */
    fullVersionList: UserAgentBrandInterface[];

    /**
     * Complete browser version.
     *
     * @type {string}
     * @memberof UserAgentMetadataInterface
     */
    fullVersion: string;

    /**
     * Operating system token.
     *
     * @type {string}
     * @memberof UserAgentMetadataInterface
     */
    platform: string;

    /**
     * Operating system version, empty where the platform omits it.
     *
     * @type {string}
     * @memberof UserAgentMetadataInterface
     */
    platformVersion: string;

    /**
     * Processor family, empty where the platform omits it.
     *
     * @type {string}
     * @memberof UserAgentMetadataInterface
     */
    architecture: string;

    /**
     * Device name, empty on desktop identities.
     *
     * @type {string}
     * @memberof UserAgentMetadataInterface
     */
    model: string;

    /**
     * Whether the identity is a phone or tablet.
     *
     * @type {boolean}
     * @memberof UserAgentMetadataInterface
     */
    mobile: boolean;

    /**
     * Processor bitness, empty where the platform omits it.
     *
     * @type {string}
     * @memberof UserAgentMetadataInterface
     */
    bitness: string;

    /**
     * Whether a 32 bit build is running under the Windows emulation layer.
     *
     * @type {boolean}
     * @memberof UserAgentMetadataInterface
     */
    wow64: boolean;

    /**
     * Device form factors. Absent when the impersonated release predates the hint.
     *
     * @type {string[]}
     * @memberof UserAgentMetadataInterface
     */
    formFactors?: string[];
}

/**
 * Payload accepted by `Network.setUserAgentOverride` on both Puppeteer and Playwright.
 *
 * @interface UserAgentOverrideInterface
 */
export interface UserAgentOverrideInterface {

    /**
     * Reduced User-Agent string.
     *
     * @type {string}
     * @memberof UserAgentOverrideInterface
     */
    userAgent: string;

    /**
     * Language list sent as `Accept-Language`, left untouched when not configured.
     *
     * @type {string}
     * @memberof UserAgentOverrideInterface
     */
    acceptLanguage?: string;

    /**
     * Operating system token, kept in sync with the metadata.
     *
     * @type {string}
     * @memberof UserAgentOverrideInterface
     */
    platform: string;

    /**
     * High entropy identity backing the `Sec-CH-UA-*` hints.
     *
     * @type {UserAgentMetadataInterface}
     * @memberof UserAgentOverrideInterface
     */
    userAgentMetadata: UserAgentMetadataInterface;
}

/**
 * Serialized `Sec-CH-UA-*` request headers, each value already quoted and escaped
 * as the Structured Fields grammar requires. Keys are the literal header names.
 *
 * @interface UserAgentHeadersInterface
 */
export interface UserAgentHeadersInterface {
    "Sec-CH-UA": string;
    "Sec-CH-UA-Arch": string;
    "Sec-CH-UA-Bitness": string;
    "Sec-CH-UA-Form-Factors"?: string;
    "Sec-CH-UA-Full-Version": string;
    "Sec-CH-UA-Full-Version-List": string;
    "Sec-CH-UA-Mobile": string;
    "Sec-CH-UA-Model": string;
    "Sec-CH-UA-Platform": string;
    "Sec-CH-UA-Platform-Version": string;
    "Sec-CH-UA-WoW64": string;
}
