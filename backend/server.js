import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { connectDB, isDbConnected, getLastDbError } from "./config/db.js";
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
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean);

const corsOptions = {
    origin(origin, cb) {
        // Allow server-to-server / curl / mobile with no Origin header
        if (!origin) return cb(null, true);

        const cleanOrigin = origin.replace(/\/+$/, "");

        // Always allow localhost in development
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) {
            return cb(null, true);
        }

        // Allow all if CLIENT_URL is empty or wildcard '*'
        if (allowedOrigins.length === 0 || allowedOrigins.includes("*")) {
            return cb(null, true);
        }

        // Allow origins listed in CLIENT_URL env var
        if (allowedOrigins.includes(cleanOrigin)) {
            return cb(null, true);
        }

        return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(sanitizeInputs);
app.use(preventHPP);
app.use("/api", apiLimiter);

// ─── Health check ─────────────────────────────────────────────────────────────
// Used by cloud platforms (Render, Railway, Fly.io, etc.) uptime checks
app.get("/", (req, res) =>
    res.json({
        status: isDbConnected() ? "ok" : "degraded",
        service: "ai-habit-tracker-backend",
        database: isDbConnected() ? "connected" : "disconnected",
        time: new Date().toISOString()
    })
);
app.get("/health", (req, res) =>
    res.json({
        status: isDbConnected() ? "ok" : "degraded",
        database: {
            connected: isDbConnected(),
            configured: !!process.env.MONGO_URI,
            error: isDbConnected() ? null : (process.env.MONGO_URI ? getLastDbError() : "MONGO_URI is not set in environment variables"),
        },
        time: new Date().toISOString()
    })
);
app.get("/api/health", (req, res) =>
    res.json({
        status: isDbConnected() ? "ok" : "degraded",
        database: {
            connected: isDbConnected(),
            configured: !!process.env.MONGO_URI,
            error: isDbConnected() ? null : (process.env.MONGO_URI ? getLastDbError() : "MONGO_URI is not set in environment variables"),
        },
        time: new Date().toISOString()
    })
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

const startServer = async () => {
    const dbReady = await connectDB();
    if (!dbReady) {
        console.warn("Application started without MongoDB. API routes that require the database will return errors until MONGO_URI is configured.");
    }

    app.listen(PORT, "0.0.0.0", () =>
        console.log(`Server running on port ${PORT}`)
    );
};

startServer();
