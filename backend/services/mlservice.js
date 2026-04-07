const axios = require("axios");

const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const SHAP_URL = process.env.SHAP_SERVICE_URL || "http://localhost:8001";

async function pollUntilReady(name, url) {

    try {
        await axios.get(`${url}/health`);
        console.log(`✅ ${name} is ready`);
        return true;
    } catch {
        console.log('not ready');
    }


    return false;
}

async function waitForMLServices() {
    const [mlReady, shapReady] = await Promise.all([
        pollUntilReady("ML service", ML_URL),
        pollUntilReady("SHAP service", SHAP_URL),
    ]);
    return { mlReady, shapReady };
}

/**
 * Builds the payload the Python pipeline expects from a
 * FinancialProfile doc + LoanEligibilityCheck request body.
 * Null-guards every field so Pydantic never receives NaN / undefined.
 */
function buildMLPayload(profile, requestedLoanAmount, tenureMonths) {
    const totalExistingEmi =
        (profile.existingEmis || []).reduce((s, e) => s + (e.monthlyAmount || 0), 0) +
        (profile.creditCardDues || []).reduce((s, c) => s + (c.minimumDue || 0), 0) +
        (profile.otherLoans || []).reduce((s, l) => s + (l.monthlyEMI || 0), 0);

    return {
        age: Number(profile.age) || 25,
        employment_type: profile.employmentType || "Salaried",
        city_tier: profile.cityTier || "Metro",
        has_coapplicant: 0,                                  // updated in getFullMLResult
        monthly_income: Number(profile.monthlyNetIncome) || 0,
        credit_score: Number(profile.creditScore) || 650,
        total_existing_emi: totalExistingEmi,
        requested_loan_amount: Number(requestedLoanAmount) || 0,
        loan_tenure_months: Number(tenureMonths) || 60,
        work_experience_years: Number(profile.employmentTenureMonths || 0) / 12,
    };
}

async function getMLPrediction(payload) {
    const { data } = await axios.post(`${ML_URL}/predict`, payload, { timeout: 60000 });
    return data;
}

async function getMLExplanation(payload) {
    const { data } = await axios.post(`${SHAP_URL}/explain`, payload, { timeout: 60000 });
    return data;
}

async function getFullMLResult(profile, requestedLoanAmount, tenureMonths, hasCoApplicant = false) {
    const payload = buildMLPayload(profile, requestedLoanAmount, tenureMonths);
    payload.has_coapplicant = hasCoApplicant ? 1 : 0;

    const [prediction, explanation] = await Promise.all([
        getMLPrediction(payload),
        getMLExplanation(payload),
    ]);

    // Return explanation as-is in snake_case — loanEligibilityService handles the mapping
    return { prediction, explanation };
}

module.exports = { getFullMLResult, waitForMLServices };
