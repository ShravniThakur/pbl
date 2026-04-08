# 🏦 LoanSense — AI-Powered Loan Eligibility Advisor

> An intelligent loan eligibility assessment platform combining rule-based decision engines, XGBoost ML scoring, SHAP explainability, blockchain-anchored audit trails, and a curated loan product recommendation engine — built as a full-stack MERN + Python microservices project.

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| Frontend (Vercel) | [https://loansense-app.vercel.app](https://loansense-app.vercel.app) |
| Backend API (Render) | deployed on Render |
| ML Services (Render) | deployed on Render |

---

## 📌 What It Does

LoanSense helps users understand their loan eligibility **before** they apply to a bank. Instead of a black-box yes/no, it gives:

- ✅ **Rule-based hard eligibility checks** (FOIR, LTV, credit score thresholds)
- 🤖 **ML-based probability scoring** (XGBoost trained on synthetic financial data)
- 🔍 **SHAP explainability** — "Why was I approved/rejected?" with top contributing factors
- 📊 **Approved loan offer** — max amount, tenure, interest rate, EMI
- ⛓️ **Blockchain audit trail** — every decision pinned to IPFS and anchored on Ethereum Sepolia
- 🏦 **Loan product recommendations** — top 3 real-lender products matched to the user's approved offer
- 🛍️ **Loan product browser** — users can browse all available products by type and lender
- 🔐 **Admin portal** — admins can create, edit, activate/deactivate and delete loan products

Supports 5 loan types: Personal, Home, Education, Vehicle, Business.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│              (Vite + Tailwind, port 5556)                │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API
┌───────────────────────▼─────────────────────────────────┐
│              Node.js / Express Backend                   │
│               (MongoDB, port 5000)                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Rule Engine → ML Service → SHAP Service        │    │
│  │  → Recommendation Engine                        │    │
│  │  → Blockchain Service (IPFS + Sepolia)          │    │
│  └──────┬──────────────────┬───────────────────────┘    │
└─────────┼──────────────────┼────────────────────────────┘
          │                  │
┌─────────▼──────┐  ┌────────▼───────┐
│   ML Service   │  │  SHAP Service  │
│  FastAPI :8000 │  │  FastAPI :8001 │
│   XGBoost      │  │ TreeExplainer  │
└────────────────┘  └────────────────┘
```

---

## 🗂️ Project Structure

```
pbl/
├── frontend/                   # React + Vite + Tailwind
│   └── src/
│       ├── components/
│       │   ├── BlockchainVerifier.jsx  ← verify tx on Etherscan
│       │   ├── RecommendedProducts.jsx ← top 3 matched products on result page
│       │   ├── Sidebar.jsx
│       │   ├── Navbar.jsx
│       │   ├── ProtectedRoutes.jsx
│       │   └── PublicRoutes.jsx
│       ├── pages/
│       │   ├── Landing.jsx
│       │   ├── Login.jsx
│       │   ├── Signup.jsx
│       │   ├── Dashboard.jsx
│       │   ├── FinancialProfile.jsx
│       │   ├── LoanCheck.jsx           ← multi-step loan form
│       │   ├── LoanDetail.jsx          ← results + SHAP viz + blockchain + recommendations
│       │   ├── LoanProducts.jsx        ← browse all loan products
│       │   ├── LoanHistory.jsx
│       │   ├── Settings.jsx
│       │   ├── AdminLogin.jsx          ← admin-only login
│       │   └── AdminDashboard.jsx      ← loan product CRUD
│       ├── context/AppContext.jsx
│       └── utils/enums.js
│
├── backend/                    # Node.js + Express + MongoDB
│   ├── config/
│   │   ├── mongodb.js
│   │   └── cloudinary.js
│   ├── controllers/
│   │   ├── user_controller.js
│   │   ├── loanEligibilityCheckController.js
│   │   ├── financialProfile_controller.js
│   │   ├── loanProductController.js    ← CRUD for loan products
│   │   └── adminController.js          ← admin login
│   ├── models/
│   │   ├── User.js
│   │   ├── FinancialProfile.js
│   │   ├── LoanEligibilityCheck.js     ← now includes recommendedProducts snapshot
│   │   └── LoanProduct.js              ← lender product catalogue
│   ├── routes/
│   │   ├── user_routes.js
│   │   ├── financialProfile_routes.js
│   │   ├── loanEligibilityCheck_routes.js
│   │   ├── loanProduct_routes.js       ← public GET + admin-protected POST/PUT/DELETE
│   │   └── admin_routes.js             ← POST /api/admin/login
│   ├── services/
│   │   ├── user_service.js
│   │   ├── loanEligibilityService.js   ← rule engine + ML + recommendation engine
│   │   ├── financialProfile_service.js
│   │   ├── loanProductService.js       ← CRUD + recommendation scoring
│   │   ├── adminService.js             ← env-credential auth + JWT + requireAdmin middleware
│   │   ├── mlservice.js                ← calls ML + SHAP microservices
│   │   └── blockchainservice.js        ← IPFS (Pinata) + Ethereum Sepolia
│   ├── validators/
│   ├── middlewares/
│   ├── constants/enums.js
│   └── server.js
│
└── ml-service/                 # Python FastAPI microservices
    ├── model/
    │   ├── train_model.py
    │   ├── model.pkl               ← trained XGBoost classifier
    │   ├── encoder.pkl             ← CategoricalEncoder (str → int)
    │   ├── scaler.pkl              ← StandardScaler
    │   └── shap_explainer.pkl      ← TreeExplainer
    ├── utils/
    │   ├── preprocess.py           ← feature engineering
    │   └── risk.py                 ← score → risk category
    ├── main.py                     ← /predict endpoint (port 8000)
    ├── shap_service.py             ← /explain endpoint (port 8001)
    ├── generate_synthetic_data.py
    └── requirements.txt
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- Python 3.10+
- MongoDB 7.0+

---

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd pbl
```

---

### 2. Set up the ML service

#### macOS
```bash
cd ml-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Windows
```bash
cd ml-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

If you need to retrain the model:
```bash
# macOS
python3 generate_synthetic_data.py
python3 model/train_model.py

# Windows
python generate_synthetic_data.py
python model/train_model.py
```

> ⚠️ Retraining regenerates `model.pkl`, `encoder.pkl`, `scaler.pkl`, and `shap_explainer.pkl` inside `ml-service/model/`. All four files must be present for the services to start.

---

### 3. Set up the backend

```bash
cd backend
npm install
```

Copy the example env file and fill in your personal values:
```bash
# macOS
cp .env.example .env

# Windows
copy .env.example .env
```

Your final `backend/.env` should look like this:
```env
PORT=5000
MONGODB_URL=mongodb://localhost:27017/loan_eligibility
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5556
ML_SERVICE_URL=http://localhost:8000
SHAP_SERVICE_URL=http://localhost:8001

# Admin portal credentials (no database entry — validated at runtime)
ADMIN_EMAIL=admin@loansense.com
ADMIN_PASSWORD=your_admin_password_here
ADMIN_JWT_SECRET=a_separate_secret_for_admin_tokens

# Blockchain — Pinata (IPFS)
# Get your free JWT at https://app.pinata.cloud → API Keys
PINATA_JWT=your_pinata_jwt_here

# Blockchain — Ethereum Sepolia
# Generate a wallet and get test ETH from https://faucet.sepolia.dev
PRIVATE_KEY=your_wallet_private_key_here
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
CONTRACT_ADDRESS=0xa09d5BeF09bBB5ADC2CC4342ea74f1E21eE71314
```

> ⚠️ `CONTRACT_ADDRESS` and `RPC_URL` are the same for all team members — do not change them. Each team member must supply their own `PRIVATE_KEY` and `PINATA_JWT`. Never commit any of these to version control.

#### Setting up your Sepolia wallet (first time only)

1. Install [MetaMask](https://metamask.io) and create a new wallet, or generate one in Node:
   ```js
   const { ethers } = require("ethers");
   const wallet = ethers.Wallet.createRandom();
   console.log("Address:", wallet.address);
   console.log("Private Key:", wallet.privateKey);
   ```
2. Get free test ETH from the [Sepolia faucet](https://faucet.sepolia.dev) using your wallet address
3. Paste the private key into `PRIVATE_KEY` in your `.env`

#### Setting up your Pinata JWT (first time only)

1. Sign up for free at [app.pinata.cloud](https://app.pinata.cloud)
2. Go to **API Keys** → **New Key** → enable `pinFileToIPFS` → generate
3. Paste the JWT into `PINATA_JWT` in your `.env`

#### Seeding loan products (first time only)

Connect to your MongoDB shell and run the seed script to populate the product catalogue:

```bash
mongosh loan_eligibility
```

Then paste the `db.loanproducts.insertMany([...])` seed data (15 products across all 5 loan types — included separately).

---

### 4. Set up the frontend

```bash
cd frontend
npm install --legacy-peer-deps
```

Create `frontend/.env`:
```env
VITE_BACKEND_URL=http://localhost:5000
```

---

### 5. Run everything

Open **5 terminals** and run each command from the root `pbl/` folder:

#### macOS

```bash
# Terminal 1 — MongoDB
sudo systemctl start mongod

# Terminal 2 — Backend
cd backend && npm run server

# Terminal 3 — ML Service
cd ml-service && source venv/bin/activate && uvicorn main:app --reload --port 8000

# Terminal 4 — SHAP Service
cd ml-service && source venv/bin/activate && uvicorn shap_service:app --reload --port 8001

# Terminal 5 — Frontend
cd frontend && npm run dev
```

#### Windows

```bash
# Terminal 1 — MongoDB (run as Administrator)
net start MongoDB

# Terminal 2 — Backend
cd backend && npm run server

# Terminal 3 — ML Service
cd ml-service && venv\Scripts\activate && uvicorn main:app --reload --port 8000

# Terminal 4 — SHAP Service
cd ml-service && venv\Scripts\activate && uvicorn shap_service:app --reload --port 8001

# Terminal 5 — Frontend
cd frontend && npm run dev
```

Open **http://localhost:5556** in your browser.
Admin portal is at **http://localhost:5556/admin/login**.

---

## 🔌 API Reference

### User & Auth (port 5000)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/user/sign-up` | ❌ | Register new user |
| POST | `/user/login` | ❌ | Login, returns JWT |
| GET | `/user/profile` | ✅ | Get user profile |
| PATCH | `/user/profile` | ✅ | Update profile / photo |
| PATCH | `/user/change-password` | ✅ | Change password |
| DELETE | `/user/account` | ✅ | Delete account |

### Financial Profile

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/financial-profile` | ✅ | Create financial profile |
| GET | `/financial-profile` | ✅ | Get financial profile |
| PATCH | `/financial-profile` | ✅ | Update financial profile |
| DELETE | `/financial-profile` | ✅ | Delete financial profile |

### Loan Eligibility

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/loan-eligibility` | ✅ | Run eligibility check (triggers ML + SHAP + blockchain + recommendations) |
| GET | `/loan-eligibility` | ✅ | Get all past checks |
| GET | `/loan-eligibility/:id` | ✅ | Get single check with full results |
| GET | `/api/verify-loan/:id` | ❌ | Verify blockchain record for a check |

### Loan Products (Public)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/loan-products` | ❌ | All active products (optional `?loanType=`) |
| GET | `/api/loan-products/:id` | ❌ | Single product |

### Loan Products (Admin)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/admin/login` | ❌ | Admin login, returns admin JWT |
| GET | `/api/loan-products/admin/all` | 🔐 Admin | All products including inactive |
| POST | `/api/loan-products/admin` | 🔐 Admin | Create product |
| PUT | `/api/loan-products/admin/:id` | 🔐 Admin | Update product |
| DELETE | `/api/loan-products/admin/:id` | 🔐 Admin | Delete product |

### ML Service (port 8000)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/predict` | Returns score, probability, risk, verdict |
| GET | `/health` | Liveness check |
| GET | `/model-info` | Model metadata |

### SHAP Service (port 8001)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/explain` | Returns SHAP feature contributions |
| GET | `/health` | Liveness check |

---

## 🏦 Loan Product Recommendations

After every **eligible** loan check, the recommendation engine runs automatically and returns the top 3 most suitable products from the catalogue.

### How matching works

**Hard filters** (all must pass):
- `loanType` matches the check
- `minAmount ≤ approvedAmount ≤ maxAmount`
- `minCreditScore ≤ user creditScore`
- `minMonthlyIncome ≤ user monthlyNetIncome`
- `isActive === true`

**Fit score** (0–100) is computed from three weighted factors:

| Factor | Weight | Logic |
|--------|--------|-------|
| Rate fit | 50% | Lower `minInterestRate` relative to other candidates scores higher |
| Amount fit | 30% | Product range centered on the approved amount scores higher |
| Tenure flex | 20% | More headroom above the approved tenure scores higher |

Products are sorted by fit score and the top 3 are **snapshotted** onto the `LoanEligibilityCheck` document — so recommendations are frozen at check time and never change even if products are later edited or deleted.

---

## 🔐 Admin Portal

The admin portal lives at `/admin/login` and is completely isolated from the user authentication system — it uses a separate JWT secret and reads credentials from environment variables only (no admin collection in the database).

**Admin capabilities:**
- Create loan products with full details (lender info, rate/amount/tenure ranges, eligibility criteria, features)
- Edit any product
- Toggle active/inactive status (inactive products are hidden from users and excluded from recommendations)
- Delete products

Admin sessions do not interfere with user sessions.

---

## 🤖 ML Pipeline

### Features used (11 total)

| Feature | Type |
|---------|------|
| age | Numeric |
| monthly_income | Numeric |
| employment_tenure_months | Numeric |
| credit_score | Numeric |
| total_existing_emi | Numeric |
| requested_loan_amount | Numeric |
| dti_ratio (derived) | Numeric |
| loan_to_income (derived) | Numeric |
| has_coapplicant | Numeric (0/1) |
| employment_type | Categorical (label-encoded) |
| city_tier | Categorical (label-encoded) |

### Model

- **Algorithm**: XGBoost Classifier
- **Artifacts**: `encoder.pkl` (CategoricalEncoder: str → int) → `scaler.pkl` (StandardScaler) → `model.pkl` (XGBClassifier)
- **Explainability**: SHAP `TreeExplainer` on scaled input — SHAP values mapped 1:1 back to original feature names

### Risk Categories

| Score | Risk | Verdict |
|-------|------|---------|
| 80–100 | Very Low | Approved |
| 65–79 | Low | Approved |
| 45–64 | Medium | Pending |
| 25–44 | High | Rejected |
| 0–24 | Very High | Rejected |

---

## 🔒 Rule Engine

Hard rejection rules run **before** ML scoring:

- Credit score < 600 → rejected
- Serious default in payment history → rejected
- FOIR > 50% (total obligations / income) → rejected
- Requested amount > loan type maximum → rejected
- 3+ loan inquiries in last 6 months → rejected

**Loan-type specific rules:**
- Personal Loan: min income ₹25,000, no unemployed/student
- Home Loan: min income ₹35,000, LTV ≤ 80%
- Vehicle Loan: LTV ≤ 85%, vehicle age ≤ 5 years
- Education Loan: co-applicant mandatory, FOIR on co-applicant
- Business Loan: vintage ≥ 12 months, turnover ≥ ₹12L, no GST default

---

## ⛓️ Blockchain Audit & Data Integrity

Every loan eligibility check and its corresponding SHAP explanation (`summary`, `topPositive`, `topNegative`, `baseValue`) is anchored to the **Ethereum Sepolia Testnet** via **IPFS**. This ensures the decision logic is immutable and verifiable.

**The blockchain integration provides:**
- **Decentralized Storage:** Full result metadata is pinned to IPFS via Pinata
- **On-Chain Anchoring:** The IPFS CID is stored in a Solidity smart contract for permanent auditing
- **Tamper-Proof Verification:** Users receive a unique Transaction Hash per eligibility check, verifiable on Etherscan

The audit payload anchored on-chain looks like:

```json
{
  "userID": "...",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "loanType": "Personal Loan",
  "requestedAmount": 500000,
  "eligible": true,
  "mlVerdict": "Approved",
  "shapSummary": "Your application looks strong. Key strengths: Credit Score and Monthly Income.",
  "blockchainTxHash": "0x621b557a5cd8d839e98dd0062ce1cb172de4bd91f1b84699eb56945ba1088349",
  "ipfsHash": "QmfQh3D4wA5GQwm6bBstHXD2Ygi97C5WQ7yQ2a6Psj5wLB"
}
```

---

## 🛡️ Security

- JWT authentication (HTTP header based) for users; separate JWT for admins
- Admin credentials stored in `.env` only — no admin collection in the database
- bcrypt password hashing
- Zod schema validation on all inputs
- CORS restricted to frontend origin
- Blockchain private key and Pinata JWT stored in `.env` only — never committed to version control

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Node.js, Express 5, MongoDB, Mongoose |
| Auth | JWT, bcrypt |
| Validation | Zod |
| ML | XGBoost, scikit-learn, SHAP |
| ML API | FastAPI, Uvicorn |
| File Upload | Cloudinary, Multer |
| Blockchain | Ethers.js v6, Ethereum Sepolia, Pinata IPFS |
| Deployment | Vercel (frontend), Render (backend + ML services) |

---

## ⚠️ Disclaimer

> This is an **advisory system**, not a lender. All loan eligibility assessments are based on mock rules and a model trained on synthetic data. Results do not represent actual bank decisions. No real credit bureau data is used. Loan products listed are for informational purposes only.

---

## 👥 Team

Built as the offcial submission to Project-Based Learning (PBL) Lab
by Srishti Pandey, Tejas Khadilkar and Shravni Thakur.
