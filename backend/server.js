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

const upload = multer({ dest: "uploads/" });

// ==================================================================
// 🧩 TRAIN MODEL ENDPOINT
// ==================================================================
app.post("/api/train", upload.single("file"), (req, res) => {
    const uploadedFile = req.file?.path;
    const scriptPath = path.join(
        process.cwd(),
        "../ai_leak_detection/src/train_model.py"
    );

    console.log("🚀 Training model using:", uploadedFile || "default dataset");

    // Pass uploaded file path if provided
    const args = uploadedFile ? [scriptPath, uploadedFile] : [scriptPath];
    const py = spawn("python", args);

    let output = "";
    py.stdout.on("data", (data) => {
        const text = data.toString();
        console.log("PYTHON:", text);
        output += text;
    });

    py.stderr.on("data", (data) => console.error("Python Error:", data.toString()));

    py.on("close", () => {
        try {
            // 🧠 Extract the last line of Python output (should be valid JSON)
            const lines = output.trim().split("\n");
            const lastLine = lines[lines.length - 1];
            const result = JSON.parse(lastLine);

            res.json({
                status: "ok",
                accuracy: result.accuracy,
                mae: result.mae,
                message: "Training complete",
            });
        } catch (err) {
            console.error("❌ JSON Parse Error (train):", err);
            console.error("Raw Output:", output);
            res.status(500).json({
                status: "error",
                message: "Training failed — invalid Python output",
            });
        }

        // ✅ Fixed cleanup variable name
        if (uploadedFile && fs.existsSync(uploadedFile)) fs.unlinkSync(uploadedFile);
    });
});

// ==================================================================
// 🧩 PREDICT FROM CSV ENDPOINT
// ==================================================================
app.post("/api/predict-csv", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const dataPath = path.resolve(req.file.path);
    const scriptPath = path.join(
        process.cwd(),
        "../ai_leak_detection/src/predict_csv.py"
    );

    console.log("🔍 Running CSV prediction for:", dataPath);

    const py = spawn("python", [scriptPath, dataPath]);

    let output = "";
    py.stdout.on("data", (data) => (output += data.toString()));
    py.stderr.on("data", (data) =>
        console.error("Python Error:", data.toString())
    );

    py.on("close", () => {
        try {
            // 🧠 Extract the last valid JSON line (ignore any log text)
            const lines = output.trim().split("\n");
            const lastLine = lines[lines.length - 1].trim();

            const result = JSON.parse(lastLine);
            res.json(result);
        } catch (err) {
            console.error("❌ JSON Parse Error (predict-csv):", err);
            console.error("Raw Output:", output);
            res.status(500).json({ error: "CSV Prediction failed" });
        }

        // Clean up uploaded file
        if (fs.existsSync(dataPath)) fs.unlinkSync(dataPath);
    });
});

// ==================================================================
// ✅ Start Server
// ==================================================================
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
