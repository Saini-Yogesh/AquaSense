import express from "express";
import SensorData from "../models/SensorData.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        let skip = parseInt(req.query.skip) || 0;
        let limit = parseInt(req.query.limit) || 20;

        if (limit > 100) limit = 20;

        const rows = await SensorData.find()
            .skip(skip)
            .limit(limit);

        const total = await SensorData.countDocuments();

        // ✅ MUST use rows.length, not limit
        const nextSkip = skip + rows.length;
        const hasMore = nextSkip < total;

        return res.json({
            success: true,
            data: rows,
            nextSkip,
            hasMore,
            total
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

export default router;
