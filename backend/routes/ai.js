import express from "express";
import {
    weeklyReport,
    suggestHabits,
    recoveryPlan,
    chatAnalysis,
    morningMotivation,
} from "../controllers/aiController.js";
import { protect } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/security.js";

const router = express.Router();

// All AI routes require authentication + AI-specific rate limiter
router.use(protect);
router.use(aiLimiter);

router.post("/weekly-report",  weeklyReport);
router.post("/suggest-habits", suggestHabits);
router.post("/recovery-plan",  recoveryPlan);
router.post("/chat",           chatAnalysis);
router.get("/morning",         morningMotivation);

export default router;
