#!/usr/bin/env ts-node
/**
 * scripts/check-routes.ts
 *
 * Asserts that every *Routes.ts file found under
 * services/api/src/modules is imported in services/api/src/routes/index.ts.
 *
 * This is the "build-it-once, stop-re-discovering-the-same-bug" guard
 * for the class of silent regressions where a new module's router is
 * added to its own directory but never mounted in the central index.
 *
 * Exit codes:
 *   0 — all route files are mounted
 *   1 — one or more route files are not imported in index.ts
 *
 * Usage:
 *   npx ts-node --transpile-only scripts/check-routes.ts
 *   (or via npm run check:routes in services/api)
 */

import * as fs from "fs";
import * as path from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

const REPO_ROOT = path.resolve(__dirname, "..");

const MODULES_DIR = path.join(
  REPO_ROOT,
  "services",
  "api",
  "src",
  "modules"
);

const INDEX_FILE = path.join(
  REPO_ROOT,
  "services",
  "api",
  "src",
  "routes",
  "index.ts"
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Recursively walk a directory and yield files matching a predicate. */
function* walkFiles(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(fullPath);
    } else {
      yield fullPath;
    }
  }
}

/** Convert an absolute path to a POSIX-style relative path from REPO_ROOT. */
function toRelative(absPath: string): string {
  return absPath.replace(REPO_ROOT + path.sep, "").replace(/\\/g, "/");
}

/**
 * Derive the import substring that *should* appear in routes/index.ts
 * for a given route file.
 *
 * Example:
 *   services/api/src/modules/resume/routes/ResumeRoutes.ts
 *   →  "../modules/resume/routes/ResumeRoutes"
 *
 * We look for either the full relative path OR at least the bare filename
 * stem (e.g. "ResumeRoutes") to handle both path styles gracefully.
 */
function expectedImportSubstrings(routeFilePath: string): string[] {
  const relFromSrc = path
    .relative(path.join(REPO_ROOT, "services", "api", "src", "routes"), routeFilePath)
    .replace(/\\/g, "/")
    .replace(/\.ts$/, "");

  const stem = path.basename(routeFilePath, ".ts");

  return [relFromSrc, stem];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  if (!fs.existsSync(MODULES_DIR)) {
    console.error(`❌  Modules directory not found: ${MODULES_DIR}`);
    process.exit(1);
  }

  if (!fs.existsSync(INDEX_FILE)) {
    console.error(`❌  Routes index not found: ${INDEX_FILE}`);
    process.exit(1);
  }

  const indexContent = fs.readFileSync(INDEX_FILE, "utf-8");

  // Collect all *Routes.ts files anywhere under services/api/src/modules
  const routeFiles: string[] = [];
  for (const filePath of walkFiles(MODULES_DIR)) {
    if (/Routes\.ts$/.test(filePath)) {
      routeFiles.push(filePath);
    }
  }

  if (routeFiles.length === 0) {
    console.warn("⚠️  No *Routes.ts files found — is the modules directory empty?");
    process.exit(0);
  }

  const unmounted: string[] = [];

  for (const routeFile of routeFiles) {
    const candidates = expectedImportSubstrings(routeFile);
    const isMounted = candidates.some((substr) => indexContent.includes(substr));

    if (!isMounted) {
      unmounted.push(toRelative(routeFile));
    }
  }

  if (unmounted.length === 0) {
    const count = routeFiles.length;
    console.log(`✅  All ${count} route file${count === 1 ? "" : "s"} are mounted in routes/index.ts`);
    process.exit(0);
  }

  console.error(
    `\n❌  ${unmounted.length} route file${unmounted.length === 1 ? "" : "s"} found but NOT imported in routes/index.ts:\n`
  );
  for (const f of unmounted) {
    console.error(`   • ${f}`);
  }
  console.error(
    `\n   → Add the missing import${unmounted.length === 1 ? "" : "s"} to services/api/src/routes/index.ts\n`
  );
  process.exit(1);
}

main();
