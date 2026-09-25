import type { LogLevel } from "../Enums/LogLevel.ts";

export interface JSONLogFormattable {
    "type": LogLevel;
    "index": string;
    "instance": string;
    "message": string;
    "createdAt": Date;
    "identifier"?: string;
    "request"?: {
        baseURL?: string;
        url?: string;
        method?: string;
        timestamps?: number;
        response?: { status?: number };
    };
    "exception"?: { "stack"?: string; "type"?: string; "message"?: string };
}

export function isJSONLogFormattable(message: unknown): message is JSONLogFormattable {
    if (message === null || typeof message !== "object") return false;

    const messageTyped = message as Record<string, unknown>;

    return typeof messageTyped.index === "string"
        && typeof messageTyped.message === "string"
        && (typeof messageTyped.request === "object" || !messageTyped.request);
}
