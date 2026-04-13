from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np

app = FastAPI(title="Vitt Chetak API")

# Enable CORS so your React frontend can talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Load the Models (Ensure these paths match your folder structure)
try:
    m1_health = joblib.load('models/msme_health_m1.pkl')
    m2_fraud = joblib.load('models/msme_fraud_m2.pkl')
    m3_revenue = joblib.load('models/msme_revenue_m3.pkl')
    print("✅ All models loaded successfully!")
except Exception as e:
    print(f"❌ Error loading models: {e}")

# 2. Define the Input Schema (Matching your Frontend Form)
class MSMEInput(BaseModel):
    annual_income: float
    loan_amount: float
    installment: float
    dti: float
    inquiries_last_12m: int
    delinq_2y: int
    pub_rec: int
    order_count: int
    unique_days: int
    # Categorical fields
    homeownership: str  # e.g., 'RENT', 'MORTGAGE', 'OWN'
    region: str        # e.g., 'West', 'East', 'South', 'Central'

@app.post("/predict")
async def predict_score(data: MSMEInput):
    try:
        # Convert input to a dictionary
        raw_data = data.dict()
        
        # --- FEATURE ENGINEERING (Same as training) ---
        # For M1 (Credit)
        loan_to_income = raw_data['loan_amount'] / (raw_data['annual_income'] + 1)
        risk_index = raw_data['inquiries_last_12m'] + raw_data['pub_rec'] + raw_data['delinq_2y']
        
        # For M3 (Revenue)
        orders_per_day = raw_data['order_count'] / (raw_data['unique_days'] + 1)

        # 3. Get Probabilities
        # We simulate the input rows for the models
        # Note: You may need to align your columns exactly as they were in training (One-Hot Encoding)
        
        # M1: Probability of Default
        prob_default = m1_health.predict_proba(pd.DataFrame([[
            raw_data['annual_income'], raw_data['dti'], raw_data['loan_amount'], 
            raw_data['installment'], raw_data['inquiries_last_12m'], 
            raw_data['delinq_2y'], loan_to_income, risk_index
        ]], columns=['annual_income', 'debt_to_income', 'loan_amount', 'installment', 'inquiries_last_12m', 'delinq_2y', 'loan_to_income', 'risk_score_index']))[0][1]

        # M2: Probability of Fraud (Using basic financial flags)
        prob_fraud = m2_fraud.predict_proba(pd.DataFrame([[
            raw_data['loan_amount'], raw_data['annual_income'], 0, 0, 0
        ]], columns=['amount', 'oldbalanceOrg', 'newbalanceOrig', 'oldbalanceDest', 'newbalanceDest']))[0][1]

        # M3: Probability of High Growth
        prob_growth = m3_revenue.predict_proba(pd.DataFrame([[
            raw_data['order_count'], raw_data['unique_days'], orders_per_day
        ]], columns=['order_count', 'unique_days', 'orders_per_day']))[0][1]

        # --- THE VITT CHETAK INDEX CALCULATION ---
        # Health (M1): High default risk lowers this
        health_score = (1 - prob_default) * 40
        # Safety (M2): High fraud risk lowers this
        safety_score = (1 - prob_fraud) * 30
        # Growth (M3): High growth probability raises this
        growth_score = (prob_growth) * 30

        total_index = health_score + safety_score + growth_score

        return {
            "vitt_chetak_index": round(total_index, 2),
            "status": "Green" if total_index > 70 else "Amber" if total_index > 40 else "Red",
            "breakdown": {
                "credit_health": round(health_score, 2),
                "safety_shield": round(safety_score, 2),
                "growth_potential": round(growth_score, 2)
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)