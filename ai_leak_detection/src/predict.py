import joblib
import numpy as np

# Load trained models
clf = joblib.load("../models/leak_detector.pkl")
try:
    reg = joblib.load("../models/leak_locator.pkl")
except:
    reg = None

# Example: single sensor snapshot (flattened vector of pressures & acoustics)
# 11 sensors → 22 features total (P_0..P_1000 + A_0..A_1000)
new_reading = np.array([[100000, 99980, 99960, 99900, 99500, 99000, 98800, 98750, 98700, 98650, 98600,
                         0.01, 0.02, 0.05, 0.08, 0.21, 0.4, 0.35, 0.25, 0.15, 0.05, 0.01]])

# Predict leak / no-leak
leak_pred = clf.predict(new_reading)[0]

if leak_pred == 1:
    print("🚨 Leak detected!")
    if reg:
        loc = reg.predict(new_reading)[0]
        print(f"Estimated leak location: {loc:.1f} m")
else:
    print("✅ No leak detected.")
