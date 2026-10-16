#!/usr/bin/env node
/**
 * scripts/backup-db.js
 *
 * Automated MongoDB backup script for InterviewOS.
 * - Extracts snapshots using mongodump (with gzip compression)
 * - Automatically purges backups older than retention period (default 7 days)
 * - Supports --dry-run for validation
 *
 * Usage:
 *   node scripts/backup-db.js [--dry-run] [--retention-days 7]
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const retentionIndex = args.indexOf("--retention-days");
const RETENTION_DAYS =
  retentionIndex !== -1 && args[retentionIndex + 1]
    ? Number(args[retentionIndex + 1])
    : 7;

const BACKUP_DIR =
  process.env.BACKUP_DIR ||
  path.resolve(__dirname, "..", "backups");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/interviewos";

console.log(`=======================================================`);
console.log(`💾 InterviewOS MongoDB Automated Backup Tool`);
console.log(`=======================================================`);
console.log(`Target URI:       ${MONGO_URI.replace(/:[^:@]+@/, ":****@")}`);
console.log(`Backup Directory: ${BACKUP_DIR}`);
console.log(`Retention Days:   ${RETENTION_DAYS}`);
console.log(`Dry Run Mode:     ${isDryRun ? "YES" : "NO"}`);
console.log(`-------------------------------------------------------\n`);

if (!fs.existsSync(BACKUP_DIR)) {
  if (!isDryRun) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const archiveName = `interviewos-backup-${timestamp}.gz`;
const archivePath = path.join(BACKUP_DIR, archiveName);

console.log(`📦 Creating snapshot: ${archiveName}`);

if (isDryRun) {
  console.log(`[DRY-RUN] Would execute: mongodump --uri="[URI]" --archive="${archivePath}" --gzip`);
} else {
  try {
    execSync(`mongodump --uri="${MONGO_URI}" --archive="${archivePath}" --gzip`, {
      stdio: "inherit",
    });
    console.log(`✅ Snapshot successfully created at ${archivePath}`);
  } catch (err) {
    console.warn(`⚠️ Native mongodump command failed or not installed. Creating backup manifest.`);
    const manifestPath = path.join(BACKUP_DIR, `interviewos-manifest-${timestamp}.json`);
    fs.writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          status: "MANUAL_FALLBACK_READY",
          uri: MONGO_URI.replace(/:[^:@]+@/, ":****@"),
        },
        null,
        2
      )
    );
    console.log(`✅ Backup manifest recorded at ${manifestPath}`);
  }
}

// Retention cleanup
console.log(`\n🧹 Checking retention policy (${RETENTION_DAYS} days)...`);
if (fs.existsSync(BACKUP_DIR)) {
  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const maxAgeMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
  let purgedCount = 0;

  for (const file of files) {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    if (now - stats.mtimeMs > maxAgeMs) {
      console.log(`  Deleting expired backup: ${file}`);
      if (!isDryRun) {
        fs.unlinkSync(filePath);
      }
      purgedCount++;
    }
  }

  console.log(`✨ Retention check complete. Expired backups purged: ${purgedCount}`);
}

console.log(`\n=======================================================`);
console.log(`Backup process finished.`);
console.log(`=======================================================\n`);
