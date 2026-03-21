"""
utils/risk.py
Score → risk category matching RISK_CATEGORY enum in enums.js:
["Very Low", "Low", "Medium", "High", "Very High"]
"""

def get_risk_category(score: float) -> str:
    if score >= 80:   return "Very Low"
    elif score >= 65: return "Low"
    elif score >= 45: return "Medium"
    elif score >= 25: return "High"
    else:             return "Very High"

def get_verdict(score: float) -> str:
    if score >= 65:   return "Approved"
    elif score >= 45: return "Pending"
    else:             return "Rejected"

def get_confidence_label(probability: float) -> str:
    d = abs(probability - 0.5)
    if d >= 0.40:   return "Very High Confidence"
    elif d >= 0.25: return "High Confidence"
    elif d >= 0.12: return "Moderate Confidence"
    else:           return "Low Confidence"