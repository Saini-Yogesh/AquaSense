import { useState } from "react";
import "./TrainDashboard.css";

export default function TrainDashboard() {
    const [accuracy, setAccuracy] = useState(null);
    const [loading, setLoading] = useState(false);
    const [predicting, setPredicting] = useState(false);
    const [csvResults, setCsvResults] = useState(null);
    const [summary, setSummary] = useState(null);
    const [visibleCount, setVisibleCount] = useState(15);

    const API_URL = process.env.REACT_APP_API_URL;

    // ---------------- TRAIN MODEL ----------------
    const handleTrain = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAccuracy(null);
        setSummary(null);

        const file = e.target.file.files[0];
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${API_URL}/api/train`, {
                method: "POST",
                body: formData,
            });
            const json = await res.json();
            console.log("Train result:", json);

            if (json.status === "ok") {
                setAccuracy(json.accuracy);
                setSummary({ mae: json.mae });
            } else {
                alert("❌ Training failed: " + (json.message || "Unknown error"));
            }
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
            const res = await fetch(`${API_URL}/api/predict-csv`, {
                method: "POST",
                body: formData,
            });
            const json = await res.json();
            console.log("Test result:", json);

            setCsvResults(json.results);
            setSummary(json.summary);
        } catch (err) {
            alert("❌ CSV Prediction failed. Check console for details.");
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
                        ✅ Model trained successfully! <br />
                        <strong>Accuracy:</strong> {(accuracy * 100).toFixed(2)}% <br />
                        {summary?.mae && (
                            <>
                                <strong>Leak Location MAE(Mean Absolute Error):</strong> {summary.mae.toFixed(2)} m
                            </>
                        )}
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
                                    <th>LeakLabel</th>
                                    <th>Leak_Location</th>
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
                                    <td>leak</td>
                                    <td>163</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <form onSubmit={handleCsvPredict}>
                    <input type="file" name="file" accept=".csv" required />
                    <button type="submit" disabled={predicting} style={{ "marginTop": "10px", width: "100%" }}>
                        {predicting ? "Analyzing..." : "Check CSV for Leaks"}
                    </button>
                </form>

                {predicting && <div className="loader"></div>}

                {summary && (
                    <div className="summary-box">
                        <h3>📈 Test Summary</h3>
                        <p>Total Runs: {summary.total}</p>
                        <p>
                            Leaks: <span className="danger-text">{summary.leak}</span>
                        </p>
                        <p>
                            No Leaks: <span className="success-text">{summary.no_leak}</span>
                        </p>
                        {summary.avg_delta_x !== null && summary.avg_delta_x !== undefined && (
                            <p>
                                Average ΔX (Leak Location Error):{" "}
                                <strong>{summary.avg_delta_x.toFixed(2)} m</strong>
                            </p>
                        )}
                    </div>
                )}

                {csvResults && (
                    <div className="csv-results">
                        <h3>🧾 Leak Analysis Results</h3>

                        <table>
                            <thead>
                                <tr>
                                    <th>Run ID</th>
                                    <th>Status</th>
                                    <th>Predicted Location (m)</th>
                                    <th>Actual Location (m)</th>
                                    <th>ΔX (m)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {csvResults.slice(0, visibleCount).map((r, i) => (
                                    <tr key={i}>
                                        <td>{r.Run_ID}</td>
                                        <td className={r.status === "leak" ? "danger-text" : "success-text"}>
                                            {r.status === "leak" ? "Leak Detected" : "No Leak"}
                                        </td>
                                        <td>{r.location_pred ? r.location_pred.toFixed(2) : "-"}</td>
                                        <td>{r.actual_location ? r.actual_location.toFixed(2) : "-"}</td>
                                        <td>
                                            {r.delta_x !== null && r.delta_x !== undefined
                                                ? r.delta_x.toFixed(2)
                                                : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Load More / Show Less Controls */}
                        <div className="load-controls">
                            {visibleCount < csvResults.length && (
                                <button
                                    onClick={() => setVisibleCount((prev) => prev + 15)}
                                    className="load-more-btn"
                                >
                                    Load More ({csvResults.length - visibleCount} remaining)
                                </button>
                            )}

                            {visibleCount > 15 && (
                                <button
                                    onClick={() => {
                                        setVisibleCount(15);
                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                    className="show-less-btn"
                                >
                                    Show Less
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
