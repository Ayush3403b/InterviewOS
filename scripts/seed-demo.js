#!/usr/bin/env node
/**
 * scripts/seed-demo.js
 *
 * Seeds comprehensive demo accounts & test data across all features of InterviewOS:
 *  - 3 Demo Roles: Student, Recruiter, Admin (Password: Demo1234!)
 *  - Sample Resume with extracted skills & ATS score
 *  - Completed & In-Progress Interview Sessions (Technical, Coding, Behavioral)
 *  - Evaluations & Detailed Final Reports with Share Tokens
 *  - Proctoring Sessions & Flagged Evidence Events (for Recruiter Review testing)
 *
 * Usage:
 *   node scripts/seed-demo.js
 *   npm run seed:demo
 */

const fs = require("fs");
const path = require("path");
let mongoose, bcrypt;
try {
  mongoose = require("mongoose");
} catch {
  mongoose = require(path.resolve(__dirname, "../services/api/node_modules/mongoose"));
}

try {
  bcrypt = require("bcryptjs");
} catch {
  bcrypt = require(path.resolve(__dirname, "../services/api/node_modules/bcryptjs"));
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

const DEMO_PASSWORD = "DemoPassword123!";

async function runSeed() {
  console.log(`\n=======================================================`);
  console.log(`🌱  InterviewOS Developer Demo Data Seeder`);
  console.log(`=======================================================`);
  console.log(`Connecting to MongoDB: ${mongoUri}...`);

  try {
    await mongoose.connect(mongoUri);
    console.log(`✅ Connected to MongoDB successfully.\n`);

    const db = mongoose.connection.db;

    // Collections
    const usersCol = db.collection("users");
    const sessionsCol = db.collection("interviewsessions");
    const conversationsCol = db.collection("conversations");
    const evaluationsCol = db.collection("evaluations");
    const reportsCol = db.collection("reports");
    const resumesCol = db.collection("resumes");
    const proctoringSessionsCol = db.collection("proctoringsessions");
    const proctoringEventsCol = db.collection("proctoringevents");

    // Clean up existing demo users first
    console.log(`🧹 Cleaning any existing demo accounts...`);
    const existingDemoUsers = await usersCol.find({
      email: { $in: [
        "demo.student@interviewos.local",
        "demo.recruiter@interviewos.local",
        "demo.admin@interviewos.local"
      ] }
    }).toArray();

    const existingUserIds = existingDemoUsers.map(u => u._id);
    if (existingUserIds.length > 0) {
      await usersCol.deleteMany({ _id: { $in: existingUserIds } });
      await sessionsCol.deleteMany({ userId: { $in: existingUserIds } });
      await reportsCol.deleteMany({ userId: { $in: existingUserIds } });
      await resumesCol.deleteMany({ userId: { $in: existingUserIds } });
      await proctoringSessionsCol.deleteMany({ candidateId: { $in: existingUserIds } });
      console.log(`   Cleaned up ${existingUserIds.length} previous demo accounts.`);
    }

    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
    const now = new Date();

    // 1. Create Demo Users
    console.log(`👤 Creating verified Demo Accounts...`);
    const studentId = new mongoose.Types.ObjectId();
    const recruiterId = new mongoose.Types.ObjectId();
    const adminId = new mongoose.Types.ObjectId();

    await usersCol.insertMany([
      {
        _id: studentId,
        firstName: "Alex",
        lastName: "Candidate",
        email: "demo.student@interviewos.local",
        password: hashedPassword,
        role: "student",
        status: "active",
        isEmailVerified: true,
        profileCompleted: true,
        emailVerifiedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: recruiterId,
        firstName: "Rachel",
        lastName: "Recruiter",
        email: "demo.recruiter@interviewos.local",
        password: hashedPassword,
        role: "recruiter",
        status: "active",
        isEmailVerified: true,
        profileCompleted: true,
        emailVerifiedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: adminId,
        firstName: "Dave",
        lastName: "Admin",
        email: "demo.admin@interviewos.local",
        password: hashedPassword,
        role: "admin",
        status: "active",
        isEmailVerified: true,
        profileCompleted: true,
        emailVerifiedAt: now,
        createdAt: now,
        updatedAt: now,
      }
    ]);

    // 2. Create Sample Resume for Student
    console.log(`📄 Creating sample resume & extracted skills...`);
    await resumesCol.insertOne({
      userId: studentId,
      fileName: "Alex_Candidate_Senior_Software_Engineer_Resume.pdf",
      mimeType: "application/pdf",
      rawText: "Alex Candidate - Senior Full-Stack Engineer with 5+ years experience in Node.js, TypeScript, React, Distributed Systems, MongoDB, and System Architecture.",
      status: "PARSED",
      summary: "Experienced Full-Stack Software Engineer specializing in backend distributed architectures, TypeScript microservices, and React design systems.",
      extractedSkills: [
        "TypeScript", "Node.js", "Express", "React", "MongoDB",
        "PostgreSQL", "Docker", "System Design", "REST APIs", "GraphQL", "Vitest"
      ],
      atsScore: 92,
      suggestions: [
        "Highlight quantify metrics for system performance improvements.",
        "Add certifications related to cloud architecture (AWS/GCP)."
      ],
      experience: [
        {
          title: "Senior Backend Engineer",
          company: "TechNova Corp",
          duration: "2022 - Present",
          highlights: [
            "Architected high-throughput microservices handling 25k req/sec.",
            "Reduced p99 API latency by 45% via Redis caching layer."
          ]
        },
        {
          title: "Full Stack Engineer",
          company: "CloudScale Inc",
          duration: "2020 - 2022",
          highlights: [
            "Built responsive React dashboards and real-time Socket.IO collaboration tools.",
            "Implemented JWT authentication and RBAC authorization."
          ]
        }
      ],
      createdAt: now,
      updatedAt: now
    });

    // 3. Create Sample Interview Sessions
    console.log(`🎯 Creating sample interview sessions, reports, & proctoring data...`);

    // Session 1: Completed Backend Technical Interview (High Score)
    const session1Id = new mongoose.Types.ObjectId();
    const eval1Id = new mongoose.Types.ObjectId();
    const proctor1Id = new mongoose.Types.ObjectId();

    await sessionsCol.insertOne({
      _id: session1Id,
      userId: studentId,
      title: "Senior Backend Architecture Round",
      type: "TECHNICAL",
      level: "ADVANCED",
      status: "COMPLETED",
      duration: 1800,
      turnCount: 5,
      maxQuestions: 5,
      score: 88,
      feedback: "Strong grasp of distributed systems, concurrency control, and database indexing.",
      startedAt: new Date(Date.now() - 3600 * 1000 * 2),
      completedAt: new Date(Date.now() - 3600 * 1000),
      createdAt: new Date(Date.now() - 3600 * 1000 * 2),
      updatedAt: new Date(Date.now() - 3600 * 1000)
    });

    // Conversations for Session 1
    await conversationsCol.insertMany([
      {
        sessionId: session1Id,
        turnNumber: 1,
        role: "INTERVIEWER",
        status: "COMPLETED",
        question: "How would you design an idempotent payment processing API to prevent double charges?",
        answer: "I would generate a unique client-supplied idempotency key and store transaction state with distributed locking (Redis/Redlock) and database unique constraints.",
        timeTaken: 45,
        createdAt: now,
        updatedAt: now
      },
      {
        sessionId: session1Id,
        turnNumber: 2,
        role: "INTERVIEWER",
        status: "COMPLETED",
        question: "Explain the difference between optimistic and pessimistic locking in MongoDB.",
        answer: "Optimistic locking checks document version numbers before committing updates, while pessimistic locking explicitly blocks concurrent access using transaction locks.",
        timeTaken: 50,
        createdAt: now,
        updatedAt: now
      }
    ]);

    // Evaluation for Session 1
    await evaluationsCol.insertOne({
      _id: eval1Id,
      interviewSessionId: session1Id,
      status: "COMPLETED",
      overallScore: 88,
      skillScores: {
        technical: 90,
        communication: 85,
        problemSolving: 92,
        confidence: 85,
        leadership: 80,
        criticalThinking: 88
      },
      strengths: [
        "In-depth knowledge of distributed system reliability",
        "Clear and structured answers with practical examples",
        "Excellent architectural trade-off analysis"
      ],
      weaknesses: [
        "Could elaborate more on observability & OpenTelemetry metrics"
      ],
      hiringRecommendation: "STRONG_HIRE",
      overallSummary: "Alex performed exceptionally well across all technical and system design questions.",
      createdAt: now,
      updatedAt: now
    });

    // Report for Session 1 (With Public Share Token)
    await reportsCol.insertOne({
      interviewSessionId: session1Id,
      userId: studentId,
      evaluationId: eval1Id,
      candidateName: "Alex Candidate",
      interviewTitle: "Senior Backend Architecture Round",
      interviewType: "TECHNICAL",
      interviewLevel: "ADVANCED",
      overallScore: 88,
      skillScores: {
        technical: 90,
        communication: 85,
        problemSolving: 92,
        confidence: 85,
        leadership: 80,
        criticalThinking: 88
      },
      strengths: [
        "In-depth knowledge of distributed system reliability",
        "Clear and structured answers with practical examples",
        "Excellent architectural trade-off analysis"
      ],
      weaknesses: [
        "Could elaborate more on observability & OpenTelemetry metrics"
      ],
      hiringRecommendation: "STRONG_HIRE",
      overallSummary: "Alex performed exceptionally well across all technical and system design questions.",
      executiveSummary: "Top tier candidate demonstrating strong senior-level technical depth and architectural clarity.",
      candidateFeedback: "Great job on the distributed locking explanation. Keep practicing real-time observability patterns.",
      recruiterBrief: "Candidate is ready for team matching. Exceeded the bar on technical and problem-solving benchmarks.",
      shareToken: "demo-share-token-backend-88",
      isPublic: true,
      createdAt: now,
      updatedAt: now
    });

    // Session 2: Flagged Session for Proctoring Review (For Recruiter testing)
    const session2Id = new mongoose.Types.ObjectId();
    const eval2Id = new mongoose.Types.ObjectId();

    await sessionsCol.insertOne({
      _id: session2Id,
      userId: studentId,
      title: "Live Coding & Algorithm Screening",
      type: "CODING",
      level: "INTERMEDIATE",
      status: "COMPLETED",
      duration: 2100,
      turnCount: 4,
      maxQuestions: 4,
      score: 74,
      feedback: "Candidate solved the algorithm challenge, but multiple proctoring anomalies were recorded.",
      startedAt: new Date(Date.now() - 3600 * 1000 * 5),
      completedAt: new Date(Date.now() - 3600 * 1000 * 4),
      createdAt: new Date(Date.now() - 3600 * 1000 * 5),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 4)
    });

    // Proctoring Session for Session 2 (FLAGGED with high risk score)
    await proctoringSessionsCol.insertOne({
      _id: proctor1Id,
      interviewSessionId: session2Id,
      candidateId: studentId,
      status: "FLAGGED",
      trustScore: 48,
      riskScore: 76,
      totalSignals: 32,
      violationCounts: {
        LOOKING_AWAY: 5,
        TAB_SWITCH: 3,
        MULTIPLE_FACES: 2
      },
      flagReason: "Multiple tab switches and non-candidate voice detected during coding session.",
      reviewedBy: null,
      createdAt: new Date(Date.now() - 3600 * 1000 * 5),
      updatedAt: new Date(Date.now() - 3600 * 1000 * 4)
    });

    // Proctoring Events
    await proctoringEventsCol.insertMany([
      {
        proctoringSessionId: proctor1Id,
        eventType: "TAB_SWITCH",
        severity: "HIGH",
        timestamp: new Date(Date.now() - 3600 * 1000 * 4.8),
        metadata: { windowTitle: "StackOverflow - Mongo Indexes" },
        createdAt: now
      },
      {
        proctoringSessionId: proctor1Id,
        eventType: "MULTIPLE_FACES",
        severity: "CRITICAL",
        timestamp: new Date(Date.now() - 3600 * 1000 * 4.5),
        metadata: { facesDetected: 2 },
        createdAt: now
      }
    ]);

    // Session 3: IN_PROGRESS Interactive Session
    const session3Id = new mongoose.Types.ObjectId();
    await sessionsCol.insertOne({
      _id: session3Id,
      userId: studentId,
      title: "Frontend Engineering & React Internals",
      type: "TECHNICAL",
      level: "INTERMEDIATE",
      status: "IN_PROGRESS",
      duration: 300,
      turnCount: 1,
      maxQuestions: 5,
      score: 0,
      feedback: "",
      startedAt: now,
      createdAt: now,
      updatedAt: now
    });

    console.log(`\n=======================================================`);
    console.log(`✨  DEMO DATA SUCCESSFULLY SEEDED!`);
    console.log(`=======================================================`);
    console.log(`\n🔑 Ready-to-use Demo Accounts (Password: ${DEMO_PASSWORD}) :\n`);
    console.log(`  1. 🎓 Student Demo    : demo.student@interviewos.local`);
    console.log(`     • Dashboard, Live Interviews, Reports, Resume Writer, Analytics`);
    console.log(`  2. 💼 Recruiter Demo  : demo.recruiter@interviewos.local`);
    console.log(`     • Proctoring Flagged Sessions review, Candidate assessments`);
    console.log(`  3. 👑 Admin Demo      : demo.admin@interviewos.local`);
    console.log(`     • Full platform & organization controls`);
    console.log(`\n🔗 Public Report Share Preview:`);
    console.log(`  http://localhost:5173/report/share/demo-share-token-backend-88`);
    console.log(`\n🧹 To remove all demo data anytime, run:`);
    console.log(`  npm run clean:demo  (or node scripts/clean-demo.js)\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    process.exit(1);
  }
}

runSeed();
