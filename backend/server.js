import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import sensorRoutes from "./routes/sensorRoutes.js";
import { spawn } from "child_process";
import multer from "multer";
import path from "path";
import fs from "fs";

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

// ✅ Existing API routes
app.use("/api/sensor-data", sensorRoutes);

//
// ==================================================================
// 🧠 ML MODEL ROUTES
// ==================================================================
//

// 📂 File upload setup (for CSV dataset)
const upload = multer({ dest: "uploads/" });

// 🧩 Train model endpoint
app.post("/api/train", upload.single("file"), (req, res) => {
    const dataPath = req.file ? req.file.path : "ai_leak_detection/data/leak_data.csv";

    const py = spawn("python", ["../ai_leak_detection/src/train_model.py", dataPath]);


    let output = "";
    py.stdout.on("data", (data) => (output += data.toString()));
    py.stderr.on("data", (data) => console.error("Python Error:", data.toString()));

    py.on("close", () => {
        try {
            const result = JSON.parse(output);
            res.json(result);
        } catch (err) {
            console.error("Parse Error:", err);
            res.status(500).json({ status: "error", message: "Training failed" });
        }

        // Remove uploaded file (optional)
        if (req.file) fs.unlinkSync(req.file.path);
    });
});

// 🔍 Predict endpoint
app.post("/api/predict", (req, res) => {
    const py = spawn("python", ["../ai_leak_detection/src/predict.py"]);

    let output = "";
    py.stdin.write(JSON.stringify(req.body));
    py.stdin.end();

    py.stdout.on("data", (data) => (output += data.toString()));
    py.stderr.on("data", (data) => console.error("Python Error:", data.toString()));

    py.on("close", () => {
        try {
            res.json(JSON.parse(output));
        } catch {
            res.status(500).json({ status: "error", message: "Prediction failed" });
        }
    });
});

// 🧩 Predict from CSV
app.post("/api/predict-csv", upload.single("file"), (req, res) => {
    const dataPath = req.file.path;
    const py = spawn("python", ["../ai_leak_detection/src/predict_csv.py", dataPath]);

    let output = "";
    py.stdout.on("data", (data) => (output += data.toString()));
    py.stderr.on("data", (data) => console.error("Python Error:", data.toString()));

    py.on("close", () => {
        try {
            const result = JSON.parse(output);
            res.json(result);
        } catch {
            res.status(500).json({ status: "error", message: "CSV Prediction failed" });
        }
        if (req.file) fs.unlinkSync(req.file.path);
    });
});


// ==================================================================
// ✅ Start Server
// ==================================================================
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
