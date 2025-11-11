import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <div className="home-content">
                <h1 className="home-title">🌊 AI-Based Leak Detection Dashboard</h1>
                <p className="home-description">
                    This project provides a smart visualization and <b> machine learning platform </b>
                    for real-time leak detection and localization in pipelines. Using simulated
                    pressure and acoustic sensor data, it helps engineers and supervisors
                    identify leaks quickly, estimate their positions, and analyze sensor patterns
                    across the entire pipeline.
                </p>

                <div className="button-group">
                    <button
                        className="home-btn primary"
                        onClick={() => navigate("/data")}
                    >
                        📈 View Sensor Data
                    </button>
                    <button
                        className="home-btn secondary"
                        onClick={() => navigate("/train")}
                    >
                        🤖 Train / Test ML Model
                    </button>
                </div>
            </div>

            <div className="home-footer">
                <p>Developed with ❤️ for intelligent pipeline monitoring.</p>
            </div>
        </div>
    );
}
