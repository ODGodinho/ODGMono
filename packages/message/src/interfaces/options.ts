import type zod from "zod";

import type { ProxyValidator } from "../Validators/ProxyValidator";

/**
 * Proxy interface for requests
 */
export type ProxyConfigInterface = Omit<zod.infer<typeof ProxyValidator.proxyValidator>, "name">;

export type ProxyObjectInterface = zod.infer<typeof ProxyValidator.proxyValidator>;

export type ProxyAuthInterface = zod.infer<typeof ProxyValidator.proxyAuthValidator>;
