import React, { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Line } from "react-chartjs-2";
import "./LeakDetailsPage.css";

export default function LeakDetailsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { runId } = useParams();
    const row = location.state?.row || {}; // fallback
    const distances = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

    // compute all intermediate values (hook always runs)
    const computed = useMemo(() => {
        if (!row || Object.keys(row).length === 0) {
            return null;
        }

        const pressure = distances.map(d => Number(row[`P_${d}`]));
        const acoustic = distances.map(d => Number(row[`A_${d}`]));

        // baseline drop = P100 - P0 (absolute)
        const baselineDrop = Math.abs(pressure[1] - pressure[0]);

        // max acoustic and index
        const maxA = Math.max(...acoustic);
        const maxIdx = acoustic.indexOf(maxA);
        const maxPos = distances[maxIdx];

        // local drop at sensor of maxA
        // guard: if maxIdx === 0 use next index
        const localDrop =
            maxIdx === 0 ? Math.abs(pressure[1] - pressure[0]) : Math.abs(pressure[maxIdx] - pressure[maxIdx - 1]);

        // leak rule
        const A_threshold = 0.2; // V
        const pressureFactor = 2; // localDrop > pressureFactor * baselineDrop
        const leakDetected = maxA > A_threshold && localDrop > pressureFactor * baselineDrop;

        // weighted centroid using only positive acoustic values (to reduce noise influence)
        const posIndices = acoustic.map((a, i) => (a > 0 ? i : null)).filter(i => i !== null);
        const numerator = posIndices.reduce((s, i) => s + distances[i] * acoustic[i], 0);
        const denominator = posIndices.reduce((s, i) => s + acoustic[i], 0);
        const leakLocation = denominator > 0 ? (numerator / denominator) : NaN;

        // step-by-step terms (for display): show each positive term for centroid
        const centroidTerms = posIndices.map(i => ({
            idx: i,
            pos: distances[i],
            amp: acoustic[i],
            term: distances[i] * acoustic[i]
        }));

        return {
            pressure,
            acoustic,
            baselineDrop,
            maxA,
            maxIdx,
            maxPos,
            localDrop,
            leakDetected,
            leakLocation,
            centroidTerms,
            thresholds: { A_threshold, pressureFactor }
        };
        // eslint-disable-next-line
    }, [row]);

    // if no data, show fallback
    if (!computed) {
        return (
            <div className="details-container">
                <button className="back-btn" onClick={() => navigate("/")}>← Back</button>
                <h3>No data provided for Run ID: {runId}</h3>
            </div>
        );
    }

    const {
        pressure, acoustic, baselineDrop, maxA, maxIdx, maxPos,
        localDrop, leakDetected, leakLocation, centroidTerms, thresholds
    } = computed;

    // summary data (top)
    const summary = {
        leakDetected,
        estimatedLocation: leakDetected ? `${Number(leakLocation).toFixed(1)} m` : "N/A",
        peakAcoustic: `${Number(maxA).toFixed(3)} V`,
        localPressureDrop: `${Number(localDrop).toFixed(1)} Pa`,
        baselineDrop: `${Number(baselineDrop).toFixed(1)} Pa`
    };

    // chart data (separate charts)
    const pressureChart = {
        labels: distances,
        datasets: [
            { label: "Pressure (bar)", data: pressure.map(p => p / 1e5), borderColor: "#1f77b4", backgroundColor: "rgba(31,119,180,0.08)", tension: 0.2, fill: true }
        ]
    };
    const acousticChart = {
        labels: distances,
        datasets: [
            {
                label: "Acoustic (V)", data: acoustic, borderColor: "#d62728", backgroundColor: "rgba(214,39,40,0.06)", tension: 0.2, fill: true,
                pointRadius: acoustic.map((v, i) => (i === maxIdx ? 6 : 3)),
                pointBackgroundColor: acoustic.map((v, i) => (i === maxIdx ? "#ff7f0e" : "#d62728"))
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { title: { display: true, text: "Distance (m)" } },
            y: { title: { display: true, text: "Value" } }
        },
        plugins: { legend: { display: true } }
    };

    // helper formatters
    const fmt = v => (Number.isFinite(v) ? Number(v).toFixed(3) : "N/A");
    const fmtInt = v => (Number.isFinite(v) ? Number(v).toFixed(1) : "N/A");

    return (
        <div className="details-container">
            <h2>Leak Calculation — Run ID: {runId}</h2>

            {/* ---------- Summary ---------- */}
            <div className="summary-grid">
                <div className="summary-card">
                    <div className="summary-label">Leak Status</div>
                    <div className={`summary-value ${leakDetected ? "leak-yes" : "leak-no"}`}>
                        {leakDetected ? "Leak Detected" : "No Leak"}
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-label">Estimated Location</div>
                    <div className="summary-value">{summary.estimatedLocation}</div>
                </div>

                <div className="summary-card">
                    <div className="summary-label">Peak Acoustic (A_max)</div>
                    <div className="summary-value">{summary.peakAcoustic}</div>
                </div>

                <div className="summary-card">
                    <div className="summary-label">Local ΔP</div>
                    <div className="summary-value">{summary.localPressureDrop}</div>
                </div>

                <div className="summary-card">
                    <div className="summary-label">Baseline ΔP</div>
                    <div className="summary-value">{summary.baselineDrop}</div>
                </div>
            </div>

            {/* ---------- Raw data table ---------- */}
            <h3>Sensor readings (raw)</h3>
            <div className="table-responsive">
                <table className="data-table-detailed">
                    <thead>
                        <tr>
                            <th>Sensor (m)</th>
                            <th>Pressure (Pa)</th>
                            <th>Acoustic (V)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {distances.map((d, i) => (
                            <tr key={d} className={i === maxIdx ? "highlight-row" : ""}>
                                <td>{d}</td>
                                <td>{fmtInt(pressure[i])}</td>
                                <td>{fmt(acoustic[i])}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ---------- Charts: individually ---------- */}
            <div className="charts-separate">
                <div className="chart-card">
                    <h4>Pressure vs Distance</h4>
                    <div className="chart-area">
                        <Line data={pressureChart} options={{ ...chartOptions, borderWidth: 1.5, scales: { x: chartOptions.scales.x, y: { title: { display: true, text: "Pressure (bar)" } } } }} />
                    </div>
                </div>

                <div className="chart-card">
                    <h4>Acoustic vs Distance</h4>
                    <div className="chart-area">
                        <Line data={acousticChart} options={{ ...chartOptions, borderWidth: 1.5, scales: { x: chartOptions.scales.x, y: { title: { display: true, text: "Acoustic (V)" } } } }} />
                    </div>
                </div>
            </div>

            {/* ---------- Step-by-step calculations ---------- */}
            <h3>Step-by-step calculation</h3>

            {/* 1. Baseline ΔP */}
            <div className="calc-block">
                <div className="calc-title">1) Baseline pressure drop per 100 m segment</div>
                <div className="calc-formula">ΔP<sub>baseline</sub> = |P₁₀₀ − P₀|</div>
                <div className="calc-sub">
                    Given: P₀ = {fmtInt(pressure[0])} Pa, P₁₀₀ = {fmtInt(pressure[1])} Pa
                </div>
                <div className="calc-eval">
                    ΔP<sub>baseline</sub> = |{fmtInt(pressure[1])} − {fmtInt(pressure[0])}| = <strong>{fmtInt(baselineDrop)} Pa</strong>
                </div>
            </div>

            {/* 2. Find A_max and where */}
            <div className="calc-block">
                <div className="calc-title">2) Peak acoustic amplitude</div>
                <div className="calc-formula">A<sub>max</sub> = max(A<sub>i</sub>)</div>
                <div className="calc-sub">Computed values: A<sub>max</sub> = {fmt(maxA)} V at sensor {maxPos} m (index {maxIdx})</div>
            </div>

            {/* 3. Local ΔP at A_max */}
            <div className="calc-block">
                <div className="calc-title">3) Local pressure drop at the peak acoustic sensor</div>
                <div className="calc-formula">ΔP<sub>local</sub> = |P<sub>i</sub> − P<sub>i-1</sub>|</div>
                <div className="calc-sub">Using i = {maxIdx} ({maxPos} m): P<sub>i</sub> = {fmtInt(pressure[maxIdx])} Pa, P<sub>i-1</sub> = {fmtInt(pressure[maxIdx - 1])} Pa</div>
                <div className="calc-eval">ΔP<sub>local</sub> = |{fmtInt(pressure[maxIdx])} − {fmtInt(pressure[maxIdx - 1])}| = <strong>{fmtInt(localDrop)} Pa</strong></div>
            </div>

            {/* 4. Leak detection rule */}
            <div className="calc-block">
                <div className="calc-title">4) Leak decision rule</div>
                <div className="calc-formula">Leak if A<sub>max</sub> &gt; {thresholdsDisplay(thresholds.A_threshold)} V AND ΔP<sub>local</sub> &gt; {thresholdsDisplay(thresholds.pressureFactor)} × ΔP<sub>baseline</sub></div>
                <div className="calc-sub">Evaluate: A<sub>max</sub> = {fmt(maxA)} V → {maxA > thresholds.A_threshold ? "✔" : "✖"}</div>
                <div className="calc-sub">ΔP<sub>local</sub> = {fmtInt(localDrop)} Pa ; {thresholds.pressureFactor} × ΔP<sub>baseline</sub> = {fmtInt(thresholds.pressureFactor * baselineDrop)} Pa → {localDrop > thresholds.pressureFactor * baselineDrop ? "✔" : "✖"}</div>
                <div className="calc-eval">Decision: <strong>{leakDetected ? "LEAK DETECTED" : "NO LEAK"}</strong></div>
            </div>

            {/* 5. Localization: weighted centroid */}
            <div className="calc-block">
                <div className="calc-title">5) Localization — amplitude-weighted centroid</div>
                <div className="calc-formula">x<sub>est</sub> = Σ(x<sub>i</sub> · A<sub>i</sub>) / Σ(A<sub>i</sub>)  (only A<sub>i</sub> &gt; 0 used)</div>

                <div className="calc-sub">Terms used (pos amplitudes):</div>
                <div className="centroid-table">
                    <table>
                        <thead><tr><th>Sensor (m)</th><th>A<sub>i</sub> (V)</th><th>x<sub>i</sub>·A<sub>i</sub></th></tr></thead>
                        <tbody>
                            {centroidTerms.map(t => (
                                <tr key={t.idx}>
                                    <td>{t.pos}</td>
                                    <td>{fmt(t.amp)}</td>
                                    <td>{fmt(t.term)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr><td colSpan="2">Σ numerator</td><td>{fmt(centroidTerms.reduce((s, t) => s + t.term, 0))}</td></tr>
                            <tr><td colSpan="2">Σ denominator (ΣA)</td><td>{fmt(centroidTerms.reduce((s, t) => s + t.amp, 0))}</td></tr>
                        </tfoot>
                    </table>
                </div>

                <div className="calc-eval">
                    x<sub>est</sub> = {fmt(centroidTerms.reduce((s, t) => s + t.term, 0))} / {fmt(centroidTerms.reduce((s, t) => s + t.amp, 0))} = <strong>{Number(leakLocation).toFixed(1)} m</strong>
                </div>
            </div>

        </div>
    );
}

// small helper to nicely display threshold value (for JSX)
function thresholdsDisplay(val) {
    if (Number.isFinite(val)) return val;
    return String(val);
}
