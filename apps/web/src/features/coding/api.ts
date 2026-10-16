import { apiClient } from "../../lib/apiClient";

export interface CodeExecutionPayload {
  language: "typescript" | "javascript" | "python" | "java" | "cpp" | "go";
  code: string;
  stdin?: string;
  timeoutMs?: number;
}

export interface CodeExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  memoryUsageKb: number;
  timedOut: boolean;
  status: "SUCCESS" | "RUNTIME_ERROR" | "TIMEOUT" | "COMPILATION_ERROR";
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function executeCode(
  payload: CodeExecutionPayload
): Promise<CodeExecutionResult> {
  const res = await apiClient.post<ApiEnvelope<CodeExecutionResult>>(
    "/coding/execute",
    payload
  );
  return res.data.data;
}
