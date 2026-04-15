import pandas as pd
import xgboost as xgb
import joblib
import os
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score

# 1. Path Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'datasets', 'msme_revenue.csv')
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'msme_revenue_m3.pkl')

# 1. Load Data
print(f"INFO: Loading M3 (Revenue) Dataset from: {DATA_PATH}")
# Selecting specific columns for growth/risk prediction
cols = ['Term', 'NoEmp', 'NewExist', 'CreateJob', 'RetainedJob', 'UrbanRural', 
        'DisbursementGross', 'GrAppv', 'SBA_Appv', 'RealEstate', 'Portion', 'Default']
df = pd.read_csv(DATA_PATH, usecols=cols)

# 2. Preprocessing
# Clean currency strings if they are present
for col in ['DisbursementGross', 'GrAppv', 'SBA_Appv']:
    if df[col].dtype == 'object':
        df[col] = df[col].replace('[\$,]', '', regex=True).astype(float)

# Target is 'Default'
y = df['Default']
X = df.drop(['Default'], axis=1).fillna(0)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# 3. Train
print("INFO: Training Model M3 (Revenue Growth/Risk)...")
m3 = xgb.XGBClassifier(
    n_estimators=200, 
    max_depth=6, 
    learning_rate=0.05, 
    scale_pos_weight=4, 
    eval_metric='auc'
)
m3.fit(X_train, y_train)

# 4. Save
joblib.dump(m3, MODEL_PATH)
print(f"SUCCESS: Model M3 (Revenue) Saved to: {MODEL_PATH}")

# 5. Evaluation
y_probs = m3.predict_proba(X_test)[:, 1]
auc = roc_auc_score(y_test, y_probs)
print(f"INFO: Model 3 Revenue AUC Score: {auc:.4f}")