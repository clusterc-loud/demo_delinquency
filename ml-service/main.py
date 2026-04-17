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
DATASET_PATH = os.environ.get("DATASET_PATH", os.path.join(BASE_DIR, "datasets"))

class LSTMStressModel(nn.Module):
    def __init__(self, input_size=1, hidden_size=32, num_layers=1):
        super(LSTMStressModel, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, 1)

    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        out, _ = self.lstm(x, (h0, c0))
        out = self.fc(out[:, -1, :])
        return torch.sigmoid(out)

# ──────────────────────────────────────────────
# LOAD ALL MODELS AT STARTUP
# ──────────────────────────────────────────────
print("=" * 50)
print("Loading Vitt Chetak models...")
print("=" * 50)

# ── MSME: M1 Credit Health ────────────────────
try:
    m1_health = joblib.load(os.path.join(MODELS_DIR, "msme_health_m1.pkl"))
    print("SUCCESS: M1 (MSME Credit Health) loaded")
except Exception as e:
    print(f"ERROR: M1 failed: {e}")
    m1_health = None

# ── MSME: M2 Fraud Detection ──────────────────
try:
    m2_fraud = joblib.load(os.path.join(MODELS_DIR, "msme_fraud_m2.pkl"))
    print("SUCCESS: M2 (MSME Fraud Detection) loaded")
except Exception as e:
    print(f"ERROR: M2 failed: {e}")
    m2_fraud = None

# ── MSME: M3 Revenue Growth ───────────────────
try:
    m3_revenue = joblib.load(os.path.join(MODELS_DIR, "msme_revenue_m3.pkl"))
    print("SUCCESS: M3 (MSME Revenue Growth) loaded")
except Exception as e:
    print(f"ERROR: M3 failed: {e}")
    m3_revenue = None

# ── Retail: R1 XGBoost ────────────────
try:
    r1_model = joblib.load(os.path.join(MODELS_DIR, "retail_emi_r1.pkl"))
    print("SUCCESS: R1 (Retail EMI Default) loaded")
except Exception as e:
    print(f"ERROR: R1 failed: {e}")
    r1_model = None

# ── Retail: R2 LSTM Liquidity Stress ──────────
try:
    r2_checkpoint = torch.load(
        os.path.join(MODELS_DIR, "retail_stress_r2.pt"),
        map_location="cpu",
    )
    r2_model = LSTMStressModel(
        input_size  = 1,
        hidden_size = 32,
    )
    r2_model.load_state_dict(r2_checkpoint)
    r2_model.eval()
    r2_scaler  = joblib.load(os.path.join(MODELS_DIR, "retail_stress_scaler_r2.pkl"))
    r2_seq_len = 10
    print("SUCCESS: R2 (Retail LSTM Liquidity) loaded")
except Exception as e:
    print(f"ERROR: R2 failed: {e}")
    r2_model   = None
    r2_scaler  = None
    r2_seq_len = 10

# ── Retail: R3 Isolation Forest Fraud ─────────
try:
    r3_saved    = joblib.load(os.path.join(MODELS_DIR, "retail_fraud_r3.pkl"))
    r3_model    = r3_saved["model"]
    r3_features = r3_saved["features"]
    r3_scaler   = joblib.load(os.path.join(MODELS_DIR, "retail_fraud_scaler_r3.pkl"))
    print("SUCCESS: R3 (Retail Isolation Forest Fraud) loaded")
except Exception as e:
    print(f"ERROR: R3 failed: {e}")
    r3_model    = None
    r3_features = None
    r3_scaler   = None

# ── Retail: R1 Column Schema ──────────────────
try:
    header_df = pd.read_csv(
        os.path.join(DATASET_PATH, "retail_loans.csv"), nrows=0
    )
    header_df.columns = [re.sub(r"[^A-Za-z0-9_]+", "_", col) for col in header_df.columns]
    header_df = header_df.drop(columns=["SK_ID_CURR", "TARGET"], errors="ignore")
    R1_EXPECTED_COLS = list(header_df.columns)
    print(f"SUCCESS: R1 column schema loaded ({len(R1_EXPECTED_COLS)} cols)")
except Exception as e:
    print(f"ERROR: R1 column schema failed: {e}")
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
    # Core financial (M1/M3)
    annual_income: float = 500000.0
    loan_amount: float = 100000.0
    installment: float = 5000.0
    dti: float = 0.3
    int_rate: float = 0.12
    revol_util: float = 0.30
    # Credit behaviour (M1)
    inquiries_last_12m: int = 1
    delinq_2y: int = 0
    # SBA / Business (M3)
    term: int = 36
    no_emp: int = 5
    new_exist: int = 1
    create_job: int = 0
    retained_job: int = 0
    urban_rural: int = 1
    disbursement_gross: float = 50000.0
    gr_appv: float = 50000.0
    sba_appv: float = 40000.0
    real_estate: int = 0
    portion: float = 0.8
    # Transaction (M2)
    amt: float = 500.0
    category: str = "food_dining"
    gender: str = "M"
    lat: float = 40.0
    long: float = -74.0
    city_pop: int = 100000
    unix_time: int = 1600000000
    merch_lat: float = 40.1
    merch_long: float = -74.1


class RetailInput(BaseModel):
    customer_id: str = "RETAIL-001"

    # R1 fields (Home Credit)
    AMT_INCOME_TOTAL: float
    AMT_CREDIT: float
    AMT_ANNUITY: float
    AMT_GOODS_PRICE: Optional[float] = None
    REGION_POPULATION_RELATIVE: float = 0.02
    DAYS_BIRTH: int
    DAYS_EMPLOYED: int
    EXT_SOURCE_2: Optional[float] = 0.5
    EXT_SOURCE_3: Optional[float] = 0.5

    # R2 fields (Liquidity series)
    adj_close_history: Optional[List[float]] = None

    # R3 fields (Fraud latest)
    # Uses same transaction fields as M2

# ──────────────────────────────────────────────
# ENDPOINT: MSME
# ──────────────────────────────────────────────
@app.post("/predict/msme", summary="Vitt Chetak Index for MSME borrowers")
def predict_msme(data: MSMEInput):
    try:
        raw = data.dict()
        # ── M1: Probability of Default ────────────
        if m1_health:
            m1_df = pd.DataFrame([{
                "loan_amount": raw["loan_amount"],
                "int_rate": raw["int_rate"],
                "installment": raw["installment"],
                "annual_income": raw["annual_income"],
                "debt_to_income": raw["dti"],
                "revol_util": raw["revol_util"],
                "loan_to_income": raw["loan_amount"] / (raw["annual_income"] + 1),
                "installment_to_income": raw["installment"] / (raw["annual_income"] + 1),
                "homeownership_MORTGAGE": 0,
                "homeownership_NONE": 0,
                "homeownership_OTHER": 0,
                "homeownership_OWN": 0,
                "homeownership_RENT": 1,
            }])
            prob_default = float(m1_health.predict_proba(m1_df)[0][1])
        else:
            prob_default = 0.5

        # ── M2: Probability of Fraud ──────────────
        if m2_fraud:
            m2_df = pd.DataFrame([{
                "amt": raw["amt"], "category": raw["category"], "gender": raw["gender"],
                "lat": raw["lat"], "long": raw["long"], "city_pop": raw["city_pop"],
                "unix_time": raw["unix_time"], "merch_lat": raw["merch_lat"], "merch_long": raw["merch_long"]
            }])
            m2_df = pd.get_dummies(m2_df, columns=["category", "gender"])
            for col in m2_fraud.feature_names_in_:
                if col not in m2_df.columns: m2_df[col] = 0
            m2_df = m2_df[m2_fraud.feature_names_in_]
            prob_fraud = float(m2_fraud.predict_proba(m2_df)[0][1])
        else:
            prob_fraud = 0.1

        # ── M3: Probability of Growth ─────────────
        if m3_revenue:
            m3_df = pd.DataFrame([[
                raw["term"], raw["no_emp"], raw["new_exist"], raw["create_job"],
                raw["retained_job"], raw["urban_rural"], raw["disbursement_gross"],
                raw["gr_appv"], raw["sba_appv"], raw["real_estate"], raw["portion"]
            ]], columns=["Term", "NoEmp", "NewExist", "CreateJob", "RetainedJob", "UrbanRural",
                         "DisbursementGross", "GrAppv", "SBA_Appv", "RealEstate", "Portion"])
            prob_sba_default = float(m3_revenue.predict_proba(m3_df)[0][1])
            prob_growth = 1 - prob_sba_default
        else:
            prob_growth = 0.5

        # ── Vitt Chetak Index Calculation ──────────
        health_score = (1 - prob_default) * 40
        safety_score = (1 - prob_fraud) * 30
        growth_score = prob_growth * 30
        total_index = round(health_score + safety_score + growth_score, 2)
        status = "Green" if total_index > 70 else "Amber" if total_index > 40 else "Red"

        return {
            "type": "MSME",
            "vitt_chetak_index": total_index,
            "status": status,
            "breakdown": {
                "credit_health": round(health_score, 2),
                "safety_shield": round(safety_score, 2),
                "growth_potential": round(growth_score, 2)
            }
        }
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/retail", summary="Vitt Chetak Score for Retail borrowers")
def predict_retail(data: RetailInput):
    try:
        results = {}
        # ── R1: EMI Default Risk ──────────────────
        if r1_model:
            r1_row = {
                "EXT_SOURCE_2": data.EXT_SOURCE_2 or 0.5,
                "AMT_INCOME_TOTAL": data.AMT_INCOME_TOTAL,
                "AMT_CREDIT": data.AMT_CREDIT,
                "DAYS_BIRTH": data.DAYS_BIRTH,
                "REGION_POPULATION_RELATIVE": data.REGION_POPULATION_RELATIVE,
                "EXT_SOURCE_3": data.EXT_SOURCE_3 or 0.5,
                "AMT_GOODS_PRICE": data.AMT_GOODS_PRICE or data.AMT_CREDIT,
                "DAYS_EMPLOYED": data.DAYS_EMPLOYED,
                "AMT_ANNUITY": data.AMT_ANNUITY,
            }
            r1_df = pd.DataFrame([r1_row])
            default_risk = max(0, min(1, float(r1_model.predict(r1_df)[0])))
            results["r1"] = {"default_risk": round(default_risk, 2)}
        else:
            results["r1"] = {"default_risk": 0.5}

        # ── R2: Liquidity Stress ──────────────────
        if r2_model and r2_scaler and data.adj_close_history:
            history = np.array(data.adj_close_history, dtype=np.float32).reshape(-1, 1)
            if len(history) >= 10: history = history[-10:]
            else: history = np.vstack([np.zeros((10 - len(history), 1), dtype=np.float32), history])
            history_scaled = r2_scaler.transform(history)
            history_tensor = torch.tensor(history_scaled, dtype=torch.float32).unsqueeze(0)
            with torch.no_grad(): stress_score = float(r2_model(history_tensor).item())
            results["r2"] = {"liquidity_stress": round(stress_score, 2)}
        else:
            results["r2"] = {"liquidity_stress": 0.2}

        # ── R3: Fraud Detection ───────────────────
        if r3_model and r3_scaler:
            fv = np.array([[0,0,0,0,0,0,0]], dtype=np.float32) # Using placeholder for now
            X_scaled = r3_scaler.transform(fv)
            ascore = r3_model.decision_function(X_scaled)[0]
            fraud_prob = float(np.clip(1 - (ascore + 0.5), 0.0, 1.0))
            results["r3"] = {"fraud_prob": round(fraud_prob, 2)}
        else:
            results["r3"] = {"fraud_prob": 0.1}

        # ── Fusion Score ──────────────────────────
        combined_risk = (0.5 * results["r1"]["default_risk"]) + \
                        (0.3 * results["r2"]["liquidity_stress"]) + \
                        (0.2 * results["r3"]["fraud_prob"])
        final_score = round((1 - combined_risk) * 100)
        
        return {
            "type": "RETAIL",
            "customer_id": data.customer_id,
            "score": final_score,
            "risk_level": get_risk_level(final_score),
            "breakdown": results
        }
    except Exception as e:
        import traceback; traceback.print_exc()
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
    port = int(os.environ.get("ML_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)