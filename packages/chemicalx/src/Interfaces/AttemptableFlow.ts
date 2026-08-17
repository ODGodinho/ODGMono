import type { Exception } from "@odg/exception";

import type { RetryAction } from "#enums";
import type { RetryOptionsInterface } from "#interfaces";

export interface AttemptableInterface {

    /**
     * Attempt currently running (starts at 1).
     *
     * Owned by the flow, not by the implementing class.
     *
     * @type {number}
     */
    currentAttempt: number;

    /**
     * Executes the main step of the flow.
     *
     * This is the core method that will be retried if it fails.
     *
     * @param {...Parameters<RetryOptionsInterface["callback"]>} argumentsCallback The running attempt (starts at 1)
     * and the `AbortSignal`, forwarded by the flow.
     * @returns {Promise<void>}
     */
    execute(
        ...argumentsCallback: Parameters<RetryOptionsInterface["callback"]>
    ): Promise<void>;

    /**
     * Called when the flow finishes successfully.
     *
     * Use this to handle any success logic.
     *
     * @returns {Promise<void>}
     */
    success?(): Promise<void>;

    /**
     * Called after each failed attempt.
     *
     * Return a retry action to control retry behavior.
     *
     * @param {Exception} exception Last Exception to dispatch this function
     * @param {number} attempt Current attempt (starts at 1).
     * @returns {Promise<RetryAction>}
     */
    retrying?(exception: Exception, attempt: number): Promise<RetryAction>;

    /**
     * Called when all attempts have failed.
     *
     * Use this to handle final failure logic.
     * You should re-throw the exception if needed.
     *
     * @param {Exception} exception Last exception in attemptableFlow
     * @returns {Promise<void>}
     */
    failure?(exception: Exception): Promise<void>;

    /**
     * Called when the flow ends, whether successful or failed.
     *
     * Use this to clean up resources or log results.
     *
     * @param {Exception} exception Exception If it ends with failure
     * @returns {Promise<void>}
     */
    finish?(exception?: Exception): Promise<void>;

    /**
     * Returns the total number of allowed attempts.
     *
     * @returns {Promise<number>}
     */
    attempt(): Promise<number>;

    /**
     * Sleep time before retrying milliseconds
     *
     * @returns {Promise<number>}
     */
    sleep?(): Promise<number>;

}
