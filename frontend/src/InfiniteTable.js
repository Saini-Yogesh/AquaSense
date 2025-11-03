import { useState, useEffect, useRef, useCallback } from "react";
import "./InfiniteTable.css";
import { Line } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function InfiniteTable() {
    const [data, setData] = useState([]);
    const [skip, setSkip] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);

    const loaderRef = useRef(null);
    const didInit = useRef(false); // ✅ Stop double fetch in StrictMode

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        setError(null);

        try {
            const API_URL = process.env.REACT_APP_API_URL;
            const res = await fetch(`${API_URL}/api/sensor-data?skip=${skip}&limit=20`);
            const json = await res.json();

            console.log("API RESULT =>", {
                skipSent: skip,
                rowsReturned: json.data?.length,
                nextSkipFromBackend: json.nextSkip,
                hasMoreFromBackend: json.hasMore
            });

            if (!json.success) throw new Error(json.message);

            // ✅ No more data
            if (json.data.length === 0) {
                setHasMore(false);
                return;
            }

            // ✅ Prevent re-loading same page
            if (json.nextSkip === skip) {
                setHasMore(false);
                return;
            }

            // ✅ Append data
            setData(prev => [...prev, ...json.data]);
            setSkip(json.nextSkip);
            setHasMore(json.hasMore);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore, skip]);

    // ✅ Load only once on mount (not on re-render)
    useEffect(() => {
        if (!didInit.current) {
            didInit.current = true;
            loadMore();
        }
    }, []);

    // ✅ Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && !loading && hasMore) {
                loadMore();
            }
        });

        const current = loaderRef.current;
        if (current) observer.observe(current);
        return () => current && observer.unobserve(current);
    }, [loadMore, loading, hasMore]);

    const distances = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    const pressureData = selectedRow ? distances.map(d => selectedRow[`P_${d}`]) : [];
    const acousticData = selectedRow ? distances.map(d => selectedRow[`A_${d}`]) : [];

    return (
        <>
            <h2>Pipeline Sensor Data</h2>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Run</th>
                            <th>P_0</th>
                            <th>A_0</th>
                            <th>Leak</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i} onClick={() => setSelectedRow(row)}>
                                <td>{row.Run_ID}</td>
                                <td>{row.P_0}</td>
                                <td>{row.A_0}</td>
                                <td>{row.LeakLabel}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div ref={loaderRef} className="loader">
                    {loading && hasMore && "Loading..."}
                    {!hasMore && "✅ No more records"}
                    {error && <div style={{ color: "red" }}>⚠ {error}</div>}
                </div>
            </div>

            {/* ✅ Details modal */}
            {selectedRow && (
                <div className="modal-overlay" onClick={() => setSelectedRow(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <span className="close-btn" onClick={() => setSelectedRow(null)}>×</span>

                        <h3>Run ID: {selectedRow.Run_ID}</h3>

                        <div className="charts-row">

                            {/* Pressure Chart */}
                            <div className="chart-box">
                                <h4>Distance vs Pressure</h4>
                                <Line
                                    data={{
                                        labels: distances,
                                        datasets: [{ label: "Pressure (bar)", data: pressureData, borderColor: "blue", borderWidth: 1.5 }]
                                    }}
                                />
                            </div>

                            {/* Acoustic Chart */}
                            <div className="chart-box">
                                <h4>Distance vs Acoustic</h4>
                                <Line
                                    data={{
                                        labels: distances,
                                        datasets: [{ label: "Acoustic amplitude", data: acousticData, borderColor: "red", borderWidth: 1.5 }]
                                    }}
                                />
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </>
    );
}
