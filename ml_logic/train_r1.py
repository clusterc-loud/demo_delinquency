"""
PyCaret Classification Training Script
---------------------------------------
- Loads CSV from user-specified path
- Cleans column names (removes special characters)
- Drops SK_ID_CURR
- Adds 3 engineered features
- Samples 40,000 rows
- Trains and tunes LightGBM via PyCaret
- Saves final model as r1_model in CSV folder
- Prints final AUC
"""

import gc
import os
import re
import pandas as pd
from pycaret.classification import (
    setup,
    create_model,
    tune_model,
    finalize_model,
    save_model,
    pull,
)

# ──────────────────────────────────────────────
# 1. Configuration
# ──────────────────────────────────────────────
CSV_PATH   = input("Enter the full path to your CSV file: ").strip().strip('"')
OUTPUT_DIR = os.path.dirname(os.path.abspath(CSV_PATH))
MODEL_NAME = os.path.join(OUTPUT_DIR, "r1_model")

TARGET_COL = "TARGET"
DROP_COL   = "SK_ID_CURR"

# ──────────────────────────────────────────────
# 2. Load data
# ──────────────────────────────────────────────
print(f"\n[INFO] Loading data from: {CSV_PATH}")
df = pd.read_csv(CSV_PATH)
print(f"[INFO] Dataset shape: {df.shape}")

# Clean column names – remove special characters
df.columns = [re.sub(r'[^A-Za-z0-9_]+', '_', col) for col in df.columns]
print("[INFO] Cleaned special characters from column names.")

# Clean categorical cell values – PyCaret uses these as one-hot column name
# suffixes, so any special JSON characters (/ [ ] { } " \) will cause
# LightGBM to crash with "Do not support special JSON characters in feature name"
cat_cols = df.select_dtypes(include='object').columns.tolist()
for col in cat_cols:
    df[col] = df[col].astype(str).str.replace(r'[^A-Za-z0-9_]+', '_', regex=True)
print(f"[INFO] Sanitized string values in {len(cat_cols)} categorical columns.")

# Drop ID column
if DROP_COL in df.columns:
    df = df.drop(columns=[DROP_COL])
    print(f"[INFO] Dropped column: {DROP_COL}")

# ──────────────────────────────────────────────
# 3. Feature Engineering
# ──────────────────────────────────────────────
df['CREDIT_INCOME_RATIO']  = df['AMT_CREDIT']    / df['AMT_INCOME_TOTAL']
df['ANNUITY_INCOME_RATIO'] = df['AMT_ANNUITY']   / df['AMT_INCOME_TOTAL']
df['EMPLOYED_BIRTH_RATIO'] = df['DAYS_EMPLOYED'] / df['DAYS_BIRTH']
print("[INFO] Added feature engineering columns: CREDIT_INCOME_RATIO, ANNUITY_INCOME_RATIO, EMPLOYED_BIRTH_RATIO")

# ──────────────────────────────────────────────
# 4. Sample 40,000 rows
# ──────────────────────────────────────────────
df = df.sample(50000, random_state=42)
print(f"[INFO] Sampled dataset shape: {df.shape}")
print(f"[INFO] Target distribution:\n{df[TARGET_COL].value_counts()}\n")

gc.collect()

# ──────────────────────────────────────────────
# 5. PyCaret Setup
# ──────────────────────────────────────────────
os.environ['OMP_NUM_THREADS'] = '2'

print("[INFO] Initialising PyCaret setup ...")
clf_setup = setup(
    data                   = df,
    target                 = TARGET_COL,
    imputation_type        = "simple",
    numeric_imputation     = "median",
    categorical_imputation = "mode",
    fix_imbalance          = False,
    normalize              = True,
    normalize_method       = "zscore",
    feature_selection      = False,
    fold                   = 3,
    n_jobs                 = 2,
    session_id             = 42,
    verbose                = True,
)

gc.collect()

# ──────────────────────────────────────────────
# 6. Create LightGBM model
# ──────────────────────────────────────────────
print("\n[INFO] Creating LightGBM model ...")
lgbm = create_model(
    'lightgbm',
    is_unbalance = True,
    n_jobs       = 2,
    num_leaves   = 31,
    verbose      = False,
    verbosity    = -1,
)

gc.collect()

# ──────────────────────────────────────────────
# 7. Tune LightGBM
# ──────────────────────────────────────────────
print("\n[INFO] Tuning LightGBM (n_iter=10, optimising AUC) ...")
tuned_lgbm = tune_model(
    lgbm,
    optimize = 'AUC',
    n_iter   = 10,
)

gc.collect()

# Pull tuning results (printed for reference only)
tuning_df = pull()
print("\n[INFO] Tuning results:")
print(tuning_df.to_string())

# ──────────────────────────────────────────────
# 8. Finalize model
# ──────────────────────────────────────────────
print("\n[INFO] Finalizing model on full dataset ...")
final_model = finalize_model(tuned_lgbm)

gc.collect()

# ──────────────────────────────────────────────
# 9. Save model
# ──────────────────────────────────────────────
save_model(final_model, MODEL_NAME)
print(f"\n[INFO] Model saved to: {MODEL_NAME}.pkl")

gc.collect()

# ──────────────────────────────────────────────
# 10. Report AUC
# ──────────────────────────────────────────────
# pull() after finalize_model returns the final CV results table;
# iloc[0] is the Mean row — the true best-model AUC, not an average of trials
results  = pull()
best_auc = results.loc['Mean', 'AUC']

print("\n" + "=" * 50)
print(f"  Model    : Tuned LightGBM")
print(f"  AUC (CV) : {best_auc:.4f}")
print(f"  Sample N : 50,000")
print(f"  Folds    : 3")
print(f"  n_jobs   : 2")
print("=" * 50)
