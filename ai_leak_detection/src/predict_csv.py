import pandas as pd
import joblib, sys, json, os
import numpy as np

MODEL_PATH = "../models/leak_detector.pkl"
if not os.path.exists(MODEL_PATH):
    print(json.dumps({"status": "error", "message": "Model not trained yet"}))
    exit()

# Load model
clf = joblib.load(MODEL_PATH)

# Read uploaded CSV
csv_path = sys.argv[1]
df = pd.read_csv(csv_path)

# Keep only numeric sensor data
numeric_df = df.select_dtypes(include=["float64", "int64"])

# Align with model features if available
try:
    expected_features = clf.feature_names_in_
    numeric_df = numeric_df.reindex(columns=expected_features, fill_value=0)
except AttributeError:
    pass

results = []
leak_count = 0
no_leak_count = 0

# Helper to estimate leak location
def estimate_leak_location(row):
    A_cols = [c for c in row.index if c.startswith("A_")]
    if not A_cols:
        return None
    A_values = np.array([row[c] for c in A_cols])
    x_positions = np.array([float(c.split("_")[1]) for c in A_cols])
    if A_values.sum() <= 0:
        return None
    return float(np.sum(x_positions * A_values) / np.sum(A_values))

# Predict each row
for idx, row in numeric_df.iterrows():
    run_id = df.get("Run_ID", [f"Run_{idx+1}"])[idx]
    features = pd.DataFrame([row], columns=numeric_df.columns)
    try:
        pred = clf.predict(features)[0]
        status = "leak" if pred == 1 else "not leak"
        location = estimate_leak_location(row) if status == "leak" else None
        if status == "leak":
            leak_count += 1
        else:
            no_leak_count += 1
        results.append({"Run_ID": str(run_id), "status": status, "location": location})
    except Exception as e:
        results.append({"Run_ID": str(run_id), "status": "error", "message": str(e)})

summary = {
    "total": len(results),
    "leak": leak_count,
    "no_leak": no_leak_count
}

print(json.dumps({"status": "success", "summary": summary, "results": results}))
