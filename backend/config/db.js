import mongoose from "mongoose";

export const isDbConnected = () => mongoose.connection.readyState === 1;

export const connectDB = async (retryCount = 0) => {
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
        if (retryCount < 5) {
            const nextRetry = retryCount + 1;
            const delay = Math.min(1000 * Math.pow(2, nextRetry), 10000);
            console.log(`Retrying MongoDB connection in ${delay / 1000}s (attempt ${nextRetry}/5)...`);
            setTimeout(() => connectDB(nextRetry), delay);
        }
        return false;
    }
};

mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected. Mongoose will attempt to reconnect.");
});

mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected successfully.");
});