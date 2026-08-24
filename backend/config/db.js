import mongoose from "mongoose";

export const isDbConnected = () => mongoose.connection.readyState === 1;

export const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.warn("MongoDB is not configured. Skipping DB connection for local/test startup.");
            return false;
        }

        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 10000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (err) {
        console.warn("MongoDB connection error:", err.message);
        return false;
    }
};