"""
train_r2.py  -  R2 Liquidity Stress Forecaster (LSTM with PyTorch)
-------------------------------------------------------------------
Fixed version - no data leakage.
Label is created from last 3 instalments BEFORE those instalments
are included in the input sequence. Input uses instalments BEFORE
the last 3, so the model genuinely predicts future stress.
"""

import os
import gc
import numpy as np
import pandas as pd
import joblib
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score

os.environ['OMP_NUM_THREADS'] = '2'
torch.set_num_threads(2)

# ──────────────────────────────────────────────
# 1. Load data
# ──────────────────────────────────────────────
CSV_PATH    = r"D:\vitt-chetak-dataset\installments_payments.csv"
MODEL_PATH  = r"D:\vitt-chetak-dataset\r2_lstm_model.pt"
SCALER_PATH = r"D:\vitt-chetak-dataset\r2_scaler.pkl"

print("[INFO] Loading data ...")
df = pd.read_csv(CSV_PATH)
print(f"[INFO] Shape: {df.shape}")

# ──────────────────────────────────────────────
# 2. Feature Engineering (on raw data before scaling)
# ──────────────────────────────────────────────
print("\n[INFO] Engineering features ...")
df['PAYMENT_DELAY'] = df['DAYS_ENTRY_PAYMENT'] - df['DAYS_INSTALMENT']
df['PAYMENT_RATIO'] = df['AMT_PAYMENT'] / df['AMT_INSTALMENT'].replace(0, 1)
df['UNDERPAID']     = (df['AMT_PAYMENT'] < df['AMT_INSTALMENT']).astype(int)

df['PAYMENT_DELAY'] = df['PAYMENT_DELAY'].fillna(0)
df['PAYMENT_RATIO'] = df['PAYMENT_RATIO'].fillna(1)
df['UNDERPAID']     = df['UNDERPAID'].fillna(0)

# ──────────────────────────────────────────────
# 3. Sort
# ──────────────────────────────────────────────
df = df.sort_values(['SK_ID_CURR', 'NUM_INSTALMENT_NUMBER'])

# ──────────────────────────────────────────────
# 4. Build sequences - NO LEAKAGE
#    Input  = instalments BEFORE last 3 (history)
#    Label  = did customer underpay in last 3 instalments?
# ──────────────────────────────────────────────
print("[INFO] Building per-customer sequences (leak-free) ...")

FEATURES = ['PAYMENT_DELAY', 'PAYMENT_RATIO']   # removed UNDERPAID from features
SEQ_LEN  = 10

sequences = []
labels    = []

for cust_id, group in df.groupby('SK_ID_CURR'):
    # Need at least 5 rows: 2 history + 3 label window
    if len(group) < 5:
        continue

    # Label from last 3 instalments (future window)
    last3_underpaid = group['UNDERPAID'].iloc[-3:].values
    label = 1 if last3_underpaid.sum() > 0 else 0

    # Input from everything BEFORE last 3 (history window)
    history = group[FEATURES].iloc[:-3].values

    # Pad or truncate to SEQ_LEN
    if len(history) >= SEQ_LEN:
        history = history[-SEQ_LEN:]
    else:
        pad     = np.zeros((SEQ_LEN - len(history), len(FEATURES)))
        history = np.vstack([pad, history])

    sequences.append(history)
    labels.append(label)

gc.collect()

X = np.array(sequences, dtype=np.float32)
y = np.array(labels,    dtype=np.float32)

print(f"[INFO] Total customers : {len(X)}")
print(f"[INFO] Stressed (1)    : {int(y.sum())} | Healthy (0): {int((y==0).sum())}")

# ──────────────────────────────────────────────
# 5. Scale features across all sequences
# ──────────────────────────────────────────────
N, T, F = X.shape
X_reshaped = X.reshape(-1, F)
scaler     = StandardScaler()
X_scaled   = scaler.fit_transform(X_reshaped).reshape(N, T, F).astype(np.float32)
joblib.dump(scaler, SCALER_PATH)
print(f"[INFO] Scaler saved to {SCALER_PATH}")

# ──────────────────────────────────────────────
# 6. Train/test split
# ──────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)
print(f"[INFO] Train: {X_train.shape} | Test: {X_test.shape}")

X_train_t = torch.tensor(X_train)
y_train_t = torch.tensor(y_train).unsqueeze(1)
X_test_t  = torch.tensor(X_test)

train_ds     = TensorDataset(X_train_t, y_train_t)
train_loader = DataLoader(train_ds, batch_size=512, shuffle=True)

# ──────────────────────────────────────────────
# 7. Define LSTM model
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

model     = LSTMStressModel(input_size=len(FEATURES))
criterion = nn.BCELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

print("\n[INFO] Model architecture:")
print(model)

# ──────────────────────────────────────────────
# 8. Train
# ──────────────────────────────────────────────
print("\n[INFO] Training LSTM ...")
EPOCHS = 10

for epoch in range(1, EPOCHS + 1):
    model.train()
    total_loss = 0

    for X_batch, y_batch in train_loader:
        optimizer.zero_grad()
        preds = model(X_batch)
        loss  = criterion(preds, y_batch)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()

    avg_loss = total_loss / len(train_loader)

    model.eval()
    with torch.no_grad():
        val_preds = model(X_test_t).squeeze().numpy()
    val_auc = roc_auc_score(y_test, val_preds)

    print(f"  Epoch {epoch:02d}/{EPOCHS} | Loss: {avg_loss:.4f} | Val AUC: {val_auc:.4f}")

gc.collect()

# ──────────────────────────────────────────────
# 9. Final evaluation
# ──────────────────────────────────────────────
model.eval()
with torch.no_grad():
    final_preds = model(X_test_t).squeeze().numpy()

final_auc = roc_auc_score(y_test, final_preds)

print(f"\n{'='*50}")
print(f"  Model    : LSTM (R2 Liquidity Stress) - PyTorch")
print(f"  Test AUC : {final_auc:.4f}")
print(f"{'='*50}")

# ──────────────────────────────────────────────
# 10. Save model
# ──────────────────────────────────────────────
torch.save({
    'model_state_dict' : model.state_dict(),
    'input_size'       : len(FEATURES),
    'hidden_size'      : 32,
    'seq_len'          : SEQ_LEN,
    'features'         : FEATURES,
}, MODEL_PATH)

print(f"\n[INFO] Model saved to : {MODEL_PATH}")
print(f"[INFO] Scaler saved to: {SCALER_PATH}")