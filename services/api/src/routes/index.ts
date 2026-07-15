import { Router } from "express";

import { healthRoutes } from "../modules/health";
import { userRoutes } from "../modules/users";
import { authRoutes } from "../modules/auth";

const router = Router();

router.use("/health", healthRoutes);

router.use("/users", userRoutes);

router.use("/auth", authRoutes);

export default router;