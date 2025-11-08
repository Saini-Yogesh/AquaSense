# ===============================================================
# File: preprocess.py
# Description: Load and preprocess pipeline sensor data for ML
# Author: Yogesh Saini
# ===============================================================

import pandas as pd
import numpy as np
import sys
sys.stdout.reconfigure(encoding='utf-8')

def load_and_preprocess(path):
    # Load dataset
    df = pd.read_csv(path)

    # Ensure LeakLabel column exists
    if 'LeakLabel' not in df.columns:
        raise ValueError("CSV must contain a 'LeakLabel' column")

    # Convert LeakLabel from text to binary
    df['LeakLabel'] = df['LeakLabel'].apply(
        lambda x: 1 if str(x).strip().lower() in ['leak', 'yes', 'true', '1'] else 0
    )

    # Identify sensor columns
    pressure_cols = [c for c in df.columns if c.startswith('P_')]
    acoustic_cols = [c for c in df.columns if c.startswith('A_')]

    # Compute differences (pressure/acoustic drop)
    for cols, prefix in [(pressure_cols, 'dP_'), (acoustic_cols, 'dA_')]:
        for i in range(len(cols) - 1):
            df[f"{prefix}{i}"] = df[cols[i+1]] - df[cols[i]]

    # Drop non-feature columns if present
    for col in ['Run_ID']:
        if col in df.columns:
            df.drop(columns=[col], inplace=True)

    # Separate features and labels
    X = df.drop(columns=['LeakLabel', 'Leak_Location'])
    y_class = df['LeakLabel']
    y_loc = df['Leak_Location']

    print("Preprocessing complete.")
    print(f"  Leak samples: {(y_class == 1).sum()}")
    print(f"  No-leak samples: {(y_class == 0).sum()}")

    return X, y_class, y_loc
