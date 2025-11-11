import React, { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Line } from "react-chartjs-2";
import "./LeakDetailsPage.css";
import LeakVisualizationPopup from "./LeakVisualizationPopup";

export default function LeakDetailsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { runId } = useParams();
    const row = location.state?.row || {};
    const distances = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    const [showPopup, setShowPopup] = React.useState(false);

    const toDb = (v) => 20 * Math.log10(Math.max(v, 1e-9));
    const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

    // simple Nelder-Mead optimizer
    function nelderMead(costFn, x0, opts = {}) {
        const n = x0.length;
        const step = opts.step || 1;
        const maxIter = opts.maxIter || 300;
        const tol = opts.tol || 1e-6;
        const lb = opts.lb || Array(n).fill(-Infinity);
        const ub = opts.ub || Array(n).fill(Infinity);
        const proj = (x) => x.map((xi, i) => clamp(xi, lb[i], ub[i]));

        const simplex = [proj(x0.slice())];
        for (let i = 0; i < n; i++) {
            const v = x0.slice();
            v[i] += step;
            simplex.push(proj(v));
        }

        const fvals = simplex.map((s) => costFn(s));
        for (let iter = 0; iter < maxIter; iter++) {
            const idx = fvals.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v).map((o) => o.i);
            const s = idx.map((i) => simplex[i]);
            const f = idx.map((i) => fvals[i]);

            const mean = f.reduce((a, b) => a + b, 0) / f.length;
            const spread = Math.sqrt(f.reduce((a, v) => a + (v - mean) ** 2, 0) / f.length);
            if (spread < tol) return { x: s[0], f: f[0] };

            const xr = Array(n).fill(0);
            for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) xr[j] += s[k][j];
            for (let j = 0; j < n; j++) xr[j] /= n;

            const alpha = 1, gamma = 2, rho = 0.5;
            const reflect = proj(xr.map((v, i) => v + alpha * (v - s[n][i])));
            const f_refl = costFn(reflect);

            if (f_refl < f[0]) {
                const expand = proj(xr.map((v, i) => v + gamma * (reflect[i] - xr[i])));
                const f_exp = costFn(expand);
                simplex[idx[n]] = f_exp < f_refl ? expand : reflect;
                fvals[idx[n]] = Math.min(f_exp, f_refl);
            } else if (f_refl < f[n - 1]) {
                simplex[idx[n]] = reflect;
                fvals[idx[n]] = f_refl;
            } else {
                const contract = proj(xr.map((v, i) => v + rho * (s[n][i] - xr[i])));
                const f_contr = costFn(contract);
                if (f_contr < f[n]) {
                    simplex[idx[n]] = contract;
                    fvals[idx[n]] = f_contr;
                } else {
                    for (let k = 1; k < n + 1; k++) {
                        simplex[idx[k]] = proj(s[0].map((v, i) => v + 0.5 * (s[k][i] - v)));
                        fvals[idx[k]] = costFn(simplex[idx[k]]);
                    }
                }
            }
        }
        const best = fvals.indexOf(Math.min(...fvals));
        return { x: simplex[best], f: fvals[best] };
    }

    const computed = useMemo(() => {
        if (!row || Object.keys(row).length === 0) return null;

        const pressure = distances.map((d) => Number(row[`P_${d}`]) || 0);
        const acoustic = distances.map((d) => Number(row[`A_${d}`]) || 0);

        // Step 1: pressure drop detection
        const drops = [];
        for (let i = 0; i < pressure.length - 1; i++) {
            drops.push(Math.abs(pressure[i + 1] - pressure[i]));
        }
        const sorted = [...drops].sort((a, b) => a - b);
        const baseline = sorted[Math.floor(sorted.length / 2)];
        let leakIdx = -1;
        for (let i = 0; i < drops.length; i++) {
            if (drops[i] > 2 * baseline) {
                leakIdx = i;
                break;
            }
        }

        if (leakIdx === -1) {
            return {
                pressure,
                acoustic,
                drops,
                baseline,
                leakDetected: false
            };
        }

        // Step 2: use nearby sensors for amplitude fitting
        const startIdx = Math.max(0, leakIdx - 1);
        const endIdx = Math.min(distances.length - 1, leakIdx + 2);
        const x_pos = distances.slice(startIdx, endIdx + 1);
        const A_meas = acoustic.slice(startIdx, endIdx + 1).map((a) => Math.max(a, 1e-6));

        const alpha_bounds = [0.001, 1];
        const A0_bounds = [0.01, 5];
        const x_lb = x_pos[0];
        const x_ub = x_pos[x_pos.length - 1];

        const costFn = (p) => {
            const x = p[0], A0 = p[1], alpha = p[2];
            const A_model = x_pos.map((xi) => A0 * Math.pow(10, -((alpha * Math.abs(x - xi)) / 20)));
            const r = A_meas.map((a, i) => toDb(a) - toDb(A_model[i]));
            return r.reduce((s, v) => s + v * v, 0);
        };

        const centroidGuess =
            x_pos.reduce((s, xi, i) => s + xi * A_meas[i], 0) /
            A_meas.reduce((s, a) => s + a, 0);

        const p0 = [centroidGuess, Math.max(...A_meas), 0.1];
        const lb = [x_lb, A0_bounds[0], alpha_bounds[0]];
        const ub = [x_ub, A0_bounds[1], alpha_bounds[1]];
        const result = nelderMead(costFn, p0, { lb, ub, step: 10 });

        const x_fit = clamp(result.x[0], x_lb, x_ub);
        const actual = row["Leak_Location"] ? Number(row["Leak_Location"]) : null;
        const diff = actual ? Math.abs(x_fit - actual) : null;

        return {
            pressure,
            acoustic,
            drops,
            baseline,
            leakDetected: true,
            leakIdx,
            estimatedLocation: x_fit,
            actualLocation: actual,
            diff
        };
        // eslint-disable-next-line
    }, [row]);

    if (!computed) {
        return (
            <div className="details-container">
                <button className="back-btn" onClick={() => navigate("/")}>← Back</button>
                <h3>No data provided for Run ID: {runId}</h3>
            </div>
        );
    }

    const {
        pressure,
        acoustic,
        drops,
        baseline,
        leakDetected,
        leakIdx,
        estimatedLocation,
        actualLocation,
        diff
    } = computed;

    const fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : "N/A");

    const pressureChart = {
        labels: distances,
        datasets: [
            {
                label: "Pressure (bar)",
                data: pressure.map((p) => p / 1e5),
                borderColor: "#1f77b4",
                backgroundColor: "rgba(31,119,180,0.08)",
                tension: 0.2,
                fill: true
            }
        ]
    };

    const acousticChart = {
        labels: distances,
        datasets: [
            {
                label: "Acoustic (V)",
                data: acoustic,
                borderColor: "#d62728",
                backgroundColor: "rgba(214,39,40,0.06)",
                tension: 0.2,
                fill: true
            }
        ]
    };

    const chartOptions1 = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { title: { display: true, text: "Sensor Position (m)" } },
            y: { title: { display: true, text: "Pressure(Pa)" } }
        }, elements: {
            line: {
                borderWidth: 1.5
            },
            point: {
                radius: 3,
            }
        },
        plugins: {
            legend: { display: true }
        }
    };

    const chartOptions2 = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { title: { display: true, text: "Sensor Position (m)" } },
            y: { title: { display: true, text: "Acoustic(V)" } }
        }, elements: {
            line: {
                borderWidth: 1.5
            },
            point: {
                radius: 3,
            }
        },
        plugins: {
            legend: { display: true }
        }
    };

    return (
        <div className="details-container">
            <h2>Leak Detection — Run ID: {runId}</h2>

            {/* ---------- SUMMARY ---------- */}
            <div className="summary-grid">
                <div className="summary-card">
                    <div className="summary-label">Leak Status</div>
                    <div className={`summary-value ${leakDetected ? "leak-yes" : "leak-no"}`}>
                        {leakDetected ? "Leak Detected" : "No Leak"}
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-label">Estimated Leak Location</div>
                    <div className="summary-value">
                        {leakDetected ? `${fmt(estimatedLocation, 1)} m` : "N/A"}
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-label">Actual Leak Location</div>
                    <div className="summary-value">
                        {actualLocation ? `${fmt(actualLocation, 1)} m` : "N/A"}
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-label">Error (|Δx|)</div>
                    <div className="summary-value">
                        {leakDetected && diff !== null ? `${fmt(diff, 1)} m` : "N/A"}
                    </div>
                </div>

                <button
                    onClick={() => leakDetected && setShowPopup(true)}
                    className="visualize-btn"
                    disabled={!leakDetected}
                    style={{
                        opacity: leakDetected ? 1 : 0.5,
                        cursor: leakDetected ? "pointer" : "not-allowed"
                    }}
                >
                    View Leak Visualization
                </button>
            </div>

            {/* ---------- TABLE ---------- */}
            <h3>Sensor Readings</h3>
            <div className="table-responsive">
                <table className="data-table-detailed">
                    <thead>
                        <tr><th>Sensor Position (m)</th><th>Fluid Pressure  (Pa)</th><th>Acoustics of fluid pipe system (V)</th></tr>
                    </thead>
                    <tbody>
                        {distances.map((d, i) => (
                            <tr key={d}>
                                <td>{d}</td>
                                <td>{fmt(pressure[i], 1)}</td>
                                <td>{fmt(acoustic[i], 3)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ---------- CHARTS ---------- */}
            <div className="charts-separate">
                <div className="chart-card">
                    <h4>Pressure vs Distance</h4>
                    <div className="chart-area" style={{ height: 240 }}>
                        <Line data={pressureChart} options={chartOptions1} />
                    </div>
                </div>
                <div className="chart-card">
                    <h4>Acoustic vs Distance</h4>
                    <div className="chart-area" style={{ height: 240 }}>
                        <Line data={acousticChart} options={chartOptions2} />
                    </div>
                </div>
            </div>

            {/* ---------- STEP-BY-STEP ---------- */}
            <h3>Step-by-step Calculation</h3>

            <div className="calc-block">
                <div className="calc-title">1) Pressure Drop Analysis</div>
                <div className="calc-formula">
                    ΔPᵢ = |Pᵢ₊₁ − Pᵢ| <br />
                    where ΔPᵢ = pressure drop between two consecutive sensors,<br />
                    Pᵢ = pressure at sensor i (Pa).
                </div>
                <div className="calc-sub">ΔP values (Pa): [{drops.map((v) => fmt(v, 1)).join(", ")}]</div>
                <div className="calc-eval">
                    → Baseline ΔP = {fmt(baseline, 1)}Pa
                    <br />
                    → Leak if ΔPᵢ &gt; 2×baseline = {fmt(2 * baseline, 1)} Pa
                </div>
                {leakDetected ? (
                    <div className="calc-eval">
                        Leak region detected between {distances[leakIdx]} m and {distances[leakIdx + 1]} m
                    </div>
                ) : (
                    <div className="calc-eval"><strong>No Leak Detected</strong></div>
                )}
            </div>

            {leakDetected && (
                <div className="calc-detailed">
                    <h3>🧮 Detailed Calculation Breakdown</h3>

                    {/* Step 1: Raw Pressures */}
                    <div className="calc-step">
                        <div className="calc-title">Step 1 — Raw Pressure Data</div>
                        <div className="calc-formula">
                            ΔPᵢ = |Pᵢ₊₁ − Pᵢ| <br />
                            where ΔPᵢ = pressure drop between two consecutive sensors,<br />
                            Pᵢ = pressure at sensor i (Pa).
                        </div>
                        <div className="calc-sub">
                            {pressure.map((p, i) => (
                                i < pressure.length - 1 && (
                                    <div key={i}>
                                        ΔP<sub>{i + 1}</sub> = |{fmt(pressure[i + 1])} − {fmt(pressure[i])}| = <strong>{fmt(Math.abs(pressure[i + 1] - pressure[i]))} Pa</strong>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Baseline and Threshold */}
                    <div className="calc-step">
                        <div className="calc-title">Step 2 — Baseline & Threshold</div>
                        <div className="calc-formula">
                            ΔP<sub>baseline</sub> = median(ΔPᵢ) = <strong>{fmt(baseline)} Pa</strong>
                        </div>
                        <div className="calc-sub">
                            Threshold = 2 × ΔP<sub>baseline</sub> = <strong>{fmt(2 * baseline)} Pa</strong>
                        </div>
                    </div>

                    {/* Step 3: Leak Detection */}
                    <div className="calc-step">
                        <div className="calc-title">Step 3 — Leak Detection</div>
                        <div className="calc-formula">
                            ΔPᵢ &gt; 2 × ΔP<sub>baseline</sub> → Leak
                        </div>
                        <div className="calc-sub">
                            Leak found between <strong>{distances[leakIdx]} m</strong> and <strong>{distances[leakIdx + 1]} m</strong>.
                        </div>
                        <div className="calc-eval">
                            Leak region pressure drop = <strong>{fmt(Math.abs(pressure[leakIdx + 1] - pressure[leakIdx]))} Pa</strong>
                        </div>
                    </div>

                    {/* Step 4: Acoustic Fit */}
                    <div className="calc-step">
                        <div className="calc-title">Step 4 — Acoustic Fit in Leak Region</div>
                        <div className="calc-formula">
                            A(xᵢ) = A₀ × 10<sup>−(α|x − xᵢ|)/20</sup><br />
                            where:<br />
                            • A(xᵢ): Acoustic amplitude at sensor i (V)<br />
                            • A₀: Amplitude at the leak source (V)<br />
                            • α: Attenuation factor (dB/m)<br />
                            • |x − xᵢ|: Distance between leak and sensor (m)
                        </div>
                        <div className="calc-sub">
                            Acoustic readings used: [
                            {acoustic.slice(Math.max(0, leakIdx - 1), leakIdx + 3).map(a => fmt(a, 3)).join(", ")}] V
                        </div>
                        <div className="calc-eval">
                            Estimated x<sub>fit</sub> = <strong>{fmt(estimatedLocation, 1)} m</strong> <br />
                            Actual x<sub>leak</sub> = <strong>{fmt(actualLocation, 1)} m</strong> <br />
                            Difference = <strong>{fmt(diff, 1)} m</strong>
                        </div>
                    </div>
                </div>
            )}

            {showPopup && (
                <LeakVisualizationPopup
                    onClose={() => setShowPopup(false)}
                    data={{
                        Run_ID: runId,
                        actual_location: actualLocation,
                        location_pred: estimatedLocation,
                        delta_x: diff
                    }}
                />
            )}

        </div>
    );
}
