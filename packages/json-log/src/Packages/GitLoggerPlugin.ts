import type { LoggerParserInterface, LoggerPluginInterface } from "@odg/log";

import { JSONParserException } from "../Exceptions";
import type { GitLoggerInterface } from "../Interfaces";

import { JSONLogger } from "./JsonLogger";

const gitDescribeCommand = "git describe --tags --abbrev=41";
const gitRevParseCommand = "git rev-parse --abbrev-ref HEAD";

/**
 * Adds Git release/branch information to a {@link JSONLogger} message.
 *
 * On Node it shells out to Git to resolve release/branch automatically.
 * In a browser (or any non-Node runtime) Git can never run, so this plugin
 * requires the release/branch to be informed manually through the constructor
 * - Example: values injected at build time (`import.meta.env.VITE_GIT_*`).
 *
 * @author Dragons Gamers <https://github.com/ODGodinho>
 */
type ExecCommand = (command: string) => Promise<{ stdout: string; stderr: string }>;

export class GitLoggerPlugin implements LoggerPluginInterface {

    private static execCommandPromise?: Promise<ExecCommand>;

    public constructor(protected readonly git: GitLoggerInterface = {}) {

    }

    /**
     * Plugin parser Function that fills {@link JSONLogger.git} with release/branch information
     *
     * @param {LoggerParserInterface} data Received Data params
     * @returns {Promise<LoggerParserInterface>}
     */
    public async parser(data: LoggerParserInterface): Promise<LoggerParserInterface> {
        const { message } = data;

        if (!(message instanceof JSONLogger)) {
            throw new JSONParserException("Register JSONLogger before GitLoggerPlugin");
        }

        const [ release, branch ] = await Promise.all([
            this.getGitRelease().catch(() => void 0),
            this.getGitBranch().catch(() => void 0),
        ]);

        message.git = {
            release: release! || undefined,
            branch: branch! || undefined,
        };

        return {
            ...data,
            message,
        };
    }

    /**
     * Define current Git Release
     *
     * @param {string} release name of instance
     */
    public setGitRelease(release: string): void {
        this.git.release = release;
    }

    /**
     * Define current Git Branch
     *
     * @param {string} branch name of instance
     */
    public setGitBranch(branch: string): void {
        this.git.branch = branch;
    }

    /**
     * Return Git tag name. Resolved once and cached for the lifetime of this plugin.
     *
     * @returns {Promise<string>}
     */
    protected async getGitRelease(): Promise<string> {
        if (typeof this.git.release === "string") return this.git.release;
        if (!this.isNode()) return "";

        const gitVersion = await this.runGitCommand(gitDescribeCommand);

        return this.git.release ??= gitVersion;
    }

    /**
     * Return Git branch name. Resolved once and cached for the lifetime of this plugin.
     *
     * @returns {Promise<string>}
     */
    protected async getGitBranch(): Promise<string> {
        if (typeof this.git.branch === "string") return this.git.branch;
        if (!this.isNode()) return "";

        const gitVersion = await this.runGitCommand(gitRevParseCommand);

        return this.git.branch ??= gitVersion;
    }

    /**
     * Run a Git command. Only ever reached on Node, guarded by {@link isNode}
     * on every caller, so bundlers targeting the browser never need to
     * resolve `node:child_process`.
     *
     * @param {string} gitCommand Git command to run
     * @returns {Promise<string>}
     */
    private async runGitCommand(gitCommand: string): Promise<string> {
        GitLoggerPlugin.execCommandPromise ??= this.createExecCommand();

        const command = await GitLoggerPlugin.execCommandPromise;
        const { stdout } = await command(gitCommand);

        return stdout.trim();
    }

    /**
     * Resolve `node:child_process`/`node:util` lazily, once, and reuse the
     * result. Beyond avoiding repeated dynamic imports, awaiting the same
     * promise from concurrent callers (release/branch resolved together)
     * guarantees they both observe the same module instance.
     *
     * @returns {Promise<ExecCommand>}
     */
    private async createExecCommand(): Promise<ExecCommand> {
        const { exec } = await import("node:child_process");
        const { promisify } = await import("node:util");

        return promisify(exec);
    }

    private isNode(): boolean {
        return typeof process !== "undefined"
            && typeof (process as { versions?: { node?: string } }).versions?.node === "string";
    }

}
