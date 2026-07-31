/**
 * Granularity of the version number written into a brand list.
 *
 * Chromium builds the very same brand list twice per navigation: once truncated for
 * `Sec-CH-UA` and once complete for `Sec-CH-UA-Full-Version-List`.
 *
 * @enum {string}
 */
export enum UserAgentVersionType {

    /**
     * Only the release number, as sent in the low entropy `Sec-CH-UA` header (`124`).
     *
     * @memberof UserAgentVersionType
     */
    Major = "major",

    /**
     * The four part build number, as sent in `Sec-CH-UA-Full-Version-List` (`124.0.6367.60`).
     *
     * @memberof UserAgentVersionType
     */
    Full = "full",
}
