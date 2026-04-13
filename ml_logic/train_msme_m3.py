import pandas as pd
import xgboost as xgb
import joblib
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

# 1. Load Data
print("⏳ Loading M3 (Revenue) Dataset...")
df = pd.read_csv('m3.csv', encoding='latin1')
df.columns = df.columns.str.strip()

# 2. DYNAMIC COLUMN MAPPING
col_map = {}
for target, keywords in {
    'Sales': ['Sales', 'Revenue'],
    'Order Date': ['Order Date', 'Date'],
    'Customer ID': ['Customer ID', 'Cust ID'],
    'Segment': ['Segment'],
    'Region': ['Region'],
    'Category': ['Category']
}.items():
    match = [c for c in df.columns if any(k in c for k in keywords)]
    if match:
        col_map[target] = match[0]
    else:
        if target in ['Sales', 'Customer ID', 'Order Date']:
            raise KeyError(f"❌ Missing critical column: {target}")

# 3. FEATURE ENGINEERING (Strictly Behavioral - No Sale Amounts!)
# We use Count and Frequency to predict "Scale"
customer_data = df.groupby(col_map['Customer ID']).agg({
    col_map['Sales']: ['count'],                # Transaction volume
    col_map['Order Date']: ['nunique']          # Consistency of business
})

# Flatten names and create a 'Frequency' feature
customer_data.columns = ['order_count', 'unique_days']
customer_data['orders_per_day'] = customer_data['order_count'] / customer_data['unique_days']

# 4. CREATE TARGET (The 'Answer Key' we keep hidden from the model)
target_logic = df.groupby(col_map['Customer ID'])[col_map['Sales']].sum()
sales_median = target_logic.median()
customer_data['target'] = (target_logic > sales_median).astype(int)

# 5. Prepare Features (Removing all direct monetary signals)
existing_cats = [col_map[c] for c in ['Segment', 'Region', 'Category'] if c in col_map]
segments = df.groupby(col_map['Customer ID'])[existing_cats].first()

# X only contains: order_count, unique_days, orders_per_day, and Categories
X_raw = customer_data.drop('target', axis=1).join(segments)
X = pd.get_dummies(X_raw, columns=existing_cats, drop_first=True)
y = customer_data['target']

# 6. Split 
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# 7. Train a Balanced Model
print("🧠 Training Real-World Revenue Model (M3)...")
m3 = xgb.XGBClassifier(
    n_estimators=100, 
    max_depth=4, 
    learning_rate=0.1, 
    eval_metric='auc',
    use_label_encoder=False
)
m3.fit(X_train, y_train)

# 8. Save
joblib.dump(m3, 'msme_revenue_m3.pkl')
print("✅ Success! Model M3 saved as msme_revenue_m3.pkl")

# 9. Evaluation
y_probs = m3.predict_proba(X_test)[:, 1]
auc = roc_auc_score(y_test, y_probs)
print(f"📈 Final 'Honest' Model 3 AUC Score: {auc:.4f}")