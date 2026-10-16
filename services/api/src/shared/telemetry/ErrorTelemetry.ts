export interface TelemetryErrorRecord {
  id: string;
  timestamp: string;
  message: string;
  name: string;
  stack?: string;
  statusCode: number;
  errorCode?: string;
  requestId?: string;
  route?: string;
  method?: string;
  userId?: string;
  clientIp?: string;
  metadata?: Record<string, unknown>;
}

export interface TelemetrySummary {
  totalRecorded: number;
  unhandled5xxCount: number;
  recentErrors: TelemetryErrorRecord[];
  byRoute: Record<string, number>;
  byErrorCode: Record<string, number>;
  uptimeSeconds: number;
}

class ErrorTelemetryService {
  private readonly maxBufferSize = 200;
  private readonly buffer: TelemetryErrorRecord[] = [];
  private readonly startTime = Date.now();
  private totalRecorded = 0;
  private unhandled5xxCount = 0;

  /**
   * Sanitizes sensitive fields like passwords, authorization headers, and tokens.
   */
  private sanitizeMetadata(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!meta) return undefined;
    const clean: Record<string, unknown> = {};
    const sensitiveKeys = ["password", "token", "authorization", "secret", "cookie", "key"];

    for (const [key, value] of Object.entries(meta)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        clean[key] = "[REDACTED]";
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        clean[key] = this.sanitizeMetadata(value as Record<string, unknown>);
      } else {
        clean[key] = value;
      }
    }
    return clean;
  }

  /**
   * Records an exception into the in-memory telemetry buffer.
   */
  public record(params: {
    error: Error;
    statusCode?: number;
    errorCode?: string;
    requestId?: string;
    route?: string;
    method?: string;
    userId?: string;
    clientIp?: string;
    metadata?: Record<string, unknown>;
  }): TelemetryErrorRecord {
    const statusCode = params.statusCode ?? 500;
    const is5xx = statusCode >= 500;

    this.totalRecorded++;
    if (is5xx) {
      this.unhandled5xxCount++;
    }

    const record: TelemetryErrorRecord = {
      id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      message: params.error.message || "Unknown error",
      name: params.error.name || "Error",
      stack: params.error.stack,
      statusCode,
      errorCode: params.errorCode,
      requestId: params.requestId,
      route: params.route,
      method: params.method,
      userId: params.userId,
      clientIp: params.clientIp,
      metadata: this.sanitizeMetadata(params.metadata),
    };

    this.buffer.unshift(record);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.pop();
    }

    return record;
  }

  /**
   * Generates a telemetry summary for admin inspection.
   */
  public getSummary(): TelemetrySummary {
    const byRoute: Record<string, number> = {};
    const byErrorCode: Record<string, number> = {};

    for (const err of this.buffer) {
      if (err.route) {
        byRoute[err.route] = (byRoute[err.route] ?? 0) + 1;
      }
      const code = err.errorCode || `HTTP_${err.statusCode}`;
      byErrorCode[code] = (byErrorCode[code] ?? 0) + 1;
    }

    return {
      totalRecorded: this.totalRecorded,
      unhandled5xxCount: this.unhandled5xxCount,
      recentErrors: this.buffer.slice(0, 50),
      byRoute,
      byErrorCode,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  public clear(): void {
    this.buffer.length = 0;
    this.totalRecorded = 0;
    this.unhandled5xxCount = 0;
  }
}

export const ErrorTelemetry = new ErrorTelemetryService();
