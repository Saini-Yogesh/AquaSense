import express from "express";
import SensorData from "../models/SensorData.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        let skip = parseInt(req.query.skip);
        let limit = parseInt(req.query.limit);

        // Validate query inputs
        if (isNaN(skip) || skip < 0) skip = 0;
        if (isNaN(limit) || limit <= 0 || limit > 100) limit = 20; // max safety cap 100

        // Fetch paginated data
        const rows = await SensorData.find().skip(skip).limit(limit);

        if (!rows || rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No sensor data found",
                data: []
            });
        }

        // Count total docs for front-end infinite scroll logic
        const total = await SensorData.countDocuments();

        res.status(200).json({
            success: true,
            totalRecords: total,
            returnedRecords: rows.length,
            nextSkip: skip + limit,
            data: rows
        });

    } catch (err) {
        console.error("❌ Error fetching sensor data:", err.message);

        // Database connection error handling
        if (err.name === "MongoNetworkError") {
            return res.status(503).json({
                success: false,
                message: "Database connection lost",
                error: err.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error fetching sensor data",
            error: err.message
        });
    }
});

export default router;
