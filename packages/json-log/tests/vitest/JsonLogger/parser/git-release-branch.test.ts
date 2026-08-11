import type * as NodeChildProcess from "node:child_process";

import { UnknownException } from "@odg/exception";
import { type LoggerParserInterface, LogLevel } from "@odg/log";
import { vi } from "vitest";

import { GitLoggerPlugin, type JSONLogger, JSONLoggerPlugin } from "#app";

type ExecCallback = (error: Error | null, stdout: Buffer | string, stderr: Buffer | string) => void;

const gitDescribeTagsSnippet = "describe --tags";
const gitRevParseBranchSnippet = "rev-parse --abbrev-ref";
const mockGitReleaseLabel = "mock-release";
const mockGitBranchLabel = "mock-branch";
const mockGitReleaseStdout = `${mockGitReleaseLabel}\n`;
const mockGitBranchStdout = `${mockGitBranchLabel}\n`;
const emptyExecStderr = "";

vi.mock("node:child_process", async (importOriginal) => {
    const actual = await importOriginal<typeof NodeChildProcess>();
    const origExec = actual.exec;
    const promisifyCustom = Symbol.for("nodejs.util.promisify.custom");

    type ExecPromise = Promise<{ stdout: Buffer | string; stderr: Buffer | string }>;

    function patchedExec(
        execContext: unknown,
        ...arguments_: Parameters<typeof origExec>
    ): ReturnType<typeof origExec> {
        const [ command ] = arguments_;
        const last = arguments_.at(-1);
        const previous = arguments_.at(-2);
        let callback: ExecCallback | undefined;

        if (typeof last === "function") {
            callback = last as ExecCallback;
        } else if (typeof previous === "function") {
            callback = previous as ExecCallback;
        }

        if (callback && command.includes(gitDescribeTagsSnippet)) {
            callback(null, mockGitReleaseStdout, emptyExecStderr);

            return undefined as unknown as ReturnType<typeof origExec>;
        }

        if (callback && command.includes(gitRevParseBranchSnippet)) {
            callback(null, mockGitBranchStdout, emptyExecStderr);

            return undefined as unknown as ReturnType<typeof origExec>;
        }

        return Reflect.apply(origExec, execContext, arguments_);
    }

    const origCustom = origExec[promisifyCustom as unknown as keyof typeof origExec] as
        | ((command: string, options?: object) => ExecPromise)
        | undefined;

    Object.defineProperty(patchedExec, promisifyCustom, {
        configurable: true,
        value: async function promisifiedExec(command: string, options?: object): ExecPromise {
            if (command.includes(gitDescribeTagsSnippet)) {
                return Promise.resolve({ stdout: mockGitReleaseStdout, stderr: emptyExecStderr });
            }

            if (command.includes(gitRevParseBranchSnippet)) {
                return Promise.resolve({ stdout: mockGitBranchStdout, stderr: emptyExecStderr });
            }

            if (origCustom) return origCustom.call(origExec, command, options ?? {});

            return Promise.reject(new Error("exec promisify fallback missing"));
        },
    });

    return {
        ...actual,
        exec: patchedExec as typeof origExec,
    };
});

interface LoggerGithubType {
    getGitRelease(): Promise<string>;
    getGitBranch(): Promise<string>;
}

async function parse(
    gitPlugin: GitLoggerPlugin,
    jsonLogger: JSONLoggerPlugin,
    message: unknown,
): Promise<JSONLogger> {
    const parsedLog = await jsonLogger.parser({
        original: { level: LogLevel.DEBUG, message, context: {} },
        level: LogLevel.DEBUG,
        message,
        context: {},
    });

    const result: LoggerParserInterface = await gitPlugin.parser(parsedLog);

    return result.message as JSONLogger;
}

describe("Test Git Release/Branch", () => {
    test("Test Mock Exception", async () => {
        const gitPlugin = new GitLoggerPlugin();
        const jsonLogger = new JSONLoggerPlugin("appName");
        const spyRelease = vi.spyOn(gitPlugin as unknown as LoggerGithubType, "getGitRelease");
        const spyBranch = vi.spyOn(gitPlugin as unknown as LoggerGithubType, "getGitBranch");
        const spyList = [ spyRelease, spyBranch ];

        for (const spy of spyList) {
            spy.mockImplementation(async (): Promise<never> => {
                throw new UnknownException("Anything");
            });
        }

        const result = await parse(gitPlugin, jsonLogger, "test");

        expect(result.index).toBe("appName");
        expect(result.git).toEqual({ branch: undefined, release: undefined });
    });

    test("Set Git Release/Branch", async () => {
        const gitPlugin = new GitLoggerPlugin();
        const jsonLogger = new JSONLoggerPlugin("appName");

        gitPlugin.setGitRelease("1.0.0");
        gitPlugin.setGitBranch("1.0.1");

        const result = await parse(gitPlugin, jsonLogger, "test");

        expect(result.index).toBe("appName");
        expect(result.git).toEqual({ branch: "1.0.1", release: "1.0.0" });
    });

    test("Manual release/branch (front-end usage) never runs git", async () => {
        const gitPlugin = new GitLoggerPlugin({ release: "2.0.0", branch: "main" });
        const jsonLogger = new JSONLoggerPlugin("appName");
        const spy = vi.spyOn(
            gitPlugin as unknown as { runGitCommand(command: string): Promise<string> },
            "runGitCommand",
        );

        const result = await parse(gitPlugin, jsonLogger, "test");

        expect(result.git).toEqual({ branch: "main", release: "2.0.0" });
        expect(spy).not.toHaveBeenCalled();
    });

    test("Resolves release/branch from git command when Node and unset", async () => {
        const gitPlugin = new GitLoggerPlugin();
        const jsonLogger = new JSONLoggerPlugin("appName");

        const result = await parse(gitPlugin, jsonLogger, "test");

        expect(result.git).toEqual({ branch: mockGitBranchLabel, release: mockGitReleaseLabel });

        // Second call reuses the cached value instead of running Git again.
        await expect(gitPlugin["getGitRelease"]()).resolves.toBe(mockGitReleaseLabel);
        await expect(gitPlugin["getGitBranch"]()).resolves.toBe(mockGitBranchLabel);
    });

    test("setGitRelease/setGitBranch override resolved values", async () => {
        const gitPlugin = new GitLoggerPlugin();

        gitPlugin.setGitRelease("3.0.0");
        gitPlugin.setGitBranch("develop");

        await expect(gitPlugin["getGitRelease"]()).resolves.toBe("3.0.0");
        await expect(gitPlugin["getGitBranch"]()).resolves.toBe("develop");
    });

    test("parser throws JSONParserException when message is not a JSONLogger", async () => {
        const gitPlugin = new GitLoggerPlugin();

        await expect(gitPlugin.parser({
            original: { level: LogLevel.DEBUG, message: "test", context: {} },
            level: LogLevel.DEBUG,
            message: "test",
            context: {},
        })).rejects.toMatchObject({
            message: "Register JSONLogger before GitLoggerPlugin",
        });
    });

    test("Never runs git when not Node", async () => {
        const gitPlugin = new GitLoggerPlugin();
        const jsonLogger = new JSONLoggerPlugin("appName");

        vi.spyOn(gitPlugin as unknown as { isNode(): boolean }, "isNode").mockReturnValue(false);

        const result = await parse(gitPlugin, jsonLogger, "test");

        expect(result.git).toEqual({ branch: undefined, release: undefined });
    });
});
