"""
utils/preprocess.py
Converts raw API input → the exact 11-feature DataFrame
that model_pipeline.pkl expects.
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd

# ── Column lists ───────────────────────────────────────────────────────────────
NUMERIC_COLUMNS = [
    "age", "monthly_income", "employment_tenure_months", "credit_score",
    "total_existing_emi", "requested_loan_amount", "dti_ratio",
    "loan_to_income", "has_coapplicant",
]
CATEGORICAL_COLUMNS = ["employment_type", "city_tier"]
FEATURE_COLUMNS = NUMERIC_COLUMNS + CATEGORICAL_COLUMNS

# ── Valid enum values ──────────────────────────────────────────────────────────
VALID_EMPLOYMENT_TYPES = [
    "Salaried", "Self Employed", "Business Owner",
    "Freelancer", "Unemployed", "Retired", "Student",
]
VALID_CITY_TIERS = ["Metro", "Tier 1", "Tier 2", "Tier 3"]

# ── Human-readable labels for SHAP ────────────────────────────────────────────
FEATURE_LABELS = {
    "age":                      "Age",
    "monthly_income":           "Monthly Income (₹)",
    "employment_tenure_months": "Employment Tenure (months)",
    "credit_score":             "Credit Score",
    "total_existing_emi":       "Total Existing EMIs (₹/month)",
    "requested_loan_amount":    "Requested Loan Amount (₹)",
    "dti_ratio":                "Debt-to-Income Ratio",
    "loan_to_income":           "Loan-to-Income Ratio",
    "has_coapplicant":          "Has Co-applicant",
    "employment_type":          "Employment Type",
    "city_tier":                "City Tier",
}


# ── CategoricalEncoder ─────────────────────────────────────────────────────────
class CategoricalEncoder:
    """
    Label-encodes categorical columns (str → int) for sklearn/XGBoost pipelines.
    Persisted alongside model.pkl / scaler.pkl via joblib.

    Training
    --------
        encoder = CategoricalEncoder()
        df_enc  = encoder.fit_transform_df(df)
        joblib.dump(encoder, "encoder.pkl")

    Inference
    ---------
        encoder = joblib.load("encoder.pkl")
        df_enc  = encoder.transform_df(df)
    """

    def __init__(self, columns: Optional[List[str]] = None):
        # Explicit column list; falls back to CATEGORICAL_COLUMNS at fit time
        self.columns: List[str] = columns if columns is not None else []
        self.mappings: Dict[str, Dict[str, int]] = {}
        self._fitted: bool = False          # ← explicit flag, no empty-dict ambiguity

    # ── fit ───────────────────────────────────────────────────────────────────
    def fit(self, df: pd.DataFrame) -> "CategoricalEncoder":
        # Resolve which columns to encode
        if self.columns:
            cols = self.columns
        else:
            # Default: use the module-level CATEGORICAL_COLUMNS that exist in df
            cols = [c for c in CATEGORICAL_COLUMNS if c in df.columns]
            # Fallback: any remaining object-dtype columns
            if not cols:
                cols = [c for c in df.columns if df[c].dtype == object]

        self.columns = cols
        self.mappings = {}
        for col in cols:
            unique_vals = sorted(df[col].dropna().astype(str).unique().tolist())
            self.mappings[col] = {v: i for i, v in enumerate(unique_vals)}

        self._fitted = True
        return self

    # ── transform ─────────────────────────────────────────────────────────────
    def transform_df(self, df: pd.DataFrame) -> pd.DataFrame:
        """Return a copy of *df* with categorical columns replaced by ints."""
        if not self._fitted:
            raise RuntimeError(
                "CategoricalEncoder must be fitted before calling transform_df(). "
                "Call fit_transform_df() during training or load a saved encoder."
            )
        df = df.copy()
        for col, mapping in self.mappings.items():
            if col not in df.columns:
                continue
            # Unseen values → -1 so inference never crashes on new categories
            df[col] = df[col].astype(str).map(mapping).fillna(-1).astype(int)
        return df

    # ── convenience ───────────────────────────────────────────────────────────
    def fit_transform_df(self, df: pd.DataFrame) -> pd.DataFrame:
        self.fit(df)                # sets self._fitted = True and self.mappings
        return self.transform_df(df)

    # ── inverse (handy for debugging / SHAP labels) ───────────────────────────
    def inverse_transform(self, col: str, code: int) -> str:
        reverse = {v: k for k, v in self.mappings.get(col, {}).items()}
        return reverse.get(code, "unknown")


# ── preprocess_input ───────────────────────────────────────────────────────────
def preprocess_input(raw: Dict[str, Any]) -> pd.DataFrame:
    """
    Accepts raw API request body and returns a single-row DataFrame
    with the exact 11 columns the pipeline expects.
    """
    monthly_income  = float(raw.get("monthly_income", 1))
    loan_amount     = float(raw.get("requested_loan_amount",
                            raw.get("loan_amount", 0)))
    loan_tenure     = float(raw.get("loan_tenure_months", 1))
    existing_emi    = float(raw.get("total_existing_emi",
                            raw.get("existing_emis", 0)))
    work_exp_years  = float(raw.get("work_experience_years",
                            raw.get("employment_tenure_months", 0) / 12))
    has_coapplicant = int(bool(raw.get("has_coapplicant",
                               raw.get("co_applicant", 0))))

    projected_emi  = loan_amount / max(loan_tenure, 1)
    dti_ratio      = (existing_emi + projected_emi) / max(monthly_income, 1)
    loan_to_income = loan_amount / max(monthly_income * 12, 1)

    emp_type  = raw.get("employment_type", "Salaried")
    city_tier = raw.get("city_tier", "Metro")
    if emp_type  not in VALID_EMPLOYMENT_TYPES: emp_type  = "Salaried"
    if city_tier not in VALID_CITY_TIERS:       city_tier = "Metro"

    row = {
        "age":                      float(raw.get("age", 30)),
        "monthly_income":           monthly_income,
        "employment_tenure_months": work_exp_years * 12,
        "credit_score":             float(raw.get("credit_score", 650)),
        "total_existing_emi":       existing_emi,
        "requested_loan_amount":    loan_amount,
        "dti_ratio":                round(dti_ratio, 6),
        "loan_to_income":           round(loan_to_income, 6),
        "has_coapplicant":          has_coapplicant,
        "employment_type":          emp_type,
        "city_tier":                city_tier,
    }

    return pd.DataFrame([row], columns=FEATURE_COLUMNS)
