export type SupportedCodingLanguage =
  | "typescript"
  | "javascript"
  | "python"
  | "java"
  | "cpp"
  | "go";

export interface CodeExecutionRequest {
  language: SupportedCodingLanguage;
  code: string;
  stdin?: string;
  timeoutMs?: number;
}

export interface CodeExecutionResponse {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  memoryUsageKb: number;
  timedOut: boolean;
  status: "SUCCESS" | "RUNTIME_ERROR" | "TIMEOUT" | "COMPILATION_ERROR";
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface TestCaseResult {
  testCaseId: string;
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  executionTimeMs: number;
  error?: string;
}

export interface RunTestCasesResponse {
  passedCount: number;
  totalCount: number;
  allPassed: boolean;
  results: TestCaseResult[];
}
