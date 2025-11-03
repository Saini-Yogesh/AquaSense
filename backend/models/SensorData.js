import mongoose from "mongoose";

const sensorSchema = new mongoose.Schema({
    Run_ID: { type: Number, required: true },

    // Pressure
    P_0: { type: Number, required: true },
    P_100: { type: Number, required: true },
    P_200: { type: Number, required: true },
    P_300: { type: Number, required: true },
    P_400: { type: Number, required: true },
    P_500: { type: Number, required: true },
    P_600: { type: Number, required: true },
    P_700: { type: Number, required: true },
    P_800: { type: Number, required: true },
    P_900: { type: Number, required: true },
    P_1000: { type: Number, required: true },

    // Acoustic
    A_0: { type: Number, required: true },
    A_100: { type: Number, required: true },
    A_200: { type: Number, required: true },
    A_300: { type: Number, required: true },
    A_400: { type: Number, required: true },
    A_500: { type: Number, required: true },
    A_600: { type: Number, required: true },
    A_700: { type: Number, required: true },
    A_800: { type: Number, required: true },
    A_900: { type: Number, required: true },
    A_1000: { type: Number, required: true },

    LeakLabel: { type: String, required: true, enum: ["leak", "not leak"] }

}, { timestamps: true });

// ✅ Force use of collection "sensordatas"
export default mongoose.model("SensorData", sensorSchema, "sensordatas");
