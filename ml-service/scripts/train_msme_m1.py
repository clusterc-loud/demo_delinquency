import pandas as pd
import xgboost as xgb
import joblib
import os
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

# 1. Path Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'datasets', 'loan.csv')
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'msme_health_m1.pkl')

print(f"INFO: Loading data from: {DATA_PATH}")

# 2. Load data and scan for available features
header = pd.read_csv(DATA_PATH, nrows=0)
all_cols = header.columns.tolist()

# Added int_rate and revol_util for better predictive power
potential_cols = [
    'annual_inc', 'annual_income', 'dti', 'debt_to_income', 
    'loan_amnt', 'loan_amount', 'installment', 'int_rate', 'revol_util',
    'inq_last_6mths', 'delinq_2y', 'loan_status', 'home_ownership'
]

# Only use columns that exist
use_cols = [col for col in potential_cols if col in all_cols]
df = pd.read_csv(DATA_PATH, usecols=use_cols, low_memory=False, nrows=300000)

# Rename to standard format
rename_dict = {
    'annual_inc': 'annual_income',
    'loan_amnt': 'loan_amount',
    'dti': 'debt_to_income',
    'inq_last_6mths': 'inquiries_last_12m',
    'home_ownership': 'homeownership'
}
df.rename(columns=rename_dict, inplace=True)

# 3. Create Target
risk_statuses = ['Charged Off', 'Default', 'Late (31-120 days)', 'Late (16-30 days)']
df['target'] = df['loan_status'].apply(lambda x: 1 if x in risk_statuses else 0)

# 4. Clean and Feature Engineering
if 'revol_util' in df.columns:
    df['revol_util'] = df['revol_util'].astype(str).str.rstrip('%').astype('float') / 100.0
if 'int_rate' in df.columns:
    df['int_rate'] = df['int_rate'].astype(str).str.rstrip('%').astype('float') / 100.0

df['loan_to_income'] = df['loan_amount'] / (df['annual_income'] + 1)
df['installment_to_income'] = df['installment'] / (df['annual_income'] + 1)

# 5. Prepare Features
X = df.drop(['loan_status', 'target'], axis=1).fillna(0)
if 'homeownership' in X.columns:
    X = pd.get_dummies(X, columns=['homeownership'], drop_first=True)
y = df['target']

# 6. Stratified Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 7. Train Model M1 (Target AUC 75-80%)
print("INFO: Training Model M1 (MSME Credit Health)...")
m1 = xgb.XGBClassifier(
    n_estimators=500,
    max_depth=7,
    learning_rate=0.03,
    scale_pos_weight=6, # High weight for risk classes
    subsample=0.8,
    colsample_bytree=0.8,
    eval_metric='auc',
    use_label_encoder=False
)

m1.fit(X_train, y_train)

# 8. Evaluation
y_probs = m1.predict_proba(X_test)[:, 1]
auc = roc_auc_score(y_test, y_probs)
print(f"INFO: FINAL AUC SCORE: {auc:.4f}")

# 9. Save
joblib.dump(m1, MODEL_PATH)
print(f"SUCCESS: Model M1 saved to: {MODEL_PATH}")