import type { HttpHeadersInterface } from "./headers.ts";

export type ResponseType = "arraybuffer" | "blob" | "document" | "json" | "stream" | "text";

export interface ResponseInterface<ResponseData> {
    data: ResponseData;
    status: number;
    headers: HttpHeadersInterface;
}
