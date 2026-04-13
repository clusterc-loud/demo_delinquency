import pandas as pd
import xgboost as xgb
import joblib
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

# 1. Load data - using the most 'stable' column names
# We'll try to find any behavioral signals that exist in your file
print("⏳ Loading data and scanning for available features...")

# First, read just the header to see what we actually have
header = pd.read_csv('loan.csv', nrows=0)
all_cols = header.columns.tolist()

# Define the "Ideal" list and the "Must-Have" list
potential_cols = [
    'annual_income', 'annual_inc', 'debt_to_income', 'dti', 
    'loan_amount', 'loan_amnt', 'installment', 
    'inquiries_last_12m', 'inq_last_6mths', 
    'tax_liens', 'delinq_2y', 'loan_status', 'loan_purpose', 'homeownership'
]

# Only use columns that actually exist in your CSV
use_cols = [col for col in potential_cols if col in all_cols]

df = pd.read_csv('loan.csv', usecols=use_cols, low_memory=False, nrows=1000000)

# Rename columns to a standard format so the logic below doesn't break
rename_dict = {
    'annual_inc': 'annual_income',
    'loan_amnt': 'loan_amount',
    'dti': 'debt_to_income',
    'inq_last_6mths': 'inquiries_last_12m'
}
df.rename(columns=rename_dict, inplace=True)

# 2. CREATE TARGET
risk_statuses = ['Charged Off', 'Default', 'Late (31-120 days)', 'Late (16-30 days)']
df['target'] = df['loan_status'].apply(lambda x: 1 if x in risk_statuses else 0)

# 3. FEATURE ENGINEERING (The 75% Multiplier)
# These ratios are much stronger than raw numbers
df['loan_to_income'] = df['loan_amount'] / (df['annual_income'] + 1)
df['installment_to_income'] = df['installment'] / (df['annual_income'] + 1)

# 4. Prepare Features
X = df.drop(['loan_status', 'loan_purpose', 'target'], axis=1).fillna(0)
X = pd.get_dummies(X, columns=['homeownership'], drop_first=True)
y = df['target']

# 5. Stratified Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 6. Train with High-Intensity Settings
print("🧠 Training Model M1 (Final Attempt at 0.70+)...")
m1 = xgb.XGBClassifier(
    n_estimators=400,
    max_depth=6,
    learning_rate=0.05,
    scale_pos_weight=4, # Balanced for AUC
    subsample=0.8,
    colsample_bytree=0.8,
    eval_metric='auc',
    use_label_encoder=False
)

m1.fit(X_train, y_train)

# 7. Save the Brain
joblib.dump(m1, 'msme_health_m1.pkl')
print("✅ Success! Model M1 updated and saved.")

# 8. Evaluation
y_probs = m1.predict_proba(X_test)[:, 1]
auc = roc_auc_score(y_test, y_probs)
print(f"🚀 FINAL AUC SCORE: {auc:.4f}")