export class ApiResponse<T> {
  constructor(
    public success: boolean,
    public message: string,
    public data?: T,
    public meta?: Record<string, unknown>
  ) {}

  static success<T>(
    message: string,
    data?: T,
    meta?: Record<string, unknown>
  ) {
    return new ApiResponse(true, message, data, meta);
  }

  static failure(
    message: string,
    meta?: Record<string, unknown>
  ) {
    return new ApiResponse(false, message, undefined, meta);
  }
}