import { beforeEach, describe, expect, it } from "vitest";
import { ErrorTelemetry } from "../../../shared/telemetry/ErrorTelemetry";

describe("ErrorTelemetry", () => {
  beforeEach(() => {
    ErrorTelemetry.clear();
  });

  it("records an error and redacts sensitive metadata", () => {
    const error = new Error("Database connection timed out");

    const record = ErrorTelemetry.record({
      error,
      statusCode: 500,
      errorCode: "DB_TIMEOUT",
      route: "/api/v1/users",
      method: "GET",
      metadata: {
        userId: "12345",
        password: "SuperSecretPassword123",
        token: "jwt.token.here",
        authorization: "Bearer 12345",
        nested: {
          secretKey: "top-secret",
          publicData: "safe-info",
        },
      },
    });

    expect(record.id).toBeDefined();
    expect(record.message).toBe("Database connection timed out");
    expect(record.statusCode).toBe(500);
    expect(record.metadata?.userId).toBe("12345");
    expect(record.metadata?.password).toBe("[REDACTED]");
    expect(record.metadata?.token).toBe("[REDACTED]");
    expect(record.metadata?.authorization).toBe("[REDACTED]");
    expect((record.metadata?.nested as any)?.secretKey).toBe("[REDACTED]");
    expect((record.metadata?.nested as any)?.publicData).toBe("safe-info");
  });

  it("generates an accurate telemetry summary", () => {
    ErrorTelemetry.record({
      error: new Error("Error 1"),
      statusCode: 500,
      route: "/api/v1/interviews",
    });

    ErrorTelemetry.record({
      error: new Error("Error 2"),
      statusCode: 502,
      route: "/api/v1/interviews",
    });

    ErrorTelemetry.record({
      error: new Error("Error 3"),
      statusCode: 400,
      route: "/api/v1/auth",
    });

    const summary = ErrorTelemetry.getSummary();

    expect(summary.totalRecorded).toBe(3);
    expect(summary.unhandled5xxCount).toBe(2);
    expect(summary.byRoute["/api/v1/interviews"]).toBe(2);
    expect(summary.byRoute["/api/v1/auth"]).toBe(1);
    expect(summary.recentErrors).toHaveLength(3);
  });
});
