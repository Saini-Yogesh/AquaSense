# ===============================================================
# File: predict_csv.py
# Description: Predict leaks (0/1) and leak locations from a CSV
# Author: Yogesh Saini
# ===============================================================

import sys
import os
import json
import pandas as pd
import numpy as np
import joblib
from preprocess import load_and_preprocess

# Fix encoding for Windows
sys.stdout.reconfigure(encoding='utf-8')

# ---------------- READ CSV PATH ----------------
if len(sys.argv) < 2:
    print(json.dumps({"error": "No CSV file path provided"}))
    sys.exit(1)

csv_path = sys.argv[1]
if not os.path.exists(csv_path):
    print(json.dumps({"error": f"File not found: {csv_path}"}))
    sys.exit(1)

# ---------------- LOAD TRAINED MODELS ----------------
model_dir = "../models"
clf_path = os.path.join(model_dir, "leak_detector.pkl")
reg_path = os.path.join(model_dir, "leak_locator.pkl")

if not os.path.exists(clf_path):
    print(json.dumps({"error": "Leak detector model not found"}))
    sys.exit(1)

clf = joblib.load(clf_path)
reg = joblib.load(reg_path) if os.path.exists(reg_path) else None

# ---------------- PREPROCESS INPUT CSV ----------------
# Silence prints from preprocess
import io
import contextlib

try:
    with contextlib.redirect_stdout(io.StringIO()):
        X, _, _ = load_and_preprocess(csv_path)
except Exception as e:
    print(json.dumps({"error": f"Preprocessing failed: {str(e)}"}))
    sys.exit(1)

# Extract Run_IDs if present
try:
    df_raw = pd.read_csv(csv_path)
    run_ids = (
        df_raw["Run_ID"].tolist()
        if "Run_ID" in df_raw.columns
        else list(range(1, len(X) + 1))
    )
except Exception:
    run_ids = list(range(1, len(X) + 1))

# ---------------- PREDICTIONS ----------------
try:
    df_raw = pd.read_csv(csv_path)
    has_true_location = "Leak_Location" in df_raw.columns
except:
    has_true_location = False

try:
    leak_pred = clf.predict(X)
    leak_prob = clf.predict_proba(X)[:, 1]
except Exception as e:
    print(json.dumps({"error": f"Prediction failed: {str(e)}"}))
    sys.exit(1)

results = []
for i in range(len(X)):
    status = "leak" if leak_pred[i] == 1 else "no_leak"
    location_pred = None
    if status == "leak" and reg is not None:
        try:
            location_pred = float(reg.predict(X.iloc[[i]])[0])
        except Exception:
            location_pred = None

    actual_location = (
        float(df_raw["Leak_Location"].iloc[i])
        if has_true_location and not pd.isna(df_raw["Leak_Location"].iloc[i])
        else None
    )

    delta_x = None
    if actual_location is not None and location_pred is not None:
        delta_x = abs(location_pred - actual_location)

    results.append({
        "Run_ID": run_ids[i],
        "status": status,
        "probability": float(leak_prob[i]),
        "location_pred": location_pred,
        "actual_location": actual_location,
        "delta_x": delta_x
    })

# ---------------- SUMMARY ----------------
total = len(results)
leak_count = sum(1 for r in results if r["status"] == "leak")
no_leak_count = total - leak_count

summary = {"total": total, "leak": leak_count, "no_leak": no_leak_count}

# ---------------- OUTPUT JSON ----------------
output = {"summary": summary, "results": results}

# ✅ This is the ONLY print statement the backend will parse
print(json.dumps(output))
