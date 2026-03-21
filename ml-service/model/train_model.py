"""
model/train_model.py
Run from ml-service root:  python3 model/train_model.py
Saves: model.pkl  scaler.pkl  encoder.pkl  meta.json
"""

import sys, os, json
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report, confusion_matrix
from xgboost import XGBClassifier
import joblib

from utils.preprocess import CategoricalEncoder, FEATURE_COLUMNS, NUMERIC_COLUMNS, CATEGORICAL_COLUMNS

ROOT      = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_PATH = os.path.join(ROOT, "synthetic_loan_data.csv")
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

# ── 1. Load ────────────────────────────────────────────────────────────────────
print("📂 Loading data …")
df = pd.read_csv(DATA_PATH)
print(f"   Rows: {len(df)} | Approval rate: {df['eligible'].mean():.1%}")

# ── 2. Encode categoricals → encoder.pkl ──────────────────────────────────────
print("🔤 Fitting CategoricalEncoder …")
encoder  = CategoricalEncoder()
df_enc   = encoder.fit_transform_df(df)   # replaces string cols with ints in-place copy

# ── 3. Split X / y ─────────────────────────────────────────────────────────────
X = df_enc[FEATURE_COLUMNS].values
y = df_enc["eligible"].values

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ── 4. Scale → scaler.pkl ──────────────────────────────────────────────────────
print("📐 Fitting StandardScaler …")
scaler    = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s  = scaler.transform(X_test)

# ── 5. Train XGBoost ───────────────────────────────────────────────────────────
print("🚀 Training XGBoost …")
model = XGBClassifier(
    n_estimators=300, max_depth=6, learning_rate=0.05,
    subsample=0.8, colsample_bytree=0.8,
    eval_metric="logloss", random_state=42, n_jobs=-1,
)
model.fit(X_train_s, y_train, eval_set=[(X_test_s, y_test)], verbose=False)

# ── 6. Evaluate ────────────────────────────────────────────────────────────────
y_pred  = model.predict(X_test_s)
y_proba = model.predict_proba(X_test_s)[:, 1]
acc     = accuracy_score(y_test, y_pred)
auc     = roc_auc_score(y_test, y_proba)
cv      = cross_val_score(model, scaler.transform(X), y, cv=5, scoring="roc_auc")

print(f"\n📊 Results  |  Accuracy: {acc:.4f}  |  ROC-AUC: {auc:.4f}  |  CV AUC: {cv.mean():.4f} ± {cv.std():.4f}")
print(classification_report(y_test, y_pred, target_names=["Rejected", "Approved"]))
print("Confusion Matrix:\n", confusion_matrix(y_test, y_pred))

# ── 7. Save all artifacts ──────────────────────────────────────────────────────
joblib.dump(model,   os.path.join(MODEL_DIR, "model.pkl"))
joblib.dump(scaler,  os.path.join(MODEL_DIR, "scaler.pkl"))
joblib.dump(encoder, os.path.join(MODEL_DIR, "encoder.pkl"))

meta = {
    "model_type": "XGBClassifier", "version": "1.0.0",
    "feature_columns": FEATURE_COLUMNS, "numeric_columns": NUMERIC_COLUMNS,
    "categorical_columns": CATEGORICAL_COLUMNS, "n_features": len(FEATURE_COLUMNS),
    "trained_at": datetime.utcnow().isoformat() + "Z",
    "train_samples": int(len(X_train)), "test_samples": int(len(X_test)),
    "accuracy": round(float(acc), 4), "roc_auc": round(float(auc), 4),
    "cv_auc_mean": round(float(cv.mean()), 4), "cv_auc_std": round(float(cv.std()), 4),
}
with open(os.path.join(MODEL_DIR, "meta.json"), "w") as f:
    json.dump(meta, f, indent=2)

print("\n✅ Saved: model/model.pkl  model/scaler.pkl  model/encoder.pkl  model/meta.json")