# ===============================================================
# File: train_model.py
# Description: Train two ML models
#   1. Leak Detection (classification)
#   2. Leak Localization (regression)
# Author: Yogesh Saini
# ===============================================================

import os
import sys
import json
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, mean_absolute_error
from joblib import dump
from preprocess import load_and_preprocess

# --- Fix Windows console encoding (no emoji crash) ---
sys.stdout.reconfigure(encoding='utf-8')

# ---------------- READ DATA PATH ARGUMENT ----------------
if len(sys.argv) > 1:
    DATA_PATH = sys.argv[1]
else:
    DATA_PATH = "../data/pipeline_sensor_data.csv"

# Get absolute path of the script directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(SCRIPT_DIR, "../models")
os.makedirs(MODEL_DIR, exist_ok=True)

print(f"\nUsing dataset: {DATA_PATH}")

# ---------------- LOAD & PREPROCESS ----------------
X, y_class, y_loc = load_and_preprocess(DATA_PATH)

# ---------------- CLASSIFICATION MODEL ----------------
print("\nTraining Leak Detection Model (Classification)...")

X_train, X_test, y_train, y_test = train_test_split(
    X, y_class, test_size=0.2, random_state=42
)

clf = RandomForestClassifier(n_estimators=200, random_state=42)
clf.fit(X_train, y_train)

y_pred = clf.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"Leak detection accuracy: {acc*100:.2f}%")

dump(clf, os.path.join(MODEL_DIR, "leak_detector.pkl"))
print("Saved: models/leak_detector.pkl")

# ---------------- REGRESSION MODEL ----------------
print("\nTraining Leak Localization Model (Regression)...")

X_leak = X[y_class == 1]
y_leak = y_loc[y_class == 1]

mae = None
if len(X_leak) == 0:
    print("No leak samples found — skipping leak location model.")
else:
    X_train, X_test, y_train, y_test = train_test_split(
        X_leak, y_leak, test_size=0.2, random_state=42
    )

    reg = RandomForestRegressor(n_estimators=200, random_state=42)
    reg.fit(X_train, y_train)

    y_pred = reg.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    print(f"Leak location MAE: {mae:.2f} meters")

    dump(reg, os.path.join(MODEL_DIR, "leak_locator.pkl"))
    print("Saved: models/leak_locator.pkl")

print("\nTraining Complete!")

# ---------------- RETURN JSON OUTPUT ----------------
result = {
    "accuracy": acc,
    "mae": mae,
    "status": "training_complete"
}
print(json.dumps(result))
