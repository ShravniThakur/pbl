"""
utils/risk.py
Score → risk category matching RISK_CATEGORY enum in enums.js:
["Very Low", "Low", "Medium", "High", "Very High"]
"""

def get_risk_category(risk_score: float) -> str:
    """risk_score = (1 - prob) * 100  →  higher means riskier"""
    if risk_score >= 75:   return "Very High"
    elif risk_score >= 55: return "High"
    elif risk_score >= 35: return "Medium"
    elif risk_score >= 20: return "Low"
    else:                  return "Very Low"

def get_verdict(score: float) -> str:
    """score = prob * 100  →  higher means more eligible"""
    if score >= 65:   return "Approved"
    elif score >= 45: return "Pending"
    else:             return "Rejected"

def get_confidence_label(probability: float) -> str:
    d = abs(probability - 0.5)
    if d >= 0.40:   return "Very High Confidence"
    elif d >= 0.25: return "High Confidence"
    elif d >= 0.12: return "Moderate Confidence"
    else:           return "Low Confidence"