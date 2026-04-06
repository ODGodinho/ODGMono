import type { LogLevel } from "../Interfaces/LogLevel";

export interface JSONLogFormattable {
    "type": LogLevel;
    "index": string;
    "instance": string;
    "message": string;
    "createdAt": Date;
    "request"?: {
        baseURL?: string;
        url?: string;
        method?: string;
        response?: { status?: number };
    };
    "exception"?: { "stack"?: string; "type"?: string; "message"?: string };
}

export function isJSONLogFormattable(message: unknown): message is JSONLogFormattable {
    if (message === null || typeof message !== "object") return false;

    const messageTyped = message as Record<string, unknown>;

    if (typeof messageTyped.index !== "string") return false;
    if (typeof messageTyped.message !== "string") return false;
    if (typeof messageTyped.request !== "object" && messageTyped.request) return false;

    return true;
}
