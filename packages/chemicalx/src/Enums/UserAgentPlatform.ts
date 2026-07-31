/**
 * Platforms accepted by `Sec-CH-UA-Platform` and by the CDP `userAgentMetadata.platform`.
 *
 * The values are the literal tokens Chromium emits — casing is part of the wire format
 * and MUST NOT be normalized, otherwise the hint stops matching a real browser.
 *
 * @enum {string}
 */
export enum UserAgentPlatform {

    /**
     * Desktop Windows. Reports the UniversalApiContract number as platform version,
     * not the operating system release.
     *
     * @memberof UserAgentPlatform
     */
    Windows = "Windows",

    /**
     * Desktop macOS. The only token that is not capitalized, exactly as Chromium sends it.
     *
     * @memberof UserAgentPlatform
     */
    MacOS = "macOS",

    /**
     * Desktop Linux. Chromium leaves the platform version empty on this one.
     *
     * @memberof UserAgentPlatform
     */
    Linux = "Linux",

    /**
     * Phones and tablets running Android, the only platform that reports a device model.
     *
     * @memberof UserAgentPlatform
     */
    Android = "Android",

    /**
     * ChromeOS devices. Its platform version is the ChromeOS build number, not a semver.
     *
     * @memberof UserAgentPlatform
     */
    ChromeOS = "Chrome OS",
}
