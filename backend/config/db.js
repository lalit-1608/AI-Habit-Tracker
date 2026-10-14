import mongoose from "mongoose";

let lastDbError = null;

export const isDbConnected = () => mongoose.connection.readyState === 1;
export const getLastDbError = () => lastDbError;

export const connectDB = async (retryCount = 0) => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            lastDbError = "MONGO_URI is not set in environment variables";
            console.warn("MongoDB is not configured. Skipping DB connection for local/test startup.");
            return false;
        }

        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 10000,
        });
        lastDbError = null;
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (err) {
        lastDbError = err.message;
        console.warn("MongoDB connection error:", err.message);
        if (retryCount < 10) {
            const nextRetry = retryCount + 1;
            const delay = Math.min(1000 * Math.pow(2, nextRetry), 15000);
            console.log(`Retrying MongoDB connection in ${delay / 1000}s (attempt ${nextRetry}/10)...`);
            setTimeout(() => connectDB(nextRetry), delay);
        }
        return false;
    }
};

mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected. Mongoose will attempt to reconnect.");
});

mongoose.connection.on("reconnected", () => {
    lastDbError = null;
    console.log("MongoDB reconnected successfully.");
});