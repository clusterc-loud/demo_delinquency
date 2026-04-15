import pandas as pd
import xgboost as xgb
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score

# 1. Path Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'datasets', 'retail_loans.csv')
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'retail_emi_r1.pkl')

# 1. Load Data
print(f"INFO: Loading R1 (Retail EMI) Dataset from: {DATA_PATH}")
# Selecting key features for predicting the continuous risk target
cols = ['AMT_INCOME_TOTAL', 'AMT_CREDIT', 'AMT_ANNUITY', 'AMT_GOODS_PRICE', 
        'REGION_POPULATION_RELATIVE', 'DAYS_BIRTH', 'DAYS_EMPLOYED', 
        'EXT_SOURCE_2', 'EXT_SOURCE_3', 'TARGET']
df = pd.read_csv(DATA_PATH, usecols=lambda x: x in cols)

# 2. Preprocessing
# Target is 'TARGET' (Continuous score)
df = df.dropna(subset=['TARGET'])
y = df['TARGET']
X = df.drop(['TARGET'], axis=1).fillna(0)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 3. Train
print("INFO: Training Model R1 (Retail Risk Regressor)...")
r1 = xgb.XGBRegressor(
    n_estimators=300, 
    max_depth=6, 
    learning_rate=0.05, 
    objective='reg:squarederror'
)
r1.fit(X_train, y_train)

# 4. Save
joblib.dump(r1, MODEL_PATH)
print(f"SUCCESS: Model R1 (Retail EMI Regressor) Saved to: {MODEL_PATH}")

# 5. Evaluation
y_preds = r1.predict(X_test)
r2 = r2_score(y_test, y_preds)
print(f"INFO: Model R1 Retail R-Squared: {r2:.4f}")
