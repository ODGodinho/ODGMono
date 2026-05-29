import { CacheHandlerException } from "#exceptions/CacheHandlerException";
import type { CacheHandlerInterface } from "#interfaces/CacheHandlerInterface";

export class CacheManager<CacheType extends object> {

    private readonly handlers = new Map<string, CacheHandlerInterface<CacheType>>();

    private readonly handlerOrder: string[] = []; // Ordem para fallback

    private defaultTtl?: number;

    public getDefaultTtl(): number | undefined {
        return this.defaultTtl;
    }

    public setDefaultTtl(ttl: number | undefined): this {
        this.defaultTtl = ttl;

        return this;
    }

    /**
     * Add handler to the Map with a unique name
     *
     * @param {CacheHandlerInterface<CacheType>} handler - Instância do handler
     * @param {"end" | "start"} position - Position of handler in fallback order (default: "end")
     * @throws {CacheHandlerException} If a handler with the same name already exists
     */
    public addHandler(
        handler: CacheHandlerInterface<CacheType>,
        position: "end" | "start" = "end",
    ): void {
        if (this.handlers.has(handler.name)) {
            throw new CacheHandlerException(`Handler with name "${handler.name}" already exists`);
        }

        this.handlers.set(handler.name, handler);

        if (position === "start") {
            this.handlerOrder.unshift(handler.name);

            return;
        }

        this.handlerOrder.push(handler.name);
    }

    /**
     * Remove handler por nome
     *
     * @param {string} name - Nome do handler
     * @returns {boolean} true se foi removido, false caso contrário
     */
    public removeHandler(name: string): boolean {
        const removed = this.handlers.delete(name);

        const index = this.handlerOrder.indexOf(name);

        if (index !== -1) {
            this.handlerOrder.splice(index, 1);
        }

        return removed;
    }

    /**
     * Busca handler por nome
     *
     * @param {string} name - Nome do handler
     * @throws {CacheHandlerException} Se handler não encontrado
     * @returns {CacheHandlerInterface<CacheType>} Handler encontrado ou undefined
     */
    public getHandler(name: string): CacheHandlerInterface<CacheType> {
        const handler = this.handlers.get(name);

        if (!handler) {
            throw new CacheHandlerException(`Handler "${name}" not found`);
        }

        return handler;
    }

    public getHandlers(): Array<CacheHandlerInterface<CacheType>> {
        return this.handlerOrder.map((name) => this.getHandler(name));
    }

    /**
     * Verifica existência de handler por nome
     *
     * @param {string} name - Nome do handler
     * @returns {boolean} true se existe, false caso contrário
     */
    public hasHandler(name: string): boolean {
        return this.handlers.has(name);
    }

}
