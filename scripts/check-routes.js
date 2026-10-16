#!/usr/bin/env node
/**
 * scripts/check-routes.js
 *
 * Asserts that every *Routes.ts file found under
 * services/api/src/modules is imported in services/api/src/routes/index.ts.
 *
 * Exit codes:
 *   0 — all route files are mounted
 *   1 — one or more route files are not imported in index.ts
 */

const fs = require("fs");
const path = require("path");

// ─── Config ──────────────────────────────────────────────────────────────────

const REPO_ROOT = path.resolve(__dirname, "..");

const MODULES_DIR = path.join(REPO_ROOT, "services", "api", "src", "modules");
const INDEX_FILE = path.join(REPO_ROOT, "services", "api", "src", "routes", "index.ts");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function* walkFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(fullPath);
    } else {
      yield fullPath;
    }
  }
}

function toRelative(absPath) {
  return absPath.replace(REPO_ROOT + path.sep, "").replace(/\\/g, "/");
}

/**
 * Returns candidate substrings that should appear in routes/index.ts for
 * this route file. We check:
 *   1. The relative path from routes/ to the file (minus .ts extension)
 *   2. The bare filename stem (e.g. "AuthRoutes")
 *   3. The module's top-level directory name (e.g. "auth" from modules/auth/...)
 *      — covers barrel re-exports like `import ... from "../modules/auth"`
 */
function expectedImportSubstrings(routeFilePath) {
  const routesDir = path.join(REPO_ROOT, "services", "api", "src", "routes");
  const relFromSrc = path
    .relative(routesDir, routeFilePath)
    .replace(/\\/g, "/")
    .replace(/\.ts$/, "");

  const stem = path.basename(routeFilePath, ".ts");

  // Extract the top-level module directory name, e.g.:
  //   .../modules/auth/routes/AuthRoutes.ts → "auth"
  const modulesDir = path.join(REPO_ROOT, "services", "api", "src", "modules");
  const relFromModules = path.relative(modulesDir, routeFilePath).replace(/\\/g, "/");
  const moduleDir = relFromModules.split("/")[0]; // "auth", "health", etc.

  return [relFromSrc, stem, moduleDir].filter(Boolean);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(MODULES_DIR)) {
    console.error("❌  Modules directory not found:", MODULES_DIR);
    process.exit(1);
  }

  if (!fs.existsSync(INDEX_FILE)) {
    console.error("❌  Routes index not found:", INDEX_FILE);
    process.exit(1);
  }

  const indexContent = fs.readFileSync(INDEX_FILE, "utf-8");

  const routeFiles = [];
  for (const filePath of walkFiles(MODULES_DIR)) {
    if (/Routes\.ts$/.test(filePath)) {
      routeFiles.push(filePath);
    }
  }

  if (routeFiles.length === 0) {
    console.warn("⚠️  No *Routes.ts files found — is the modules directory empty?");
    process.exit(0);
  }

  const unmounted = [];
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

  console.error(`\n❌  ${unmounted.length} route file${unmounted.length === 1 ? "" : "s"} found but NOT imported in routes/index.ts:\n`);
  for (const f of unmounted) {
    console.error(`   • ${f}`);
  }
  console.error(`\n   → Add the missing import${unmounted.length === 1 ? "" : "s"} to services/api/src/routes/index.ts\n`);
  process.exit(1);
}

main();
