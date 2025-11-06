import pandas as pd
import joblib, os, json, sys
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, confusion_matrix

DATA_PATH = sys.argv[1] if len(sys.argv) > 1 else "../data/leak_data.csv"
MODEL_PATH = "../models"

df = pd.read_csv(DATA_PATH)
df['LeakLabel'] = df['LeakLabel'].map({'leak': 1, 'not leak': 0})

X = df.drop(['Run_ID', 'LeakLabel'], axis=1)
y = df['LeakLabel']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

clf = RandomForestClassifier(n_estimators=200, random_state=42)
clf.fit(X_train, y_train)

y_pred = clf.predict(X_test)
acc = accuracy_score(y_test, y_pred)
cm = confusion_matrix(y_test, y_pred).tolist()

os.makedirs(MODEL_PATH, exist_ok=True)
joblib.dump(clf, f"{MODEL_PATH}/leak_detector.pkl")

# Print JSON so Node can capture
print(json.dumps({"status": "success", "accuracy": acc, "confusion_matrix": cm}))
