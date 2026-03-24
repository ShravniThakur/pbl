/**
 * node_integration/eligibilityController.example.js
 *
 * Drop this into backend/controllers/eligibilityController.js
 * Adjust model imports / DB calls to fit your actual schema.
 */

const { getFullEligibilityResult } = require("../services/mlService");
// const EligibilityHistory = require("../models/EligibilityHistory"); // your mongoose model

/**
 * POST /api/eligibility/check
 * Body: raw form data from the multi-step frontend form
 */
exports.checkEligibility = async (req, res) => {
  try {
    const formData = req.body;

    // ── 1. Basic server-side validation (rule-based layer) ────────────────
    const { monthly_income, loan_amount, age } = formData;
    if (age < 18 || age > 75) {
      return res.status(400).json({ message: "Age must be between 18 and 75." });
    }
    if (monthly_income <= 0) {
      return res.status(400).json({ message: "Monthly income must be positive." });
    }

    // ── 2. Call ML + SHAP services ─────────────────────────────────────────
    const result = await getFullEligibilityResult(formData);

    // ── 3. (Optional) Save to DB ───────────────────────────────────────────
    // await EligibilityHistory.create({
    //   userId:     req.user._id,
    //   input:      formData,
    //   prediction: result,
    //   createdAt:  new Date(),
    // });

    // ── 4. Return combined result to frontend ──────────────────────────────
    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (err) {
    console.error("Eligibility check failed:", err.message);

    // Distinguish between our service being down vs. validation errors
    if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
      return res.status(503).json({
        message: "ML service is temporarily unavailable. Please try again later.",
      });
    }

    return res.status(500).json({ message: "Internal server error." });
  }
};