import pandas as pd
import xgboost as xgb
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score

# 1. Path Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'datasets', 'creditcard.csv')
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'msme_fraud_m2.pkl')

# 1. Load Data
print(f"INFO: Loading M2 (Fraud) Dataset from: {DATA_PATH}")
df = pd.read_csv(DATA_PATH, nrows=500000) # Using 500k rows for speed/accuracy balance

# 2. Preprocessing
# Target is 'is_fraud'
y = df['is_fraud']

# Select relevant numeric and categorical features
features = ['amt', 'category', 'gender', 'lat', 'long', 'city_pop', 'unix_time', 'merch_lat', 'merch_long']
X = df[features].copy()

# Simple encoding for categorical features
X = pd.get_dummies(X, columns=['category', 'gender'], drop_first=True)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# 3. Train
print("INFO: Training Model M2 (Fraud Detection)...")
m2 = xgb.XGBClassifier(
    n_estimators=200, 
    max_depth=6, 
    learning_rate=0.05, 
    scale_pos_weight=100, 
    eval_metric='logloss'
)
m2.fit(X_train, y_train)

# 4. Save
joblib.dump(m2, MODEL_PATH)
print(f"SUCCESS: Model M2 (Fraud) Saved to: {MODEL_PATH}")

# 5. Evaluation
y_probs = m2.predict_proba(X_test)[:, 1]
auc = roc_auc_score(y_test, y_probs)
print(f"INFO: Model 2 Fraud AUC Score: {auc:.4f}")