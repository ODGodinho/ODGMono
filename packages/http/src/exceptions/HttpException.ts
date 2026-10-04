import { Exception } from "@odg/exception";

/**
 * Base for an exception that already knows which status the surface should answer with.
 *
 * `ExceptionSerializer` reads `statusCode` off anything thrown, so this class is not a
 * requirement — it is the typed place to say it. An API's own failures (`UnprocessableException`,
 * `ConflictException`) extend this instead of re-deciding the field name in every project.
 */
export abstract class HttpException extends Exception {

    public abstract readonly statusCode: number;

}
