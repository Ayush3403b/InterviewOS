export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string = "INTERNAL_SERVER_ERROR"
  ) {
    super(message);

    this.name = "ApiError";

    Error.captureStackTrace(this, this.constructor);
  }
}