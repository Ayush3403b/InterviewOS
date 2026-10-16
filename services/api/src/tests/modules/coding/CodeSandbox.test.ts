import { describe, expect, it } from "vitest";
import CodeSandboxService from "../../../modules/coding/services/CodeSandboxService";

describe("CodeSandboxService", () => {
  const sandbox = new CodeSandboxService();

  it("executes valid JavaScript / Node code and captures stdout", async () => {
    const code = `
      function twoSum(a, b) {
        return a + b;
      }
      console.log(twoSum(10, 25));
    `;

    const result = await sandbox.execute({
      language: "javascript",
      code,
      timeoutMs: 3000,
    });

    expect(result.status).toBe("SUCCESS");
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("35");
    expect(result.timedOut).toBe(false);
    expect(result.executionTimeMs).toBeGreaterThan(0);
  });

  it("captures runtime errors and non-zero exit codes", async () => {
    const code = `
      throw new Error("Syntax or logic exception");
    `;

    const result = await sandbox.execute({
      language: "javascript",
      code,
      timeoutMs: 3000,
    });

    expect(result.status).toBe("RUNTIME_ERROR");
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("Syntax or logic exception");
  });

  it("terminates execution when timeout is exceeded", async () => {
    const infiniteLoopCode = `
      while(true) {}
    `;

    const result = await sandbox.execute({
      language: "javascript",
      code: infiniteLoopCode,
      timeoutMs: 400,
    });

    expect(result.timedOut).toBe(true);
    expect(result.status).toBe("TIMEOUT");
  }, 10000);

  it("runs batch test cases successfully", async () => {
    const code = `
      const fs = require('fs');
      const input = fs.readFileSync(0, 'utf-8').trim();
      const num = parseInt(input, 10);
      console.log(num * 2);
    `;

    const testCases = [
      { id: "tc-1", input: "5", expectedOutput: "10" },
      { id: "tc-2", input: "12", expectedOutput: "24" },
      { id: "tc-3", input: "7", expectedOutput: "15" }, // will fail
    ];

    const batchResult = await sandbox.runTestCases("javascript", code, testCases, 3000);

    expect(batchResult.totalCount).toBe(3);
    expect(batchResult.passedCount).toBe(2);
    expect(batchResult.allPassed).toBe(false);
    expect(batchResult.results[0].passed).toBe(true);
    expect(batchResult.results[1].passed).toBe(true);
    expect(batchResult.results[2].passed).toBe(false);
  });
});
