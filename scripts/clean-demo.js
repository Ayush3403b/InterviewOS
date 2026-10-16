#!/usr/bin/env node
/**
 * scripts/clean-demo.js
 *
 * Removes all demo accounts and associated data (interviews, reports,
 * resumes, proctoring events) from MongoDB.
 *
 * Usage:
 *   node scripts/clean-demo.js
 *   npm run clean:demo
 */

const fs = require("fs");
const path = require("path");
let mongoose;
try {
  mongoose = require("mongoose");
} catch {
  mongoose = require(path.resolve(__dirname, "../services/api/node_modules/mongoose"));
}

// Load .env
const ENV_FILE = path.resolve(__dirname, "..", "services", "api", ".env");
let mongoUri = "mongodb://localhost:27017/interviewos";

if (fs.existsSync(ENV_FILE)) {
  const lines = fs.readFileSync(ENV_FILE, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key && key.trim() === "MONGO_URI") {
      const val = rest.join("=").trim().replace(/^["']|["']$/g, "");
      if (val) mongoUri = val;
    }
  }
}

async function runClean() {
  console.log(`\n=======================================================`);
  console.log(`🧹  InterviewOS Demo Data Cleaner`);
  console.log(`=======================================================`);
  console.log(`Connecting to MongoDB: ${mongoUri}...`);

  try {
    await mongoose.connect(mongoUri);
    console.log(`✅ Connected to MongoDB.\n`);

    const db = mongoose.connection.db;

    const usersCol = db.collection("users");
    const sessionsCol = db.collection("interviewsessions");
    const conversationsCol = db.collection("conversations");
    const evaluationsCol = db.collection("evaluations");
    const reportsCol = db.collection("reports");
    const resumesCol = db.collection("resumes");
    const proctoringSessionsCol = db.collection("proctoringsessions");
    const proctoringEventsCol = db.collection("proctoringevents");

    // Match all demo accounts
    const demoUsers = await usersCol.find({
      email: { $regex: /^demo\..*@interviewos\.local$/i }
    }).toArray();

    const demoUserIds = demoUsers.map((u) => u._id);

    if (demoUserIds.length === 0) {
      console.log(`ℹ️  No demo accounts found to remove.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`Found ${demoUserIds.length} demo user(s). Purging all associated data...`);

    // Find sessions owned by demo users
    const demoSessions = await sessionsCol.find({ userId: { $in: demoUserIds } }).toArray();
    const demoSessionIds = demoSessions.map((s) => s._id);

    // Delete related records
    const deletedConversations = await conversationsCol.deleteMany({ sessionId: { $in: demoSessionIds } });
    const deletedEvaluations = await evaluationsCol.deleteMany({ interviewSessionId: { $in: demoSessionIds } });
    const deletedReports = await reportsCol.deleteMany({ userId: { $in: demoUserIds } });
    const deletedResumes = await resumesCol.deleteMany({ userId: { $in: demoUserIds } });
    
    const demoProctoringSessions = await proctoringSessionsCol.find({ candidateId: { $in: demoUserIds } }).toArray();
    const demoProctoringIds = demoProctoringSessions.map((p) => p._id);
    const deletedProctoringEvents = await proctoringEventsCol.deleteMany({ proctoringSessionId: { $in: demoProctoringIds } });
    const deletedProctoringSessions = await proctoringSessionsCol.deleteMany({ candidateId: { $in: demoUserIds } });

    const deletedSessions = await sessionsCol.deleteMany({ userId: { $in: demoUserIds } });
    const deletedUsers = await usersCol.deleteMany({ _id: { $in: demoUserIds } });

    console.log(`\n✅ Successfully removed all demo data:`);
    console.log(`   • Users: ${deletedUsers.deletedCount}`);
    console.log(`   • Interview Sessions: ${deletedSessions.deletedCount}`);
    console.log(`   • Conversations: ${deletedConversations.deletedCount}`);
    console.log(`   • Evaluations: ${deletedEvaluations.deletedCount}`);
    console.log(`   • Reports: ${deletedReports.deletedCount}`);
    console.log(`   • Resumes: ${deletedResumes.deletedCount}`);
    console.log(`   • Proctoring Sessions: ${deletedProctoringSessions.deletedCount}`);
    console.log(`   • Proctoring Events: ${deletedProctoringEvents.deletedCount}`);

    console.log(`\n🎉 Database is clean and reset!\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error removing demo data:", error);
    process.exit(1);
  }
}

runClean();
