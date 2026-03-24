"""
shap_service.py  –  SHAP Explainability Microservice
Port: 8001
Uses: model/model_pipeline.pkl + model/shap_explainer.pkl
"""

import os
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional

from utils.preprocess import preprocess_input, FEATURE_COLUMNS, FEATURE_LABELS
from utils.risk import get_verdict

app = FastAPI(
    title="Loan Eligibility SHAP Service",
    description="SHAP-based explainability for loan eligibility decisions",
    version="1.0.0",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

# ── Load artifacts ─────────────────────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")

try:
    pipeline  = joblib.load(os.path.join(MODEL_DIR, "model_pipeline.pkl"))
    explainer = joblib.load(os.path.join(MODEL_DIR, "shap_explainer.pkl"))
    print("✅ model_pipeline.pkl + shap_explainer.pkl loaded")
except FileNotFoundError as e:
    raise RuntimeError(f"Artifact not found: {e}")

# Get the feature names the pipeline actually produces after preprocessing
# (OHE expands categorical columns, so we need the post-transform names)
try:
    preprocessor   = pipeline.named_steps["preprocessor"]
    ohe            = preprocessor.named_transformers_["cat"]
    num_features   = preprocessor.transformers_[0][2]           # numeric col names
    cat_features_expanded = list(ohe.get_feature_names_out(
        preprocessor.transformers_[1][2]                        # categorical col names
    ))
    TRANSFORMED_FEATURE_NAMES = num_features + cat_features_expanded
except Exception:
    TRANSFORMED_FEATURE_NAMES = None   # fallback: use indices


# ── Schemas ────────────────────────────────────────────────────────────────────
class LoanInput(BaseModel):
    age:                      float = Field(..., ge=18, le=75)
    employment_type:          str
    city_tier:                str
    has_coapplicant:          int   = 0
    monthly_income:           float = Field(..., gt=0)
    credit_score:             float = Field(..., ge=300, le=900)
    total_existing_emi:       float = 0
    requested_loan_amount:    float = Field(..., gt=0)
    loan_tenure_months:       float = Field(..., gt=0)
    work_experience_years:    float = 0
    loan_type:                Optional[str] = None
    marital_status:           Optional[str] = None
    gender:                   Optional[str] = None
    residential_status:       Optional[str] = None
    payment_history:          Optional[str] = None
    dependents:               Optional[int] = None


class FeatureContribution(BaseModel):
    feature:    str
    label:      str
    shap_value: float
    direction:  str   # "positive" | "negative" | "neutral"
    magnitude:  str   # "high" | "medium" | "low"


class ExplanationResponse(BaseModel):
    verdict:           str
    summary:           str
    top_positive:      List[FeatureContribution]
    top_negative:      List[FeatureContribution]
    all_contributions: List[FeatureContribution]
    base_value:        float


# ── Helpers ────────────────────────────────────────────────────────────────────
def _magnitude(val: float, max_abs: float) -> str:
    if max_abs == 0: return "low"
    r = abs(val) / max_abs
    return "high" if r >= 0.6 else "medium" if r >= 0.25 else "low"

def _contribution(feature: str, shap_val: float, max_abs: float) -> FeatureContribution:
    return FeatureContribution(
        feature    = feature,
        label      = FEATURE_LABELS.get(feature, feature),
        shap_value = round(float(shap_val), 4),
        direction  = "positive" if shap_val > 0.001 else "negative" if shap_val < -0.001 else "neutral",
        magnitude  = _magnitude(shap_val, max_abs),
    )

def _summary(verdict: str, pos: list, neg: list) -> str:
    pl = [c.label for c in pos[:2]]
    nl = [c.label for c in neg[:2]]
    if verdict == "Approved":
        return ("Your application looks strong. "
                + (f"Key strengths: {' and '.join(pl)}. " if pl else "")
                + (f"Watch out for: {' and '.join(nl)}." if nl else ""))
    elif verdict == "Pending":
        return ("Your application is borderline. "
                + (f"Strengths: {' and '.join(pl)}. " if pl else "")
                + (f"Areas of concern: {' and '.join(nl)}." if nl else ""))
    else:
        return ("Your application did not meet the criteria. "
                + (f"Main concerns: {' and '.join(nl)}. " if nl else "")
                + (f"Positive factors: {' and '.join(pl)}." if pl else ""))


# ── Endpoints ──────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "shap-service", "port": 8001}

@app.post("/explain", response_model=ExplanationResponse)
def explain(data: LoanInput):
    try:
        raw = data.dict()
        df  = preprocess_input(raw)

        # Transform input through the preprocessor (same as pipeline does internally)
        preprocessor = pipeline.named_steps["preprocessor"]
        X_transformed = preprocessor.transform(df)

        # SHAP values on transformed input
        shap_values = explainer.shap_values(X_transformed)
        if isinstance(shap_values, list):
            sv = np.array(shap_values[1][0])
        else:
            sv = np.array(shap_values[0])

        base_value = float(
            explainer.expected_value
            if not isinstance(explainer.expected_value, (list, np.ndarray))
            else explainer.expected_value[1]
        )

        # Map SHAP values back to feature names
        feat_names = TRANSFORMED_FEATURE_NAMES or [f"feature_{i}" for i in range(len(sv))]

        # Collapse OHE features back to original categorical column name
        # e.g. "employment_type_Salaried" → "employment_type"
        collapsed: dict = {}
        for fname, sval in zip(feat_names, sv):
            # find original column name (everything before first underscore-split match)
            orig = fname
            for col in FEATURE_COLUMNS:
                if fname == col or fname.startswith(col + "_"):
                    orig = col
                    break
            collapsed[orig] = collapsed.get(orig, 0.0) + float(sval)

        prob    = float(pipeline.predict_proba(df)[0][1])
        score   = round(prob * 100, 2)
        verdict = get_verdict(score)

        max_abs = max(abs(v) for v in collapsed.values()) or 1.0
        contribs = [_contribution(k, v, max_abs) for k, v in collapsed.items()]
        contribs.sort(key=lambda c: abs(c.shap_value), reverse=True)

        top_pos = [c for c in contribs if c.direction == "positive"][:5]
        top_neg = [c for c in contribs if c.direction == "negative"][:5]

        return ExplanationResponse(
            verdict           = verdict,
            summary           = _summary(verdict, top_pos, top_neg),
            top_positive      = top_pos,
            top_negative      = top_neg,
            all_contributions = contribs,
            base_value        = round(base_value, 4),
        )

    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))