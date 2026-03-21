import pandas as pd
import numpy as np

np.random.seed(42)
N = 5000

EMPLOYMENT_TYPE    = ["Salaried","Self Employed","Business Owner","Freelancer","Unemployed","Retired","Student"]
EMPLOYER_TYPE      = ["Government","Public Sector","Private MNC","Private Indian","Startup","NGO","Not Applicable"]
LOAN_TYPES         = ["Personal Loan","Education Loan","Home Loan","Vehicle Loan","Business Loan"]
CITY_TIER          = ["Metro","Tier 1","Tier 2","Tier 3"]
RESIDENTIAL_STATUS = ["Owned","Rented","Parental","Company Provided"]
PAYMENT_HISTORY    = ["Clean","Minor Delay","Major Delay","Serious Default"]
MARITAL_STATUS     = ["Single","Married","Widowed","Divorced"]
GENDER             = ["Male","Female","Other"]

payment_map  = {"Clean":0,"Minor Delay":1,"Major Delay":2,"Serious Default":3}
city_map     = {"Metro":0,"Tier 1":1,"Tier 2":2,"Tier 3":3}
res_map      = {"Owned":0,"Company Provided":1,"Parental":2,"Rented":3}
marital_map  = {"Single":0,"Married":1,"Widowed":2,"Divorced":2}
gender_map   = {"Male":0,"Female":1,"Other":2}
loan_type_map= {"Personal Loan":0,"Education Loan":1,"Home Loan":2,"Vehicle Loan":3,"Business Loan":4}
employer_map = {"Government":0,"Public Sector":0,"Private MNC":1,"Private Indian":1,"Startup":2,"NGO":2,"Not Applicable":3}
emp_risk_map = {"Salaried":0,"Retired":0,"Self Employed":1,"Business Owner":1,"Freelancer":2,"Student":2,"Unemployed":3}

age            = np.random.randint(21, 65, N)
monthly_income = np.random.choice([8000,15000,25000,40000,60000,90000,150000], N, p=[0.08,0.15,0.22,0.25,0.16,0.09,0.05])
loan_amount    = np.random.randint(50000, 3000000, N)
loan_tenure    = np.random.choice([12,24,36,48,60,84,120,180,240], N)
existing_emis  = np.random.choice([0,2000,5000,10000,20000,35000], N, p=[0.30,0.20,0.20,0.15,0.10,0.05])
credit_score   = np.clip(np.random.normal(700, 80, N).astype(int), 300, 900)
dependents     = np.random.randint(0, 5, N)
work_exp       = np.clip(np.random.normal(8, 5, N).astype(int), 0, 40)

employment_type    = np.random.choice(EMPLOYMENT_TYPE, N, p=[0.45,0.15,0.10,0.07,0.06,0.07,0.10])
employer_type      = np.random.choice(EMPLOYER_TYPE, N)
loan_type          = np.random.choice(LOAN_TYPES, N)
city_tier          = np.random.choice(CITY_TIER, N, p=[0.35,0.25,0.25,0.15])
residential_status = np.random.choice(RESIDENTIAL_STATUS, N)
payment_history    = np.random.choice(PAYMENT_HISTORY, N, p=[0.60,0.22,0.11,0.07])
marital_status     = np.random.choice(MARITAL_STATUS, N)
gender             = np.random.choice(GENDER, N, p=[0.52,0.46,0.02])

projected_emi        = loan_amount / np.maximum(loan_tenure, 1)
emi_to_income_ratio  = np.clip((existing_emis + projected_emi) / np.maximum(monthly_income, 1), 0, 5)
loan_to_income_ratio = np.clip(loan_amount / (monthly_income * 12), 0, 50)

score = np.zeros(N)
score += np.where(credit_score>=750,2.5, np.where(credit_score>=700,1.5, np.where(credit_score>=650,0.5, np.where(credit_score>=550,-0.5,-2.0))))
score += np.where(emi_to_income_ratio<=0.35,2.0, np.where(emi_to_income_ratio<=0.50,0.5, np.where(emi_to_income_ratio<=0.65,-0.5,-2.0)))
score += np.where(monthly_income>=60000,1.5, np.where(monthly_income>=30000,0.8, np.where(monthly_income>=15000,0.0,-0.8)))
score += np.array([payment_map[p]*-1.0 for p in payment_history])
score += np.array([emp_risk_map.get(e,1)*-0.4 for e in employment_type])
score += np.where(work_exp>=5,0.5, np.where(work_exp>=2,0.0,-0.3))
score += np.where((age>=25)&(age<=55),0.3,-0.2)
score += np.where(loan_to_income_ratio<=3,0.5, np.where(loan_to_income_ratio<=6,0.0,-0.5))
noise   = np.random.normal(0, 0.4, N)
eligible = ((score + noise) > 1.5).astype(int)

df = pd.DataFrame({
    "age": age, "monthly_income": monthly_income, "loan_amount": loan_amount,
    "loan_tenure_months": loan_tenure, "existing_emis": existing_emis,
    "credit_score": credit_score, "dependents": dependents,
    "work_experience_years": work_exp,
    "emi_to_income_ratio": emi_to_income_ratio.round(4),
    "loan_to_income_ratio": loan_to_income_ratio.round(4),
    "employment_type": employment_type, "employer_type": employer_type,
    "loan_type": loan_type, "city_tier": city_tier,
    "residential_status": residential_status, "payment_history": payment_history,
    "marital_status": marital_status, "gender": gender,
    "eligible": eligible,
})

df.to_csv("synthetic_loan_data.csv", index=False)
print(f"✅ Generated {N} rows → synthetic_loan_data.csv")
print(f"   Approval rate: {eligible.mean():.1%}")
print(f"   Columns: {list(df.columns)}")
