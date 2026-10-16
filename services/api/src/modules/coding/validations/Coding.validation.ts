import { z } from "zod";

export const ExecuteCodeSchema = z.object({
  language: z.enum(["typescript", "javascript", "python", "java", "cpp", "go"]),
  code: z.string().min(1).max(50000),
  stdin: z.string().max(10000).optional(),
  timeoutMs: z.number().int().min(500).max(15000).optional(),
});

export const TestCaseItemSchema = z.object({
  id: z.string().min(1),
  input: z.string().default(""),
  expectedOutput: z.string().default(""),
  isHidden: z.boolean().optional(),
});

export const RunTestCasesSchema = z.object({
  language: z.enum(["typescript", "javascript", "python", "java", "cpp", "go"]),
  code: z.string().min(1).max(50000),
  testCases: z.array(TestCaseItemSchema).min(1).max(20),
  timeoutMs: z.number().int().min(500).max(15000).optional(),
});
