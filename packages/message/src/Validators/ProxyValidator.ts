import { z } from "zod";

export namespace ProxyValidator {

    export const proxyAuthValidator = z.object({
        username: z.string().min(1),
        password: z.string().min(1),
    });

    export const proxyValidator = z.object({
        host: z.string().min(1),
        protocol: z.string().min(1).optional(),
        port: z.number().int().positive().optional(),
        name: z.string().min(1),
        auth: proxyAuthValidator.optional(),
    });
}
