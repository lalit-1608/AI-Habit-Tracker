import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * signToken — creates a signed HS256 JWT.
 */
const signToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, {
        algorithm: "HS256",
        expiresIn: process.env.JWT_EXPIRES_IN || "30d",
    });

const sendToken = (res, statusCode, user) => {
    const token = signToken(user._id);
    res.status(statusCode).json({ user, token });
};

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email and password are required" });
        }

        const exists = await User.findOne({ email: email.toLowerCase().trim() });
        if (exists) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            avatar: name.trim().charAt(0).toUpperCase(),
        });

        sendToken(res, 201, user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        sendToken(res, 200, user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Get current user ─────────────────────────────────────────────────────────
export const me = async (req, res) => {
    res.json({ user: req.user });
};

// ─── Update profile ───────────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
    try {
        const { name, morningMotivation } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (name !== undefined) {
            if (typeof name !== "string" || name.trim().length < 2) {
                return res.status(400).json({ message: "Name must be at least 2 characters" });
            }
            user.name = name.trim().slice(0, 50);
            user.avatar = user.name.charAt(0).toUpperCase();
        }

        if (morningMotivation !== undefined) {
            user.morningMotivation = morningMotivation;
        }

        await user.save();
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
