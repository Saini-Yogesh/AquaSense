import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import sensorRoutes from "./routes/sensorRoutes.js";

dotenv.config(); // ✅ Load .env file

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Read from .env
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

// ✅ MongoDB connect using env
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ DB Error: ", err));

// ✅ Test route
app.get("/", (req, res) => {
    res.send({ status: "Server Running ✅" });
});

// ✅ API route
app.use("/api/sensor-data", sensorRoutes);

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
