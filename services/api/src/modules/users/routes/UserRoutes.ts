import { Router } from "express";

import UserController from "../controllers/UserController";

const router = Router();

router.get("/me", UserController.getProfile);

export default router;