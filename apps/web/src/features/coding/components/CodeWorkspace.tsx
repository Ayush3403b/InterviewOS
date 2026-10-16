import { useState } from "react";
import { Play, RotateCcw, Copy, Check, Code2, Terminal, ChevronDown, ChevronUp } from "lucide-react";
import { executeCode } from "../api";

export type SupportedLanguage = "javascript" | "typescript" | "python";

interface CodeWorkspaceProps {
  initialCode?: string;
  initialLanguage?: SupportedLanguage;
  onCodeChange?: (code: string, language: SupportedLanguage) => void;
  onInsertIntoAnswer?: (formattedCodeBlock: string) => void;
}

const STARTER_TEMPLATES: Record<SupportedLanguage, string> = {
  javascript: `// Solution Implementation
function solution(input) {
  console.log("Processing input:", input);
  
  // TODO: Implement algorithm
  let result = [];
  
  return result;
}

// Test cases
console.log("Test 1 Result:", solution([1, 2, 3, 4]));
`,
  typescript: `// Solution Implementation with Types
interface TestCase<T> {
  input: T;
  expected?: unknown;
}

function solve<T extends number[]>(nums: T): number {
  console.log("Array length:", nums.length);
  
  // Calculate sum as baseline
  return nums.reduce((acc, curr) => acc + curr, 0);
}

// Example execution
console.log("Result:", solve([10, 20, 30]));
`,
  python: `# Python Solution
def solution(data):
    print(f"Analyzing {len(data)} items...")
    
    # Process items
    results = [x * 2 for x in data if x > 0]
    return results

# Test execution
print("Output:", solution([1, -2, 3, -4, 5]))
`,
};

export function CodeWorkspace({
  initialCode,
  initialLanguage = "javascript",
  onCodeChange,
  onInsertIntoAnswer,
}: CodeWorkspaceProps) {
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [code, setCode] = useState<string>(initialCode || STARTER_TEMPLATES[initialLanguage]);
  const [output, setOutput] = useState<string>("");
  const [executing, setExecuting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);
  const [showConsole, setShowConsole] = useState(true);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    const newCode = STARTER_TEMPLATES[newLang];
    setCode(newCode);
    onCodeChange?.(newCode, newLang);
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    onCodeChange?.(newCode, language);
  };

  const handleReset = () => {
    const defaultCode = STARTER_TEMPLATES[language];
    setCode(defaultCode);
    setOutput("");
    onCodeChange?.(defaultCode, language);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (!onInsertIntoAnswer) return;
    const formatted = `\`\`\`${language}\n${code.trim()}\n\`\`\``;
    onInsertIntoAnswer(formatted);
    setInserted(true);
    setTimeout(() => setInserted(false), 2000);
  };

  const runCode = async () => {
    setExecuting(true);
    setShowConsole(true);

    try {
      const response = await executeCode({
        language,
        code,
        timeoutMs: 5000,
      });

      let outputText = "";
      if (response.stdout) {
        outputText += response.stdout;
      }
      if (response.stderr) {
        if (outputText) outputText += "\n";
        outputText += `[Error]: ${response.stderr}`;
      }
      if (!response.stdout && !response.stderr) {
        outputText = "(Program finished with no output)";
      }

      outputText += `\n\n✓ Status: ${response.status} • Executed in ${response.executionTimeMs}ms • Memory: ${response.memoryUsageKb}KB`;
      setOutput(outputText.trim());
    } catch {
      // Graceful fallback for local evaluation if offline
      const startTime = performance.now();
      const logs: string[] = [];
      try {
        const customConsole = {
          log: (...args: unknown[]) => {
            logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "));
          },
          error: (...args: unknown[]) => {
            logs.push(`[ERROR] ${args.map((a) => String(a)).join(" ")}`);
          },
          warn: (...args: unknown[]) => {
            logs.push(`[WARN] ${args.map((a) => String(a)).join(" ")}`);
          },
        };

        let executableCode = code;
        if (language === "typescript") {
          executableCode = code
            .replace(/:\s*[A-Za-z0-9_<>\[\]|&]+/g, "")
            .replace(/interface\s+[A-Za-z0-9_<>\[\]]+\s*\{[\s\S]*?\}/g, "")
            .replace(/type\s+[A-Za-z0-9_<>\[\]]+\s*=[\s\S]*?;/g, "");
        }

        const runFn = new Function("console", `"use strict";\n${executableCode}`);
        const result = runFn(customConsole);
        const duration = (performance.now() - startTime).toFixed(1);
        let finalOutput = logs.join("\n");
        if (result !== undefined) {
          finalOutput += `\n→ Returned: ${JSON.stringify(result)}`;
        }
        finalOutput += `\n\n✓ Executed in ${duration}ms with exit code 0`;
        setOutput(finalOutput.trim());
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setOutput(`Runtime Exception:\n${errorMsg}\n\n${logs.join("\n")}`);
      }
    } finally {
      setExecuting(false);
    }
  };

  const lineCount = code.split("\n").length;

  return (
    <div className="rounded-xl border border-line bg-[#0D1117] text-white shadow-lg overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 bg-[#161B22] px-4 py-2 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-ink">
            <Code2 className="h-4 w-4 text-signal" />
            <span className="text-gray-200">Live Code Workspace</span>
          </div>

          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
            className="rounded-md border border-line bg-[#21262D] px-2.5 py-1 text-xs text-gray-200 focus:border-signal focus:outline-none"
          >
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python 3</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {onInsertIntoAnswer && (
            <button
              type="button"
              onClick={handleInsert}
              className="flex items-center gap-1 rounded-md bg-signal/20 px-2.5 py-1 text-xs font-medium text-signal hover:bg-signal/30 transition"
              title="Append code snippet to your written answer"
            >
              {inserted ? <Check className="h-3.5 w-3.5" /> : null}
              {inserted ? "Appended!" : "Insert into Answer"}
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md bg-[#21262D] px-2 py-1 text-xs text-gray-300 hover:bg-[#30363D]"
            title="Copy code to clipboard"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-live" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 rounded-md bg-[#21262D] px-2 py-1 text-xs text-gray-300 hover:bg-[#30363D]"
            title="Reset code to default boilerplate"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>

          <button
            type="button"
            onClick={runCode}
            disabled={executing}
            className="flex items-center gap-1.5 rounded-md bg-live px-3 py-1 text-xs font-semibold text-white hover:opacity-90 transition disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            {executing ? "Running..." : "Run Code"}
          </button>
        </div>
      </div>

      {/* Editor & Line Numbers */}
      <div className="relative flex min-h-[220px] max-h-[360px] overflow-auto bg-[#0D1117] font-mono text-xs">
        {/* Line numbers gutter */}
        <div className="select-none bg-[#161B22]/50 px-2.5 py-3 text-right text-gray-500 border-r border-line/40 shrink-0">
          {Array.from({ length: Math.max(lineCount, 10) }, (_, i) => (
            <div key={i + 1} className="leading-5">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea code editor */}
        <textarea
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          spellCheck={false}
          className="w-full resize-none bg-transparent p-3 font-mono text-xs leading-5 text-gray-100 placeholder-gray-600 focus:outline-none"
          placeholder="Write your code implementation here..."
        />
      </div>

      {/* Console drawer */}
      <div className="border-t border-line/60 bg-[#161B22]">
        <button
          type="button"
          onClick={() => setShowConsole(!showConsole)}
          className="flex w-full items-center justify-between px-4 py-1.5 text-xs text-gray-400 hover:text-gray-200"
        >
          <div className="flex items-center gap-1.5 font-medium">
            <Terminal className="h-3.5 w-3.5 text-gray-400" />
            <span>Output Console</span>
            {output && <span className="h-1.5 w-1.5 rounded-full bg-live" />}
          </div>
          {showConsole ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>

        {showConsole && (
          <div className="max-h-[140px] overflow-auto border-t border-line/40 bg-[#090D13] p-3 font-mono text-xs text-gray-300">
            {output ? (
              <pre className="whitespace-pre-wrap">{output}</pre>
            ) : (
              <p className="text-gray-600 italic">Click "Run Code" to view execution results and logs here.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
