import os
import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score

# 1. Path Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'datasets', 'creditcard.csv')
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'retail_fraud_r3.pkl')
SCALER_PATH = os.path.join(BASE_DIR, 'models', 'retail_fraud_scaler_r3.pkl')

# 1. Load Data
print(f"INFO: Loading R3 (Fraud Anomaly) Dataset from: {DATA_PATH}")
df = pd.read_csv(DATA_PATH, nrows=200000)

# 2. Preprocessing
# Select numeric features for anomaly detection
features = ['amt', 'lat', 'long', 'city_pop', 'unix_time', 'merch_lat', 'merch_long']
X = df[features].fillna(0)
y = df['is_fraud']

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
joblib.dump(scaler, SCALER_PATH)

# 3. Train Isolation Forest
print("INFO: Training Model R3 (Unsupervised Fraud Anomaly Detector)...")
iso_forest = IsolationForest(
    n_estimators=100,
    contamination=df['is_fraud'].mean() if 'is_fraud' in df.columns else 0.01,
    random_state=42
)
iso_forest.fit(X_scaled)

# 4. Save
joblib.dump({
    'model': iso_forest,
    'features': features
}, MODEL_PATH)
print(f"SUCCESS: Model R3 (Anomaly) Saved to: {MODEL_PATH}")

# 5. Evaluation
# Isolation Forest: -1 for anomaly, 1 for normal
# decision_function gives anomaly score (lower is more anomalous)
scores = -iso_forest.decision_function(X_scaled)
if 'is_fraud' in df.columns:
    auc = roc_auc_score(y, scores)
    print(f"INFO: Model R3 Anomaly AUC Score: {auc:.4f}")