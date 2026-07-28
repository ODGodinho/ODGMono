import * as zod from "zod";

export namespace ProxyValidator {

    export const proxyAuthValidator = zod.object({
        username: zod.string().trim().min(1),
        password: zod.string().trim().min(1),
    });

    export const proxyValidator = zod.object({
        host: zod.string().trim().min(1),
        protocol: zod.string().trim().min(1).optional(),
        port: zod.int().positive().optional(),
        name: zod.string().trim().min(1),
        auth: proxyAuthValidator.optional(),
    });
}
