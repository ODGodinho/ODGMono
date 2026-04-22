export enum EventName {}

/** Test mock only — anchor property avoids empty-interface lint noise. */
export interface EventBaseInterface {
    readonly __mock?: unknown;
}
