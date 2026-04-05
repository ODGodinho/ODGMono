import { access } from "node:fs/promises";

/**
 * Class helper for filesystem operations on a path (non-blocking).
 *
 * @class File
 */
export class File {

    public constructor(
        private readonly subject: string,
    ) {
    }

    /**
     * Whether this path exists and is accessible to the current process.
     *
     * @returns {Promise<boolean>}
     */
    public async exists(): Promise<boolean> {
        try {
            await access(this.subject);

            return true;
        } catch {
            return false;
        }
    }

}
