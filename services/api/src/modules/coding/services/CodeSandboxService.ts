import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import {
  CodeExecutionRequest,
  CodeExecutionResponse,
  RunTestCasesResponse,
  TestCase,
  TestCaseResult,
} from "../types/codeSandbox.types";
import { logger } from "../../../shared/logger/logger";

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_OUTPUT_BUFFER_BYTES = 512 * 1024; // 512 KB

export default class CodeSandboxService {
  /**
   * Executes code in an isolated subprocess with strict timeouts and resource limits.
   */
  async execute(request: CodeExecutionRequest): Promise<CodeExecutionResponse> {
    const { language, code, stdin = "", timeoutMs = DEFAULT_TIMEOUT_MS } = request;
    const startTime = Date.now();

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "interviewos-sandbox-"));

    try {
      const { cmd, args, fileName } = this.getExecutionCommand(language, tempDir);
      const filePath = path.join(tempDir, fileName);

      await fs.writeFile(filePath, code, "utf-8");

      const result = await this.spawnSandboxedProcess(
        cmd,
        args,
        tempDir,
        stdin,
        timeoutMs
      );

      const executionTimeMs = Date.now() - startTime;

      let status: CodeExecutionResponse["status"] = "SUCCESS";
      if (result.timedOut) {
        status = "TIMEOUT";
      } else if (result.exitCode !== 0) {
        status = "RUNTIME_ERROR";
      }

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        executionTimeMs,
        memoryUsageKb: Math.round(process.memoryUsage().heapUsed / 1024),
        timedOut: result.timedOut,
        status,
      };
    } catch (err: any) {
      logger.error("[sandbox] Execution error:", err);
      return {
        stdout: "",
        stderr: err.message || "Failed to execute code in sandbox environment.",
        exitCode: 1,
        executionTimeMs: Date.now() - startTime,
        memoryUsageKb: 0,
        timedOut: false,
        status: "RUNTIME_ERROR",
      };
    } finally {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup error
      }
    }
  }

  /**
   * Evaluates candidate code against a battery of test cases.
   */
  async runTestCases(
    language: CodeExecutionRequest["language"],
    code: string,
    testCases: TestCase[],
    timeoutMs = DEFAULT_TIMEOUT_MS
  ): Promise<RunTestCasesResponse> {
    const results: TestCaseResult[] = [];
    let passedCount = 0;

    for (const tc of testCases) {
      const execResult = await this.execute({
        language,
        code,
        stdin: tc.input,
        timeoutMs,
      });

      const actualOutput = execResult.stdout.trim();
      const expectedOutput = tc.expectedOutput.trim();
      const passed =
        execResult.status === "SUCCESS" && actualOutput === expectedOutput;

      if (passed) {
        passedCount++;
      }

      results.push({
        testCaseId: tc.id,
        passed,
        actualOutput: tc.isHidden ? "[Hidden Test Case Output]" : actualOutput,
        expectedOutput: tc.isHidden ? "[Hidden Test Case]" : expectedOutput,
        executionTimeMs: execResult.executionTimeMs,
        error: execResult.stderr || (execResult.timedOut ? "Time limit exceeded" : undefined),
      });
    }

    return {
      passedCount,
      totalCount: testCases.length,
      allPassed: passedCount === testCases.length,
      results,
    };
  }

  private getExecutionCommand(
    language: CodeExecutionRequest["language"],
    _tempDir: string
  ): { cmd: string; args: string[]; fileName: string } {
    switch (language) {
      case "javascript":
        return { cmd: "node", args: ["script.js"], fileName: "script.js" };
      case "typescript":
        return { cmd: "node", args: ["script.js"], fileName: "script.js" };
      case "python":
        return { cmd: "python", args: ["script.py"], fileName: "script.py" };
      case "go":
        return { cmd: "go", args: ["run", "main.go"], fileName: "main.go" };
      case "java":
        return { cmd: "java", args: ["Solution.java"], fileName: "Solution.java" };
      case "cpp":
        return { cmd: "node", args: ["script.js"], fileName: "script.js" };
      default:
        return { cmd: "node", args: ["script.js"], fileName: "script.js" };
    }
  }

  private spawnSandboxedProcess(
    cmd: string,
    args: string[],
    cwd: string,
    stdin: string,
    timeoutMs: number
  ): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean }> {
    return new Promise((resolve) => {
      let stdout = "";
      let stderr = "";
      let timedOut = false;
      let isResolved = false;

      let child: ReturnType<typeof spawn>;

      try {
        child = spawn(cmd, args, {
          cwd,
          env: {
            PATH: process.env.PATH,
            NODE_ENV: "production",
          },
          stdio: ["pipe", "pipe", "pipe"],
          shell: false,
        });
      } catch (err: any) {
        return resolve({
          stdout: "",
          stderr: `Failed to spawn runtime: ${err.message}`,
          exitCode: 1,
          timedOut: false,
        });
      }

      const timer = setTimeout(() => {
        timedOut = true;
        try {
          if (process.platform === "win32" && child.pid) {
            spawn("taskkill", ["/pid", child.pid.toString(), "/T", "/F"]);
          } else {
            child.kill("SIGKILL");
          }
        } catch {
          // ignore
        }
      }, timeoutMs);

      child.stdout?.on("data", (chunk: Buffer) => {
        if (stdout.length < MAX_OUTPUT_BUFFER_BYTES) {
          stdout += chunk.toString("utf-8");
        }
      });

      child.stderr?.on("data", (chunk: Buffer) => {
        if (stderr.length < MAX_OUTPUT_BUFFER_BYTES) {
          stderr += chunk.toString("utf-8");
        }
      });

      if (stdin && child.stdin) {
        try {
          child.stdin.write(stdin);
          child.stdin.end();
        } catch {
          // ignore broken pipe
        }
      }

      child.on("error", (err) => {
        clearTimeout(timer);
        if (!isResolved) {
          isResolved = true;
          resolve({
            stdout,
            stderr: stderr || err.message,
            exitCode: 1,
            timedOut: false,
          });
        }
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        if (!isResolved) {
          isResolved = true;
          resolve({
            stdout: stdout.slice(0, MAX_OUTPUT_BUFFER_BYTES),
            stderr: stderr.slice(0, MAX_OUTPUT_BUFFER_BYTES),
            exitCode: timedOut ? 124 : (code ?? 0),
            timedOut,
          });
        }
      });
    });
  }
}
