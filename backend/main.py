"""
main.py  -  Vitt Chetak Unified API
-------------------------------------
All 6 ML models in one service:

MSME Models:
  M1: XGBoost Credit Health (joblib)
  M2: Random Forest Fraud Detection (joblib)
  M3: Revenue Growth Predictor (joblib)

Retail Models:
  R1: XGBoost EMI Default Risk (PyCaret)
  R2: LSTM Liquidity Stress (PyTorch)
  R3: Isolation Forest Fraud Detection (joblib)

Endpoints:
  POST /predict/msme    → Vitt Chetak Index (0-100)
  POST /predict/retail  → Retail Risk Score (0-100)
  GET  /                → Health check

Run with: uvicorn main:app --reload
"""

import os
import re
import joblib
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import shap
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from pycaret.classification import load_model, predict_model

# ──────────────────────────────────────────────
# APP SETUP
# ──────────────────────────────────────────────
app = FastAPI(
    title="Vitt Chetak Unified API",
    description="Single API serving MSME (M1/M2/M3) and Retail (R1/R2/R3) credit risk models.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR   = os.environ.get("MODELS_PATH",  os.path.join(BASE_DIR, "models"))
DATASET_PATH = os.environ.get("DATASET_PATH", os.path.join(BASE_DIR, "dataset"))

# ──────────────────────────────────────────────
# LSTM ARCHITECTURE (must match train_r2.py)
# ──────────────────────────────────────────────
class LSTMStressModel(nn.Module):
    def __init__(self, input_size=2, hidden_size=32, dropout=0.2):
        super().__init__()
        self.lstm    = nn.LSTM(input_size, hidden_size, batch_first=True)
        self.dropout = nn.Dropout(dropout)
        self.fc1     = nn.Linear(hidden_size, 16)
        self.relu    = nn.ReLU()
        self.fc2     = nn.Linear(16, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        _, (hn, _) = self.lstm(x)
        out = hn[-1]
        out = self.dropout(out)
        out = self.relu(self.fc1(out))
        out = self.sigmoid(self.fc2(out))
        return out

# ──────────────────────────────────────────────
# LOAD ALL MODELS AT STARTUP
# ──────────────────────────────────────────────
print("=" * 50)
print("Loading Vitt Chetak models...")
print("=" * 50)

# ── MSME: M1 Credit Health ────────────────────
try:
    m1_health = joblib.load(os.path.join(MODELS_DIR, "msme_health_m1.pkl"))
    print("✅ M1 (MSME Credit Health) loaded")
except Exception as e:
    print(f"❌ M1 failed: {e}")
    m1_health = None

# ── MSME: M2 Fraud Detection ──────────────────
try:
    m2_fraud = joblib.load(os.path.join(MODELS_DIR, "msme_fraud_m2.pkl"))
    print("✅ M2 (MSME Fraud Detection) loaded")
except Exception as e:
    print(f"❌ M2 failed: {e}")
    m2_fraud = None

# ── MSME: M3 Revenue Growth ───────────────────
try:
    m3_revenue = joblib.load(os.path.join(MODELS_DIR, "msme_revenue_m3.pkl"))
    print("✅ M3 (MSME Revenue Growth) loaded")
except Exception as e:
    print(f"❌ M3 failed: {e}")
    m3_revenue = None

# ── Retail: R1 PyCaret XGBoost ────────────────
try:
    r1_model = load_model(os.path.join(MODELS_DIR, "r1_model"))
    print("✅ R1 (Retail EMI Default) loaded")
except Exception as e:
    print(f"❌ R1 failed: {e}")
    r1_model = None

# ── Retail: R2 LSTM Liquidity Stress ──────────
try:
    r2_checkpoint = torch.load(
        os.path.join(MODELS_DIR, "r2_lstm_model.pt"),
        map_location="cpu",
    )
    r2_model = LSTMStressModel(
        input_size  = r2_checkpoint["input_size"],
        hidden_size = r2_checkpoint["hidden_size"],
    )
    r2_model.load_state_dict(r2_checkpoint["model_state_dict"])
    r2_model.eval()
    r2_scaler  = joblib.load(os.path.join(MODELS_DIR, "r2_scaler.pkl"))
    r2_seq_len = r2_checkpoint["seq_len"]
    print("✅ R2 (Retail LSTM Liquidity) loaded")
except Exception as e:
    print(f"❌ R2 failed: {e}")
    r2_model   = None
    r2_scaler  = None
    r2_seq_len = 10

# ── Retail: R3 Isolation Forest Fraud ─────────
try:
    r3_saved    = joblib.load(os.path.join(MODELS_DIR, "r3_fraud_model.pkl"))
    r3_model    = r3_saved["model"]
    r3_features = r3_saved["features"]
    r3_scaler   = joblib.load(os.path.join(MODELS_DIR, "r3_scaler.pkl"))
    print("✅ R3 (Retail Isolation Forest Fraud) loaded")
except Exception as e:
    print(f"❌ R3 failed: {e}")
    r3_model    = None
    r3_features = None
    r3_scaler   = None

# ── Retail: R1 Column Schema ──────────────────
try:
    header_df = pd.read_csv(
        os.path.join(DATASET_PATH, "application_train.csv"), nrows=0
    )
    header_df.columns = [re.sub(r"[^A-Za-z0-9_]+", "_", col) for col in header_df.columns]
    header_df = header_df.drop(columns=["SK_ID_CURR", "TARGET"], errors="ignore")
    R1_EXPECTED_COLS = list(header_df.columns)
    print(f"✅ R1 column schema loaded ({len(R1_EXPECTED_COLS)} cols)")
except Exception as e:
    print(f"❌ R1 column schema failed: {e}")
    R1_EXPECTED_COLS = []

print("=" * 50)
print("All models loaded.\n")

# ──────────────────────────────────────────────
# SHARED HELPERS
# ──────────────────────────────────────────────
def get_risk_level(score: int) -> str:
    """Convert a 0-100 score into a traffic-light label."""
    if score >= 80:
        return "Green"
    elif score >= 50:
        return "Yellow"
    return "Red"


def pick_top_reasons(
    r1_risk, r1_reasons,
    r2_risk, r2_reasons,
    r3_risk, r3_reasons,
) -> List[str]:
    """Return 3 deduplicated reasons, starting from the highest-risk model."""
    ranked = sorted(
        [
            (r1_risk, r1_reasons),
            (r2_risk, r2_reasons),
            (r3_risk, r3_reasons),
        ],
        key=lambda x: x[0],
        reverse=True,
    )
    reasons: List[str] = []
    for _, model_reasons in ranked:
        for r in model_reasons:
            if r not in reasons:
                reasons.append(r)
            if len(reasons) == 3:
                return reasons
    return reasons[:3]

# ──────────────────────────────────────────────
# INPUT SCHEMAS
# ──────────────────────────────────────────────
class MSMEInput(BaseModel):
    # Core financial
    annual_income: float
    loan_amount: float
    installment: float
    dti: float
    # Credit behaviour
    inquiries_last_12m: int
    delinq_2y: int
    pub_rec: int
    # Business activity
    order_count: int
    unique_days: int
    # Categorical
    homeownership: str  # e.g., 'RENT', 'MORTGAGE', 'OWN'
    region: str         # e.g., 'West', 'East', 'South', 'Central'


class RetailInput(BaseModel):
    customer_id: str = "RETAIL-001"

    # R1 fields
    AMT_INCOME_TOTAL: float
    AMT_CREDIT: float
    AMT_ANNUITY: float
    AMT_GOODS_PRICE: Optional[float] = None
    DAYS_BIRTH: int
    DAYS_EMPLOYED: int
    CODE_GENDER: str = "M"
    CNT_CHILDREN: int = 0
    CNT_FAM_MEMBERS: float = 2.0
    NAME_EDUCATION_TYPE: str = "Secondary_special"
    NAME_FAMILY_STATUS: str = "Married"
    NAME_HOUSING_TYPE: str = "House_apartment"
    EXT_SOURCE_1: Optional[float] = None
    EXT_SOURCE_2: Optional[float] = None
    EXT_SOURCE_3: Optional[float] = None
    DAYS_LAST_PHONE_CHANGE: Optional[float] = None
    OWN_CAR_AGE: Optional[float] = None

    # R2 fields — list of [PAYMENT_DELAY, PAYMENT_RATIO] per month
    payment_history: Optional[List[List[float]]] = None

    # R3 fields — latest transaction
    transaction_type: str = "PAYMENT"
    transaction_amount: float = 5000.0
    old_balance_orig: float = 50000.0
    new_balance_orig: float = 45000.0
    old_balance_dest: float = 10000.0
    new_balance_dest: float = 15000.0

# ──────────────────────────────────────────────
# ENDPOINT: MSME
# ──────────────────────────────────────────────
@app.post("/predict/msme", summary="Vitt Chetak Index for MSME borrowers")
async def predict_msme(data: MSMEInput):
    """
    Runs M1 (Credit Health), M2 (Fraud), M3 (Revenue Growth) and returns
    the composite Vitt Chetak Index (0–100) with a Green / Amber / Red status.
    """
    try:
        raw = data.dict()

        # ── Feature Engineering ───────────────────
        loan_to_income = raw["loan_amount"] / (raw["annual_income"] + 1)
        risk_index     = raw["inquiries_last_12m"] + raw["pub_rec"] + raw["delinq_2y"]
        orders_per_day = raw["order_count"] / (raw["unique_days"] + 1)

        # ── M1: Probability of Default ────────────
        if m1_health:
            prob_default = m1_health.predict_proba(pd.DataFrame([[
                raw["annual_income"], raw["dti"], raw["loan_amount"],
                raw["installment"], raw["inquiries_last_12m"],
                raw["delinq_2y"], loan_to_income, risk_index,
            ]], columns=[
                "annual_income", "debt_to_income", "loan_amount", "installment",
                "inquiries_last_12m", "delinq_2y", "loan_to_income", "risk_score_index",
            ]))[0][1]
        else:
            prob_default = 0.5

        # ── M2: Probability of Fraud ──────────────
        if m2_fraud:
            prob_fraud = m2_fraud.predict_proba(pd.DataFrame([[
                raw["loan_amount"], raw["annual_income"], 0, 0, 0,
            ]], columns=[
                "amount", "oldbalanceOrg", "newbalanceOrig", "oldbalanceDest", "newbalanceDest",
            ]))[0][1]
        else:
            prob_fraud = 0.1

        # ── M3: Probability of High Growth ────────
        if m3_revenue:
            prob_growth = m3_revenue.predict_proba(pd.DataFrame([[
                raw["order_count"], raw["unique_days"], orders_per_day,
            ]], columns=["order_count", "unique_days", "orders_per_day"]))[0][1]
        else:
            prob_growth = 0.5

        # ── Vitt Chetak Index ─────────────────────
        health_score = (1 - prob_default) * 40   # max 40
        safety_score = (1 - prob_fraud)   * 30   # max 30
        growth_score = prob_growth        * 30   # max 30
        total_index  = round(health_score + safety_score + growth_score, 2)

        status = "Green" if total_index > 70 else "Amber" if total_index > 40 else "Red"

        return {
            "type"              : "MSME",
            "vitt_chetak_index" : total_index,
            "status"            : status,
            "breakdown"         : {
                "credit_health"  : round(health_score, 2),
                "safety_shield"  : round(safety_score, 2),
                "growth_potential": round(growth_score, 2),
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ──────────────────────────────────────────────
# ENDPOINT: RETAIL
# ──────────────────────────────────────────────
@app.post("/predict/retail", summary="Vitt Chetak Score for Retail borrowers")
async def predict_retail(data: RetailInput):
    """
    Runs R1 (EMI Default), R2 (Liquidity Stress), R3 (Fraud) and returns
    a composite risk score (0–100) with Green / Yellow / Red status.
    """
    try:
        results = {}

        # ── R1: EMI Default Risk ──────────────────
        if r1_model and R1_EXPECTED_COLS:
            known = {
                "AMT_INCOME_TOTAL"      : data.AMT_INCOME_TOTAL,
                "AMT_CREDIT"            : data.AMT_CREDIT,
                "AMT_ANNUITY"           : data.AMT_ANNUITY,
                "AMT_GOODS_PRICE"       : data.AMT_GOODS_PRICE,
                "DAYS_BIRTH"            : data.DAYS_BIRTH,
                "DAYS_EMPLOYED"         : data.DAYS_EMPLOYED,
                "CODE_GENDER"           : data.CODE_GENDER,
                "CNT_CHILDREN"          : data.CNT_CHILDREN,
                "CNT_FAM_MEMBERS"       : data.CNT_FAM_MEMBERS,
                "NAME_EDUCATION_TYPE"   : data.NAME_EDUCATION_TYPE,
                "NAME_FAMILY_STATUS"    : data.NAME_FAMILY_STATUS,
                "NAME_HOUSING_TYPE"     : data.NAME_HOUSING_TYPE,
                "EXT_SOURCE_1"          : data.EXT_SOURCE_1,
                "EXT_SOURCE_2"          : data.EXT_SOURCE_2,
                "EXT_SOURCE_3"          : data.EXT_SOURCE_3,
                "DAYS_LAST_PHONE_CHANGE": data.DAYS_LAST_PHONE_CHANGE,
                "OWN_CAR_AGE"           : data.OWN_CAR_AGE,
            }

            base_cols = [
                c for c in R1_EXPECTED_COLS
                if c not in ("CREDIT_INCOME_RATIO", "ANNUITY_INCOME_RATIO", "EMPLOYED_BIRTH_RATIO")
            ]
            row = {col: float("nan") for col in base_cols}
            row.update({k: v for k, v in known.items() if v is not None})

            df_r1 = pd.DataFrame([row])
            df_r1["CREDIT_INCOME_RATIO"]  = df_r1["AMT_CREDIT"]    / df_r1["AMT_INCOME_TOTAL"]
            df_r1["ANNUITY_INCOME_RATIO"] = df_r1["AMT_ANNUITY"]   / df_r1["AMT_INCOME_TOTAL"]
            df_r1["EMPLOYED_BIRTH_RATIO"] = df_r1["DAYS_EMPLOYED"] / df_r1["DAYS_BIRTH"]

            pred_r1      = predict_model(r1_model, data=df_r1)
            default_prob = float(pred_r1["prediction_score"].iloc[0])

            # SHAP reasons
            r1_reasons = []
            try:
                preprocessor = r1_model[:-1]
                estimator    = r1_model[-1]
                transformed  = preprocessor.transform(df_r1)

                if not isinstance(transformed, pd.DataFrame):
                    transformed = pd.DataFrame(transformed)

                explainer = shap.TreeExplainer(estimator)
                shap_vals = explainer.shap_values(transformed)
                sv = shap_vals[1][0] if isinstance(shap_vals, list) else shap_vals[0]

                reason_map = {
                    "EXT_SOURCE_2"        : "Low external credit score (EXT_SOURCE_2)",
                    "EXT_SOURCE_3"        : "Low external credit score (EXT_SOURCE_3)",
                    "EXT_SOURCE_1"        : "Low external credit score (EXT_SOURCE_1)",
                    "CREDIT_INCOME_RATIO" : "High credit to income ratio",
                    "ANNUITY_INCOME_RATIO": "High EMI to income ratio",
                    "EMPLOYED_BIRTH_RATIO": "Short employment history relative to age",
                    "DAYS_BIRTH"          : "Age is a risk factor",
                    "DAYS_EMPLOYED"       : "Short employment duration",
                    "AMT_CREDIT"          : "High loan amount requested",
                    "AMT_INCOME_TOTAL"    : "Low income relative to loan",
                    "AMT_ANNUITY"         : "High monthly EMI burden",
                    "CNT_CHILDREN"        : "High number of dependents",
                }

                shap_series = (
                    pd.Series(np.abs(sv), index=transformed.columns)
                    .sort_values(ascending=False)
                )
                r1_reasons = [
                    reason_map.get(c, c) for c in shap_series.head(3).index.tolist()
                ]
            except Exception as shap_err:
                print(f"SHAP warning (non-fatal): {shap_err}")
                r1_reasons = [
                    "EXT_SOURCE scores below average",
                    "High credit to income ratio",
                    "Employment history is short",
                ]

            results["r1"] = {"default_risk": round(default_prob, 2), "reasons": r1_reasons}
        else:
            results["r1"] = {"default_risk": 0.5, "reasons": ["R1 model unavailable"]}

        # ── R2: Liquidity Stress ──────────────────
        if r2_model and r2_scaler and data.payment_history:
            seq = np.array(data.payment_history, dtype=np.float32)

            if len(seq) >= r2_seq_len:
                seq = seq[-r2_seq_len:]
            else:
                pad = np.zeros((r2_seq_len - len(seq), 2), dtype=np.float32)
                seq = np.vstack([pad, seq])

            seq_scaled = r2_scaler.transform(seq)
            seq_tensor = torch.tensor(seq_scaled, dtype=torch.float32).unsqueeze(0)

            with torch.no_grad():
                stress_prob = r2_model(seq_tensor).item()

            delays    = [row[0] for row in data.payment_history]
            ratios    = [row[1] for row in data.payment_history]
            avg_delay = np.mean(delays[-3:])
            avg_ratio = np.mean(ratios[-3:])

            r2_reasons = []
            if avg_delay > 5:
                r2_reasons.append(f"Severe payment delays averaging {avg_delay:.0f} days")
            elif avg_delay > 0:
                r2_reasons.append(f"Payment delays of {avg_delay:.0f} days detected recently")
            if avg_ratio < 0.95:
                r2_reasons.append(f"Partial EMI payments — {avg_ratio * 100:.0f}% paid on average")
            if len(delays) > 1 and delays[-1] > delays[0]:
                r2_reasons.append("Payment behaviour deteriorating over time")

            fallbacks = [
                "Payment history shows stress signals",
                "Liquidity under pressure",
                "EMI consistency declining",
            ]
            while len(r2_reasons) < 3:
                r2_reasons.append(fallbacks[len(r2_reasons) % len(fallbacks)])

            results["r2"] = {
                "liquidity_stress": round(stress_prob, 2),
                "reasons"         : r2_reasons[:3],
            }
        else:
            results["r2"] = {
                "liquidity_stress": 0.2,
                "reasons"         : ["Insufficient payment history"],
            }

        # ── R3: Fraud Detection ───────────────────
        if r3_model and r3_features and r3_scaler:
            t = {
                "type"          : data.transaction_type,
                "amount"        : data.transaction_amount,
                "oldbalanceOrg" : data.old_balance_orig,
                "newbalanceOrig": data.new_balance_orig,
                "oldbalanceDest": data.old_balance_dest,
                "newbalanceDest": data.new_balance_dest,
            }

            orig_zero = 1 if t["newbalanceOrig"] == 0 else 0
            dest_zero = 1 if t["oldbalanceDest"] == 0 else 0
            round_amt = 1 if t["amount"] % 1000 == 0 else 0
            large_amt = 1 if t["amount"] > 370000 else 0
            type_map  = {"CASH_IN": 0, "CASH_OUT": 1, "DEBIT": 2, "PAYMENT": 3, "TRANSFER": 4}

            feature_dict = {
                "amount"              : t["amount"],
                "oldbalanceOrg"       : t["oldbalanceOrg"],
                "newbalanceOrig"      : t["newbalanceOrig"],
                "oldbalanceDest"      : t["oldbalanceDest"],
                "newbalanceDest"      : t["newbalanceDest"],
                "orig_balance_diff"   : t["newbalanceOrig"] - t["oldbalanceOrg"],
                "dest_balance_diff"   : t["newbalanceDest"] - t["oldbalanceDest"],
                "orig_zero"           : orig_zero,
                "dest_zero"           : dest_zero,
                "round_amount"        : round_amt,
                "amount_to_orig_ratio": t["amount"] / (t["oldbalanceOrg"] + 1),
                "amount_to_dest_ratio": t["amount"] / (t["oldbalanceDest"] + 1),
                "type_encoded"        : type_map.get(t["type"], 0),
                "large_amount"        : large_amt,
            }

            fv       = np.array([feature_dict[f] for f in r3_features], dtype=np.float32).reshape(1, -1)
            X_scaled = r3_scaler.transform(fv)
            ascore   = r3_model.decision_function(X_scaled)[0]
            model_fp = float(np.clip(1 - (ascore + 0.5), 0.0, 1.0))

            rule = 0.0
            if orig_zero:                                       rule += 0.35
            if dest_zero:                                       rule += 0.25
            if round_amt and t["amount"] >= 100000:             rule += 0.20
            if t["amount"] / (t["oldbalanceOrg"] + 1) >= 0.99: rule += 0.15
            if large_amt:                                       rule += 0.05
            rule       = min(rule, 1.0)
            fraud_prob = round((0.6 * rule) + (0.4 * model_fp), 2)

            r3_reasons = []
            if orig_zero: r3_reasons.append("Account balance wiped to zero after transfer")
            if dest_zero: r3_reasons.append("Funds sent to a previously empty account")
            if round_amt: r3_reasons.append(f"Suspicious round-number amount (₹{t['amount']:,.0f})")
            if large_amt: r3_reasons.append("Large amount transfer flagged for review")

            fallbacks = [
                "Transaction pattern deviates from normal",
                "Anomalous fund flow detected",
                "Transaction flagged by fraud model",
            ]
            while len(r3_reasons) < 3:
                r3_reasons.append(fallbacks[len(r3_reasons) % len(fallbacks)])

            results["r3"] = {
                "fraud_prob": fraud_prob,
                "reasons"   : r3_reasons[:3],
            }
        else:
            results["r3"] = {"fraud_prob": 0.1, "reasons": ["R3 model unavailable"]}

        # ── Final Score Fusion: R1 50%, R2 30%, R3 20% ──
        default_risk     = results["r1"]["default_risk"]
        liquidity_stress = results["r2"]["liquidity_stress"]
        fraud_prob_final = results["r3"]["fraud_prob"]

        combined_risk = (
            (0.5 * default_risk)     +
            (0.3 * liquidity_stress) +
            (0.2 * fraud_prob_final)
        )
        final_score = round((1 - combined_risk) * 100)
        risk_level  = get_risk_level(final_score)

        top_reasons = pick_top_reasons(
            default_risk,     results["r1"]["reasons"],
            liquidity_stress, results["r2"]["reasons"],
            fraud_prob_final, results["r3"]["reasons"],
        )

        return {
            "type"           : "RETAIL",
            "customer_id"    : data.customer_id,
            "score"          : final_score,
            "risk_level"     : risk_level,
            "flag_for_review": fraud_prob_final >= 0.60,
            "breakdown"      : {
                "default_risk"    : default_risk,
                "liquidity_stress": liquidity_stress,
                "fraud_safety"    : round(1 - fraud_prob_final, 2),
            },
            "reasons": top_reasons,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ──────────────────────────────────────────────
# HEALTH CHECK
# ──────────────────────────────────────────────
@app.get("/", summary="Health check")
async def root():
    return {
        "status"   : "Vitt Chetak Unified API running",
        "models"   : {
            "M1_msme_credit_health"    : m1_health    is not None,
            "M2_msme_fraud"            : m2_fraud     is not None,
            "M3_msme_revenue_growth"   : m3_revenue   is not None,
            "R1_retail_emi_default"    : r1_model     is not None,
            "R2_retail_lstm_liquidity" : r2_model     is not None,
            "R3_retail_isolation_fraud": r3_model     is not None,
        },
        "endpoints": ["/predict/msme", "/predict/retail"],
    }

# ──────────────────────────────────────────────
# ENTRY POINT
# ──────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)