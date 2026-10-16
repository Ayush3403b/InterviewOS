import { Router } from "express";

import { healthRoutes } from "../modules/health";
import { userRoutes } from "../modules/users";
import { authRoutes } from "../modules/auth";
import { organizationRoutes } from "../modules/organization";
import { interviewSessionRoutes } from "../modules/interview-session";
import { conversationRoutes } from "../modules/conversation";
import { evaluationRoutes } from "../modules/evaluation";
import { proctoringRoutes } from "../modules/proctoring";
import aiUsageRoutes from "../modules/ai-usage/routes/AiUsageRoutes";
import interviewContextRoutes from "../modules/interview-context/routes/InterviewContextRoutes";
import orchestratorRoutes from "../modules/orchestrator/routes/OrchestratorRoutes";
import resumeRoutes from "../modules/resume/routes/ResumeRoutes";
import coachRoutes from "../modules/coach/routes/CoachRoutes";
import resumeWriterRoutes from "../modules/resume-writer/routes/ResumeWriterRoutes";
import reportRoutes from "../modules/report/routes/ReportRoutes";
import auditLogRoutes from "../modules/audit-log/routes/AuditLogRoutes";
import telemetryRoutes from "../modules/telemetry/routes/TelemetryRoutes";
import { codingRoutes } from "../modules/coding";
const router = Router();

router.use("/health", healthRoutes);

router.use("/users", userRoutes);

router.use("/auth", authRoutes);

router.use("/organizations", organizationRoutes);

router.use("/interview-sessions", interviewSessionRoutes);

router.use("/conversations",conversationRoutes);

router.use("/evaluations",evaluationRoutes);

router.use("/proctoring", proctoringRoutes);

router.use("/ai-usage", aiUsageRoutes);

router.use("/interview-context", interviewContextRoutes);

router.use("/orchestrator", orchestratorRoutes);

router.use("/resumes", resumeRoutes);

router.use("/coach", coachRoutes);

router.use("/resume-writer", resumeWriterRoutes);

router.use("/report", reportRoutes);

router.use("/audit-logs", auditLogRoutes);

router.use("/telemetry", telemetryRoutes);

router.use("/coding", codingRoutes);

export default router;
