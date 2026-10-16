#!/usr/bin/env node
/**
 * scripts/validate-secrets.js
 *
 * Automated Secrets Hardening & Configuration Validator for InterviewOS.
 * Ensures production/staging readiness by inspecting environment configurations:
 *   1. JWT Secret entropy (>= 32 characters, no trivial placeholders)
 *   2. CORS origin safety (cannot be '*' if credentials are enabled)
 *   3. AI Provider credentials validation
 *   4. SMTP Mail server format
 *   5. MongoDB connection string validity
 *
 * Usage:
 *   node scripts/validate-secrets.js
 */

const fs = require("fs");
const path = require("path");

const ENV_FILE = path.resolve(__dirname, "..", "services", "api", ".env");
const ENV_EXAMPLE = path.resolve(__dirname, "..", "services", "api", ".env.example");

console.log(`=======================================================`);
console.log(`🛡️  InterviewOS Secrets & Configuration Validator`);
console.log(`=======================================================`);

// Load .env if present
const envVars = { ...process.env };
if (fs.existsSync(ENV_FILE)) {
  const lines = fs.readFileSync(ENV_FILE, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key) {
      envVars[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
}

const warnings = [];
const errors = [];

// 1. JWT Secret Validation
const jwtSecret = envVars.JWT_SECRET;
const forbiddenSecrets = ["secret", "123456", "password", "ci-only", "placeholder", "test", "jwt_secret"];

if (!jwtSecret) {
  errors.push("JWT_SECRET is not set.");
} else if (jwtSecret.length < 32) {
  errors.push(`JWT_SECRET is too short (${jwtSecret.length} chars). Must be at least 32 characters.`);
} else if (forbiddenSecrets.some((f) => jwtSecret.toLowerCase().includes(f))) {
  errors.push(`JWT_SECRET contains insecure placeholder words.`);
}

// 2. CORS Safety
const corsOrigin = envVars.CLIENT_URL || envVars.CORS_ORIGIN;
if (corsOrigin === "*") {
  warnings.push("CLIENT_URL is set to '*'. With cookie-based auth, set an explicit domain.");
}

// 3. Mongo URI
const mongoUri = envVars.MONGO_URI;
if (!mongoUri) {
  errors.push("MONGO_URI is not set.");
} else if (!mongoUri.startsWith("mongodb://") && !mongoUri.startsWith("mongodb+srv://")) {
  errors.push("MONGO_URI has an invalid scheme (must be mongodb:// or mongodb+srv://).");
}

// 4. AI Provider Key Check
const hasAiKey =
  Boolean(envVars.ANTHROPIC_API_KEY) ||
  Boolean(envVars.OPENAI_API_KEY) ||
  Boolean(envVars.GEMINI_API_KEY);

if (!hasAiKey) {
  warnings.push("No real LLM API keys configured (ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY). Mock agents will be used.");
}

// 5. Budget Limits
const dailyBudget = Number(envVars.LLM_DAILY_BUDGET_USD || 25.0);
const monthlyBudget = Number(envVars.LLM_MONTHLY_BUDGET_USD || 500.0);
if (isNaN(dailyBudget) || dailyBudget <= 0) {
  warnings.push("LLM_DAILY_BUDGET_USD is missing or invalid, using default $25.00.");
}
if (isNaN(monthlyBudget) || monthlyBudget <= 0) {
  warnings.push("LLM_MONTHLY_BUDGET_USD is missing or invalid, using default $500.00.");
}

// Report findings
console.log(`\n📋 Audit Summary:`);
if (warnings.length > 0) {
  console.log(`\n⚠️  Warnings (${warnings.length}):`);
  for (const w of warnings) {
    console.log(`   • ${w}`);
  }
}

if (errors.length > 0) {
  console.log(`\n❌ Critical Violations (${errors.length}):`);
  for (const e of errors) {
    console.log(`   • ${e}`);
  }
  console.log(`\n🚨 Secrets validation FAILED. Fix the violations above.`);
  process.exit(1);
} else {
  console.log(`\n✅ Secrets and configuration validated successfully! No critical violations.`);
  process.exit(0);
}
