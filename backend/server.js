import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import habitRoutes from "./routes/habits.js";
import logRoutes from "./routes/logs.js";
import aiRoutes from "./routes/ai.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { sanitizeInputs, preventHPP, apiLimiter } from "./middleware/security.js";

const app = express();

// ─── Trust proxy (required for rate limiting behind Render/Railway/etc.) ──────
app.set("trust proxy", 1);

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Set CLIENT_URL in your host's environment variables.
// Accepts comma-separated list: https://myapp.vercel.app,https://myapp.com
const allowedOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const corsOptions = {
    origin(origin, cb) {
        // Allow server-to-server / curl with no Origin header
        if (!origin) return cb(null, true);
        // Always allow localhost in development
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return cb(null, true);
        }
        // Allow origins listed in CLIENT_URL env var
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(sanitizeInputs);
app.use(preventHPP);
app.use("/api", apiLimiter);

// ─── Health check ─────────────────────────────────────────────────────────────
// Used by Render/Railway uptime checks — must return 200 quickly
app.get("/api/health", (req, res) =>
    res.json({ status: "ok", time: new Date().toISOString() })
);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",   authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/logs",   logRoutes);
app.use("/api/ai",     aiRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
// PORT is set automatically by Render, Railway, Fly.io, etc.
const PORT = process.env.PORT || 8000;

connectDB().then(() => {
    app.listen(PORT, "0.0.0.0", () =>
        console.log(`Server running on port ${PORT}`)
    );
});
