import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";

// ─── Rate Limiters ────────────────────────────────────────────────────────────

/**
 * Strict limiter for auth endpoints (login / register).
 * 20 attempts per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many attempts from this IP, please try again after 15 minutes.",
    },
    skipSuccessfulRequests: true,
});

/**
 * General API limiter — 200 requests per 15 minutes per IP.
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please slow down." },
});

/**
 * AI limiter — 30 AI requests per 15 minutes per IP.
 */
export const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "AI request limit reached. Please wait 15 minutes before making more AI requests.",
    },
});

// ─── Input Sanitization ───────────────────────────────────────────────────────

/**
 * Strips MongoDB operator keys ($gt, $where, etc.) to prevent NoSQL injection.
 */
export const sanitizeInputs = mongoSanitize({
    replaceWith: "_",
    onSanitize: ({ req, key }) => {
        console.warn(`[SECURITY] Sanitized MongoDB operator in "${key}" from ${req.ip}`);
    },
});

/**
 * Prevents HTTP Parameter Pollution attacks.
 */
export const preventHPP = hpp();

// ─── Input Validation ─────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates auth request body.
 * Password rules match the frontend:
 *   - Register: minimum 6 characters (same as Register.jsx client-side check)
 *   - Login:    just presence check (no strength rules — user may have old password)
 */
export const validateAuthMiddleware = (isRegister = false) => (req, res, next) => {
    const { name, email, password } = req.body;

    // Email
    if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Email is required." });
    }
    if (!EMAIL_RE.test(email.trim())) {
        return res.status(400).json({ message: "Please provide a valid email address." });
    }

    // Password — presence only for both; length only on register
    if (!password || typeof password !== "string") {
        return res.status(400).json({ message: "Password is required." });
    }
    if (password.length > 128) {
        return res.status(400).json({ message: "Password must be 128 characters or fewer." });
    }
    if (isRegister && password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    // Name (register only)
    if (isRegister) {
        if (!name || typeof name !== "string" || name.trim().length < 2) {
            return res.status(400).json({ message: "Name is required and must be at least 2 characters." });
        }
        if (name.trim().length > 50) {
            return res.status(400).json({ message: "Name must be 50 characters or fewer." });
        }
    }

    next();
};
