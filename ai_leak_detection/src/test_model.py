import pandas as pd
import joblib
from sklearn.metrics import accuracy_score, confusion_matrix

df = pd.read_csv("../data/leak_data.csv")
df['LeakLabel'] = df['LeakLabel'].map({'leak': 1, 'not leak': 0})

X = df.drop(['Run_ID', 'LeakLabel'], axis=1)
y = df['LeakLabel']

clf = joblib.load("../models/leak_detector.pkl")

y_pred = clf.predict(X)

print("Test Accuracy:", accuracy_score(y, y_pred))
print("Confusion Matrix:\n", confusion_matrix(y, y_pred))
