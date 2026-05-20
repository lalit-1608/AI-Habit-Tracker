import express from "express";
import {
    register,
    login,
    me,
    updateProfile,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import {
    authLimiter,
    validateAuthMiddleware,
} from "../middleware/security.js";

const router = express.Router();

// Public routes — rate-limited + validated
router.post("/register", authLimiter, validateAuthMiddleware(true), register);
router.post("/login",    authLimiter, validateAuthMiddleware(false), login);

// Protected routes
router.get("/me",      protect, me);
router.put("/profile", protect, updateProfile);

export default router;
