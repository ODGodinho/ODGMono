import type * as NodeChildProcess from "node:child_process";

import { Exception } from "@odg/exception";
import { type LoggerParserInterface, LogLevel } from "@odg/log";
import { MessageException, MessageResponse, type RequestInterface } from "@odg/message";
import { vi } from "vitest";

import { JSONLogger, JSONLoggerPlugin, JSONParserUnknownException } from "#app";

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

            return Promise.reject(new JSONParserUnknownException("exec promisify fallback missing"));
        },
    });

    return {
        ...actual,
        exec: patchedExec as typeof origExec,
    };
});

describe("JSONLoggerPlugin coverage", () => {
    test("parseException returns undefined for non-Error", async () => {
        const logger = new JSONLoggerPlugin("app");

        await expect(logger["parseException"]("not an error")).resolves.toBeUndefined();
    });

    test("parseException maps Error without stack", async () => {
        const logger = new JSONLoggerPlugin("app");
        const error = new Exception("no stack");

        error.stack = undefined;

        await expect(logger["parseException"](error)).resolves.toMatchObject({
            type: "Exception",
            message: "no stack",
            stack: undefined,
        });
    });

    test("parseRequest strips keys starting with $", async () => {
        const logger = new JSONLoggerPlugin("app");
        const request: RequestInterface<unknown> & { $hidden: string } = {
            url: "/u",
            method: "GET",
            $hidden: "x",
        };
        const response = new MessageResponse(request, { data: "", status: 200, headers: {} });

        const parsed = await logger["parseRequest"](response);

        expect(parsed).toBeDefined();
        expect(parsed && Object.prototype.hasOwnProperty.call(parsed, "$hidden")).toBe(false);
    });

    test("isRequestOrResponseMessage for plain request", async () => {
        const logger = new JSONLoggerPlugin("app");

        await expect(logger["isRequestOrResponseMessage"]({ url: "/", method: "POST" })).resolves.toBe(true);
        await expect(logger["isRequestOrResponseMessage"]({})).resolves.toBe(false);
    });

    test("getRequestMessage returns undefined for unrelated object", async () => {
        const logger = new JSONLoggerPlugin("app");

        await expect(logger["getRequestMessage"]({ foo: 1 })).resolves.toBeUndefined();
    });

    test("logJSON uses getMessage for plain request", async () => {
        const logger = new JSONLoggerPlugin("app");
        const out = await logger.logJSON(LogLevel.INFO, { url: "/path", method: "GET", baseURL: "https://x" });

        expect(out.message).toBe("https://x/path");
    });

    test("logJSON uses getMessage for MessageException", async () => {
        const logger = new JSONLoggerPlugin("app");
        const request = { url: "/api", method: "GET" };
        const message = new MessageException("err", undefined, undefined, request, {
            data: "",
            status: 404,
            headers: {},
        });

        const out = await logger.logJSON(LogLevel.WARNING, message);

        expect(out.message).toBe("/api");
        expect(out.request).toMatchObject({ url: "/api", method: "GET" });
    });

    test("getMessage stringifies plain object", async () => {
        const logger = new JSONLoggerPlugin("app");

        const plainObject = { keyOne: 1 };

        await expect(logger["getMessage"](plainObject)).resolves.toBe(JSON.stringify(plainObject));
    });

    test("getMessage catch uses util.format when JSON.stringify throws", async () => {
        const logger = new JSONLoggerPlugin("app");
        const circular: Record<string, unknown> = {};

        circular.self = circular;

        const out = await logger["getMessage"](circular);

        expect(out).toMatch(/Circular/i);
    });

    test("getMessage handles BigInt via catch branch", async () => {
        const logger = new JSONLoggerPlugin("app");

        await expect(logger["getMessage"](7n)).resolves.toBeTruthy();
    });

    test("parser success returns message from logJSON", async () => {
        const logger = new JSONLoggerPlugin("app");
        const withoutOriginal: Omit<LoggerParserInterface, "original"> = {
            level: LogLevel.INFO,
            message: "hello",
            context: {},
        };
        const dataLoggerParser: LoggerParserInterface = {
            ...withoutOriginal,
            original: withoutOriginal,
        };

        const parsed = await logger.parser(dataLoggerParser);

        expect(parsed.level).toBe(LogLevel.INFO);
        expect(parsed.message).toBeInstanceOf(JSONLogger);
        expect((parsed.message as JSONLogger).message).toBe("hello");
    });

    test("getGitRelease assigns from exec when release unset", async () => {
        const logger = new JSONLoggerPlugin("app");

        await expect(logger["getGitRelease"]()).resolves.toBe(mockGitReleaseLabel);
        await expect(logger["getGitRelease"]()).resolves.toBe(mockGitReleaseLabel);
    });

    test("getGitBranch assigns from exec when branch unset", async () => {
        const logger = new JSONLoggerPlugin("app");

        await expect(logger["getGitBranch"]()).resolves.toBe(mockGitBranchLabel);
        await expect(logger["getGitBranch"]()).resolves.toBe(mockGitBranchLabel);
    });

    test("getGitRelease returns empty when not Node", async () => {
        const logger = new JSONLoggerPlugin("app");
        const spy = vi.spyOn(logger as unknown as { isNode(): boolean }, "isNode").mockReturnValue(false);

        await expect(logger["getGitRelease"]()).resolves.toBe("");
        spy.mockRestore();
    });

    test("getInstance uses HOSTNAME when set", async () => {
        const logger = new JSONLoggerPlugin("app", 10, undefined);
        const previous = process.env.HOSTNAME;

        process.env.HOSTNAME = "test-host";

        try {
            await expect(logger.logJSON(LogLevel.INFO, "x")).resolves.toMatchObject({ instance: "test-host" });
        } finally {
            if (previous === undefined) delete process.env.HOSTNAME;
            else process.env.HOSTNAME = previous;
        }
    });

    test("getInstance uses CONTAINER_ID when HOSTNAME missing", async () => {
        const logger = new JSONLoggerPlugin("app", 10, undefined);
        const saved = {
            HOSTNAME: process.env.HOSTNAME,
            CONTAINER_ID: process.env.CONTAINER_ID,
        };

        delete process.env.HOSTNAME;
        process.env.CONTAINER_ID = "cid-1";

        try {
            await expect(logger.logJSON(LogLevel.INFO, "x")).resolves.toMatchObject({ instance: "cid-1" });
        } finally {
            if (saved.HOSTNAME === undefined) delete process.env.HOSTNAME;
            else process.env.HOSTNAME = saved.HOSTNAME;
            if (saved.CONTAINER_ID === undefined) delete process.env.CONTAINER_ID;
            else process.env.CONTAINER_ID = saved.CONTAINER_ID;
        }
    });

    test("getInstance uses DOCKER_CONTAINER_UUID when prior env missing", async () => {
        const logger = new JSONLoggerPlugin("app", 10, undefined);
        const saved = {
            HOSTNAME: process.env.HOSTNAME,
            CONTAINER_ID: process.env.CONTAINER_ID,
            DOCKER_CONTAINER_UUID: process.env.DOCKER_CONTAINER_UUID,
        };

        delete process.env.HOSTNAME;
        delete process.env.CONTAINER_ID;
        process.env.DOCKER_CONTAINER_UUID = "uuid-2";

        try {
            await expect(logger.logJSON(LogLevel.INFO, "x")).resolves.toMatchObject({ instance: "uuid-2" });
        } finally {
            if (saved.HOSTNAME === undefined) delete process.env.HOSTNAME;
            else process.env.HOSTNAME = saved.HOSTNAME;
            if (saved.CONTAINER_ID === undefined) delete process.env.CONTAINER_ID;
            else process.env.CONTAINER_ID = saved.CONTAINER_ID;
            if (saved.DOCKER_CONTAINER_UUID === undefined) delete process.env.DOCKER_CONTAINER_UUID;
            else process.env.DOCKER_CONTAINER_UUID = saved.DOCKER_CONTAINER_UUID;
        }
    });

    test("parseExceptionPrevious walks Exception chain", async () => {
        const logger = new JSONLoggerPlugin("app", 5);
        const root = new Exception("root");
        const mid = new Exception("mid", root);
        const top = new Exception("top", mid);

        const previousChain = await logger["parseExceptionPrevious"](top);

        expect(previousChain?.length).toBeGreaterThanOrEqual(2);
    });
});
