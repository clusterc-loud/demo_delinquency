import pandas as pd
import xgboost as xgb
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score

# 1. Load Data
print("⏳ Loading M2 (Fraud) Dataset...")
df = pd.read_csv('m2.csv', nrows=200000) # Increased slightly for better variety

# 2. Preprocessing
# Convert 'type' to numbers because fraud is specific to certain transaction types
df = pd.get_dummies(df, columns=['type'], drop_first=True)

# Select features including the new 'type' columns
X = df.drop(['isFraud', 'isFlaggedFraud', 'nameOrig', 'nameDest'], axis=1, errors='ignore')
y = df['isFraud']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# 3. Train
print("🧠 Training Model M2 (Fraud Detection)...")
m2 = xgb.XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, eval_metric='logloss')
m2.fit(X_train, y_train)

# 4. Save
joblib.dump(m2, 'msme_fraud_m2.pkl')
print("✅ Success! Model M2 (Fraud) Saved!")

# 5. Evaluation
y_probs = m2.predict_proba(X_test)[:, 1]
auc = roc_auc_score(y_test, y_probs)
print(f"🛡️ Model 2 Fraud AUC Score: {auc:.4f}")