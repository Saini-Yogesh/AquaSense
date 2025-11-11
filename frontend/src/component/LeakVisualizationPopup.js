import React, { useEffect, useRef } from "react";
import { Scatter } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import "./LeakVisualizationPopup.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function LeakVisualizationPopup({ onClose, data }) {
    const popupRef = useRef();

    // Close popup when pressing ESC
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    // Close when clicking outside popup box
    const handleOverlayClick = (e) => {
        if (popupRef.current && !popupRef.current.contains(e.target)) {
            onClose();
        }
    };

    if (!data) return null;

    const { actual_location, location_pred } = data;
    const sensorPositions = Array.from({ length: 11 }, (_, i) => i * 100);
    const pipelineY = 0;

    const chartData = {
        datasets: [
            {
                label: "Pipeline",
                data: sensorPositions.map((x) => ({ x, y: pipelineY })),
                borderColor: "rgba(0, 100, 255, 0.8)",
                borderWidth: 6,
                showLine: true,
                pointRadius: 0,
            },
            {
                label: "Sensors",
                data: sensorPositions.map((x) => ({ x, y: pipelineY })),
                pointBackgroundColor: "#1a8b1a",
                pointBorderColor: "#ffffff",
                pointRadius: 7,
                showLine: false,
            },
            {
                label: "Actual Leak",
                data: [{ x: actual_location, y: pipelineY }],
                pointBackgroundColor: "orange",
                pointRadius: 10,
            },
            {
                label: "Predicted Leak",
                data: [{ x: location_pred, y: pipelineY }],
                pointBackgroundColor: "red",
                pointRadius: 10,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                min: 0,
                max: 1000,
                title: { display: true, text: "Distance (m)" },
                ticks: { stepSize: 100 },
                grid: { color: "#e0e0e0" },
            },
            y: { display: false },
        },
        plugins: {
            legend: { position: "top" },
            title: { display: true, text: "Pipeline Leak Visualization" },
        },
        layout: { padding: 10 },
    };

    return (
        <div className="popup-overlay" onClick={handleOverlayClick}>
            <div className="popup-box" ref={popupRef}>
                <button className="close-btn" onClick={onClose}>✖</button>
                <h2>Leak Analysis – {data.Run_ID}</h2>
                <div className="chart-container">
                    <Scatter data={chartData} options={options} />
                </div>
                <div className="info">
                    <p><b>Actual Leak Location:</b> {actual_location?.toFixed(2)} m</p>
                    <p><b>Predicted Leak Location:</b> {location_pred?.toFixed(2)} m</p>
                    <p><b>Error ΔX:</b> {data.delta_x?.toFixed(2)} m</p>
                </div>
            </div>
        </div>
    );
}
