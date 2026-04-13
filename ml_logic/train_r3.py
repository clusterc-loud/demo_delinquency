"""
train_r3.py  -  R3 Fraud & Loan Stacking Detector (Isolation Forest)
---------------------------------------------------------------------
- Loads PaySim dataset
- Engineers fraud signal features
- Trains Isolation Forest (unsupervised anomaly detection)
- Evaluates using the isFraud label
- Saves model as r3_fraud_model.pkl
"""

import os
import gc
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, classification_report

os.environ['OMP_NUM_THREADS'] = '2'

# ──────────────────────────────────────────────
# 1. Load data
# ──────────────────────────────────────────────
CSV_PATH    = r"D:\vitt-chetak-dataset\PS_20174392719_1491204439457_log.csv"
MODEL_PATH  = r"D:\vitt-chetak-dataset\r3_fraud_model.pkl"
SCALER_PATH = r"D:\vitt-chetak-dataset\r3_scaler.pkl"

print("[INFO] Loading data ...")
df = pd.read_csv(CSV_PATH)
print(f"[INFO] Shape: {df.shape}")
print(df.head())
print(f"\n[INFO] Fraud distribution:\n{df['isFraud'].value_counts()}")

# ──────────────────────────────────────────────
# 2. Feature Engineering
# ──────────────────────────────────────────────
print("\n[INFO] Engineering features ...")

# Balance change signals
df['ORIG_BALANCE_DIFF'] = df['newbalanceOrig'] - df['oldbalanceOrg']
df['DEST_BALANCE_DIFF'] = df['newbalanceDest'] - df['oldbalanceDest']

# Circular flow signal: money leaves origin and destination unchanged
df['ORIG_BALANCE_ZERO_AFTER'] = (df['newbalanceOrig'] == 0).astype(int)
df['DEST_BALANCE_ZERO_BEFORE'] = (df['oldbalanceDest'] == 0).astype(int)

# Round number transaction signal (common in fraud)
df['IS_ROUND_AMOUNT'] = (df['amount'] % 1000 == 0).astype(int)

# Amount vs original balance ratio
df['AMOUNT_TO_ORIG_RATIO'] = df['amount'] / (df['oldbalanceOrg'] + 1)

# Amount vs destination balance ratio
df['AMOUNT_TO_DEST_RATIO'] = df['amount'] / (df['oldbalanceDest'] + 1)

# Transaction type encoding
type_map = {'CASH_IN': 0, 'CASH_OUT': 1, 'DEBIT': 2, 'PAYMENT': 3, 'TRANSFER': 4}
df['TYPE_ENCODED'] = df['type'].map(type_map).fillna(0).astype(int)

# Flag: large amount (top 10% of transactions)
amount_90th = df['amount'].quantile(0.90)
df['IS_LARGE_AMOUNT'] = (df['amount'] > amount_90th).astype(int)

gc.collect()

# ──────────────────────────────────────────────
# 3. Select features for model
# ──────────────────────────────────────────────
FEATURES = [
    'amount',
    'oldbalanceOrg',
    'newbalanceOrig',
    'oldbalanceDest',
    'newbalanceDest',
    'ORIG_BALANCE_DIFF',
    'DEST_BALANCE_DIFF',
    'ORIG_BALANCE_ZERO_AFTER',
    'DEST_BALANCE_ZERO_BEFORE',
    'IS_ROUND_AMOUNT',
    'AMOUNT_TO_ORIG_RATIO',
    'AMOUNT_TO_DEST_RATIO',
    'TYPE_ENCODED',
    'IS_LARGE_AMOUNT',
]

# Sample 200k rows for faster training (Isolation Forest scales well)
df_sample = df.sample(200000, random_state=42)
print(f"[INFO] Sampled: {df_sample.shape}")
print(f"[INFO] Fraud in sample: {df_sample['isFraud'].sum()}")

X = df_sample[FEATURES].values
y = df_sample['isFraud'].values

gc.collect()

# ──────────────────────────────────────────────
# 4. Scale features
# ──────────────────────────────────────────────
scaler  = StandardScaler()
X_scaled = scaler.fit_transform(X)
joblib.dump(scaler, SCALER_PATH)
print(f"[INFO] Scaler saved to {SCALER_PATH}")

# ──────────────────────────────────────────────
# 5. Train Isolation Forest
#    contamination = expected % of fraud in data
#    PaySim has ~0.13% fraud so we set 0.002 (slightly higher)
# ──────────────────────────────────────────────
print("\n[INFO] Training Isolation Forest ...")
fraud_rate = df_sample['isFraud'].mean()
print(f"[INFO] Fraud rate in sample: {fraud_rate:.4f}")

iso_forest = IsolationForest(
    n_estimators  = 100,
    contamination = max(fraud_rate, 0.001),
    random_state  = 42,
    n_jobs        = 2,
    verbose       = 1,
)
iso_forest.fit(X_scaled)

gc.collect()

# ──────────────────────────────────────────────
# 6. Evaluate
#    Isolation Forest returns -1 (anomaly) or 1 (normal)
#    We convert anomaly scores to fraud probability
# ──────────────────────────────────────────────
print("\n[INFO] Evaluating ...")

# decision_function returns anomaly score (lower = more anomalous)
anomaly_scores = iso_forest.decision_function(X_scaled)

# Convert to fraud probability: invert and normalise to 0-1
fraud_prob = 1 - (anomaly_scores - anomaly_scores.min()) / \
             (anomaly_scores.max() - anomaly_scores.min())

auc_score = roc_auc_score(y, fraud_prob)

# Binary predictions: -1 → fraud (1), 1 → normal (0)
predictions = iso_forest.predict(X_scaled)
binary_preds = (predictions == -1).astype(int)

print(f"\n[INFO] Classification Report:")
print(classification_report(y, binary_preds, target_names=['Normal', 'Fraud']))

print(f"\n{'='*50}")
print(f"  Model    : Isolation Forest (R3 Fraud Detector)")
print(f"  AUC      : {auc_score:.4f}")
print(f"  Sample N : 200,000")
print(f"{'='*50}")

# ──────────────────────────────────────────────
# 7. Save model and feature list
# ──────────────────────────────────────────────
joblib.dump({
    'model'    : iso_forest,
    'features' : FEATURES,
}, MODEL_PATH)

print(f"\n[INFO] Model saved to : {MODEL_PATH}")
print(f"[INFO] Scaler saved to: {SCALER_PATH}")