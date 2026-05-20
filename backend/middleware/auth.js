import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * protect — verifies the Bearer JWT and attaches req.user.
 *
 * Security hardening:
 *  - Explicit algorithm allowlist (prevents alg-switching attacks)
 *  - Re-fetches user from DB (catches deleted/deactivated accounts)
 *  - Generic 401 messages to avoid information leakage
 *  - Distinguishes expired tokens for better client UX
 */
export const protect = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        // Whitelist HS256 to prevent algorithm-confusion attacks
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ["HS256"],
        });

        if (!decoded || !decoded.id) {
            return res.status(401).json({ message: "Not authorized, token invalid" });
        }

        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({ message: "Not authorized, token invalid" });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res
                .status(401)
                .json({ message: "Session expired, please log in again" });
        }
        return res.status(401).json({ message: "Not authorized, token invalid" });
    }
};

/**
 * authorize — role-based access control middleware factory.
 * Ready to use once a `role` field is added to the User schema.
 * Usage: router.delete("/admin-only", protect, authorize("admin"), handler)
 */
export const authorize = (...roles) =>
    (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Not authorized" });
        }
        if (!roles.includes(req.user.role ?? "user")) {
            return res
                .status(403)
                .json({ message: "You do not have permission to perform this action" });
        }
        next();
    };
