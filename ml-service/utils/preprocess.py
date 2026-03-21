"""
utils/preprocess.py
Converts raw API input → the exact 11-feature DataFrame
that model_pipeline.pkl expects.

Pipeline internals (from inspection):
  Numeric  : age, monthly_income, employment_tenure_months, credit_score,
             total_existing_emi, requested_loan_amount, dti_ratio,
             loan_to_income, has_coapplicant
  Categorical: employment_type, city_tier
"""

from typing import Dict, Any
import numpy as np
import pandas as pd

# ── Column lists (must match pipeline exactly) ─────────────────────────────────
NUMERIC_COLUMNS = [
    "age",
    "monthly_income",
    "employment_tenure_months",
    "credit_score",
    "total_existing_emi",
    "requested_loan_amount",
    "dti_ratio",
    "loan_to_income",
    "has_coapplicant",
]

CATEGORICAL_COLUMNS = [
    "employment_type",
    "city_tier",
]

FEATURE_COLUMNS = NUMERIC_COLUMNS + CATEGORICAL_COLUMNS   # pipeline col order

# ── Valid enum values (from enums.js) ──────────────────────────────────────────
VALID_EMPLOYMENT_TYPES = [
    "Salaried", "Self Employed", "Business Owner",
    "Freelancer", "Unemployed", "Retired", "Student"
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


def preprocess_input(raw: Dict[str, Any]) -> pd.DataFrame:
    """
    Accepts raw API request body and returns a single-row DataFrame
    with the exact 11 columns the pipeline expects.

    Field mapping (frontend form → pipeline feature):
      loan_amount / requested_loan_amount → requested_loan_amount
      existing_emis / total_existing_emi  → total_existing_emi
      work_experience_years * 12          → employment_tenure_months
      co_applicant (bool/int)             → has_coapplicant
      dti = (total_existing_emi + projected_emi) / monthly_income → dti_ratio
      loan_to_income = loan_amount / (monthly_income * 12)        → loan_to_income
    """
    monthly_income   = float(raw.get("monthly_income", 1))
    loan_amount      = float(raw.get("requested_loan_amount",
                             raw.get("loan_amount", 0)))
    loan_tenure      = float(raw.get("loan_tenure_months", 1))
    existing_emi     = float(raw.get("total_existing_emi",
                             raw.get("existing_emis", 0)))
    work_exp_years   = float(raw.get("work_experience_years",
                             raw.get("employment_tenure_months", 0) / 12))
    has_coapplicant  = int(bool(raw.get("has_coapplicant",
                                raw.get("co_applicant", 0))))

    # Derived
    projected_emi  = loan_amount / max(loan_tenure, 1)
    dti_ratio      = (existing_emi + projected_emi) / max(monthly_income, 1)
    loan_to_income = loan_amount / max(monthly_income * 12, 1)

    # Categorical — default to safest value if unknown
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