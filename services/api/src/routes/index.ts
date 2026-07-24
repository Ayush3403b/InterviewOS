import { Router } from "express";

import { healthRoutes } from "../modules/health";
import { userRoutes } from "../modules/users";
import { authRoutes } from "../modules/auth";
import { organizationRoutes } from "../modules/organization";
import { interviewSessionRoutes } from "../modules/interview-session";
import { conversationRoutes } from "../modules/conversation";
import { evaluationRoutes } from "../modules/evaluation";
const router = Router();

router.use("/health", healthRoutes);

router.use("/users", userRoutes);

router.use("/auth", authRoutes);

router.use("/organizations", organizationRoutes);

router.use("/interview-sessions", interviewSessionRoutes);

router.use("/conversations",conversationRoutes);

router.use("/evaluations",evaluationRoutes);

export default router;