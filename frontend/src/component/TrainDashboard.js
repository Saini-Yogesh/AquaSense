import { useState } from "react";
import "./TrainDashboard.css";

export default function TrainDashboard() {
    const [accuracy, setAccuracy] = useState(null);
    const [loading, setLoading] = useState(false);
    const [predicting, setPredicting] = useState(false);
    const [csvResults, setCsvResults] = useState(null);
    const [summary, setSummary] = useState(null);
    const [showManual, setShowManual] = useState(false);
    const [result, setResult] = useState(null);

    // ---------------- TRAIN MODEL ----------------
    const handleTrain = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAccuracy(null);
        const file = e.target.file.files[0];
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("http://localhost:5000/api/train", {
                method: "POST",
                body: formData,
            });
            const json = await res.json();
            setAccuracy(json.accuracy);
        } catch (err) {
            alert("❌ Training failed. Check console for details.");
            console.error(err);
        }
        setLoading(false);
    };

    // ---------------- CSV PREDICT ----------------
    const handleCsvPredict = async (e) => {
        e.preventDefault();
        setCsvResults(null);
        setSummary(null);
        setPredicting(true);
        const file = e.target.file.files[0];
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("http://localhost:5000/api/predict-csv", {
                method: "POST",
                body: formData,
            });
            const json = await res.json();
            setCsvResults(json.results);
            setSummary(json.summary);
        } catch (err) {
            alert("❌ CSV Prediction failed. Check console for details.");
            console.error(err);
        }
        setPredicting(false);
    };

    // ---------------- SINGLE PREDICT ----------------
    const handlePredict = async (e) => {
        e.preventDefault();
        setPredicting(true);
        setResult(null);
        const formData = new FormData(e.target);
        const inputValues = {};
        for (let [key, value] of formData.entries()) {
            inputValues[key] = parseFloat(value);
        }

        try {
            const res = await fetch("http://localhost:5000/api/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(inputValues),
            });
            const json = await res.json();
            setResult(json);
        } catch (err) {
            alert("❌ Prediction failed. Check console for details.");
            console.error(err);
        }
        setPredicting(false);
    };

    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">🚰 AI Leak Detection Dashboard</h1>

            {/* TRAINING PANEL */}
            <div className="card">
                <h2>📊 Train Model</h2>
                <form onSubmit={handleTrain} className="train-form">
                    <input type="file" name="file" accept=".csv" required />
                    <button type="submit" disabled={loading}>
                        {loading ? "Training..." : "Train Model"}
                    </button>
                </form>
                {loading && <div className="loader"></div>}
                {accuracy && (
                    <div className="result success">
                        ✅ Model trained successfully — Accuracy:{" "}
                        <strong>{(accuracy * 100).toFixed(2)}%</strong>
                    </div>
                )}
            </div>

            {/* CSV PREDICTION */}
            <div className="card">
                <h2>📄 Test CSV File for Leaks</h2>

                <div className="csv-sample">
                    <h4>📘 Sample CSV Format (Excel View)</h4>
                    <div className="excel-preview">
                        <table>
                            <thead>
                                <tr>
                                    <th>Run_ID</th>
                                    <th>P_0</th>
                                    <th>...</th>
                                    <th>P_1000</th>
                                    <th>A_0</th>
                                    <th>...</th>
                                    <th>A_1000</th>
                                    {/* <th>LeakLabel (optional)</th> */}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Run_1</td>
                                    <td>500000.0</td>
                                    <td>...</td>
                                    <td>404685.5</td>
                                    <td>0.036</td>
                                    <td>...</td>
                                    <td>-0.003</td>
                                    {/* <td>leak</td> */}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <form onSubmit={handleCsvPredict}>
                    <input type="file" name="file" accept=".csv" required />
                    <button type="submit" disabled={predicting} style={{ "marginTop": "10px" }}>
                        {predicting ? "Analyzing..." : "Check CSV for Leaks"}
                    </button>
                </form>

                {predicting && <div className="loader"></div>}

                {summary && (
                    <div className="summary-box">
                        <h3>📈 Summary</h3>
                        <p>Total Runs: {summary.total}</p>
                        <p>Leaks: <span className="danger-text">{summary.leak}</span></p>
                        <p>No Leaks: <span className="success-text">{summary.no_leak}</span></p>
                    </div>
                )}

                {csvResults && (
                    <div className="csv-results">
                        <h3>🧾 Leak Analysis Results (showing up to 10)</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Run ID</th>
                                    <th>Status</th>
                                    <th>Location (m)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {csvResults.slice(0, 10).map((r, i) => (
                                    <tr key={i}>
                                        <td>{r.Run_ID}</td>
                                        <td className={r.status === "leak" ? "danger-text" : "success-text"}>
                                            {r.status === "leak" ? "Leak Detected" : "No Leak"}
                                        </td>
                                        <td>{r.location ? r.location.toFixed(1) : "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {csvResults.length > 10 && (
                            <p className="note">⚠️ Only showing first 10 records for performance</p>
                        )}
                    </div>
                )}
            </div>

            {/* MANUAL ENTRY */}
            <div className="card manual-entry">
                <button
                    className="toggle-btn"
                    onClick={() => setShowManual(!showManual)}
                >
                    {showManual ? "Hide Manual Entry" : "➕ Enter Data Manually"}
                </button>

                {showManual && (
                    <form onSubmit={handlePredict} className="predict-form">
                        <p className="note">Enter pressure & acoustic readings below</p>
                        <div className="grid-inputs">
                            {Array.from({ length: 11 }).map((_, i) => (
                                <div key={i} className="input-box">
                                    <label>{i * 100} m</label>
                                    <input
                                        type="number"
                                        name={`P_${i * 100}`}
                                        step="any"
                                        placeholder="Pressure (Pa)"
                                        required
                                    />
                                    <input
                                        type="number"
                                        name={`A_${i * 100}`}
                                        step="any"
                                        placeholder="Acoustic (V)"
                                        required
                                    />
                                </div>
                            ))}
                        </div>
                        <button type="submit" disabled={predicting}>
                            {predicting ? "Predicting..." : "Predict Leak"}
                        </button>
                    </form>
                )}

                {result && (
                    <div
                        className={`result ${result.status === "leak" ? "danger" : "success"
                            }`}
                    >
                        {result.status === "leak"
                            ? `🚨 Leak Detected at ${result.location.toFixed(1)} m`
                            : "✅ No Leak Detected"}
                    </div>
                )}
            </div>
        </div>
    );
}
