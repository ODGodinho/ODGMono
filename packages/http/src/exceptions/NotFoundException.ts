import httpStatus from "http-status";

import { HttpException } from "./HttpException.ts";

/** Nothing on the HTTP surface matched the request. */
export class NotFoundException extends HttpException {

    public readonly statusCode = httpStatus.NOT_FOUND;

}
