import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { AppContext } from "../context/AppContext"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"

// ─── Constants ────────────────────────────────────────────────────────────────

const RISK_COLOR = {
    'Very Low': 'text-success',
    'Low':      'text-success',
    'Medium':   'text-yellow-400',
    'High':     'text-danger',
    'Very High':'text-danger',
}

const RISK_BG = {
    'Very Low': 'bg-success/10 border-success/30',
    'Low':      'bg-success/10 border-success/30',
    'Medium':   'bg-yellow-400/10 border-yellow-400/30',
    'High':     'bg-danger/10 border-danger/30',
    'Very High':'bg-danger/10 border-danger/30',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
    n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—'

/** Handles GSTFilingHistory → "GST Filing History", camelCase → "Camel Case" */
const labelFromKey = (k) =>
    k
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')  // e.g. GSTFiling → GST Filing
        .replace(/([a-z])([A-Z])/g, '$1 $2')          // e.g. loanType → loan Type
        .replace(/^./, s => s.toUpperCase())

const riskScoreTextColor = (score) =>
    score > 60 ? 'text-danger' : score > 30 ? 'text-yellow-400' : 'text-success'

const riskScoreBarColor = (score) =>
    score > 60 ? 'bg-danger' : score > 30 ? 'bg-yellow-400' : 'bg-success'

// ─── Sub-components (module scope — stable identity across renders) ───────────

const LoadingScreen = () => (
    <div
        role="status"
        aria-busy="true"
        aria-label="Loading eligibility result"
        className="flex items-center justify-center min-h-screen text-accentSoft text-xl font-bold"
    >
        <span className="animate-pulse">Loading...</span>
    </div>
)

const Row = ({ label, value }) => (
    <div className="flex justify-between items-start py-2 border-b border-borderColour last:border-b-0 gap-4">
        <p className="text-xs text-bodyText/50 font-semibold uppercase tracking-wide flex-shrink-0">{label}</p>
        <p className="text-bodyText text-sm font-semibold text-right">{value}</p>
    </div>
)

// ─── LoanDetail ───────────────────────────────────────────────────────────────

const LoanDetail = () => {
    const { token, backend_url } = useContext(AppContext)
    const { id } = useParams()
    const navigate = useNavigate()

    const [check,   setCheck]   = useState(null)
    const [loading, setLoading] = useState(true)

    // ── Auth guard ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!token) navigate('/login')
    }, [token, navigate])

    // ── Fetch ───────────────────────────────────────────────────────────────
    const fetchCheck = useCallback(async (signal) => {
        try {
            const res = await axios.get(`${backend_url}/loan-eligibility/${id}`, {
                headers: { Authorization: token },
                signal,
            })
            if (res.data.success) setCheck(res.data.check)
            else toast.error(res.data.message)
        } catch (err) {
            if (axios.isCancel(err)) return
            toast.error(err.response?.data?.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }, [id, token, backend_url])

    useEffect(() => {
        const controller = new AbortController()
        fetchCheck(controller.signal)
        return () => controller.abort()
    }, [fetchCheck])

    // ── Derived ─────────────────────────────────────────────────────────────
    const offerCards = useMemo(() => {
        if (!check?.results) return []
        const { maxApprovedLoanAmount, maxApprovedTenureMonths, maxApprovedInterestRatePercent, emi } = check.results
        return [
            { label: 'Max Amount',    value: fmt(maxApprovedLoanAmount) },
            { label: 'Tenure',        value: `${maxApprovedTenureMonths} months` },
            { label: 'Interest Rate', value: `${maxApprovedInterestRatePercent}% p.a.` },
            { label: 'Est. EMI',      value: fmt(emi) },
        ]
    }, [check])

    // ── Render ───────────────────────────────────────────────────────────────
    if (loading) return <LoadingScreen />

    if (!check) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <p className="text-bodyText/50 text-lg">Check not found.</p>
            <button
                onClick={() => navigate('/loan-history')}
                className="bg-button hover:bg-buttonHover duration-300 text-white font-bold px-5 py-2 rounded-full text-sm"
            >
                Back to History
            </button>
        </div>
    )

    const { results, loanType, requestedLoanAmount, loanDetails, createdAt } = check
    const eligible = results?.eligible

    return (
        <div className="flex flex-col gap-8 text-bodyText font-sans m-5 max-w-3xl">

            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/loan-history')}
                    className="text-bodyText/50 hover:text-accentSoft duration-200 text-sm font-semibold"
                >
                    ← Back
                </button>
                <div>
                    <p className="text-3xl font-black text-heading">Eligibility Result</p>
                    <p className="text-xs text-bodyText/50 mt-1">
                        {loanType} · {new Date(createdAt).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                        })}
                    </p>
                </div>
            </div>

            {/* Result Banner */}
            <div className={`rounded-2xl border-2 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${eligible ? 'bg-success/5 border-success/30' : 'bg-danger/5 border-danger/30'}`}>
                <div>
                    <p className={`text-3xl font-black ${eligible ? 'text-success' : 'text-danger'}`}>
                        {eligible ? '✓ Eligible' : '✗ Not Eligible'}
                    </p>
                    <p className="text-sm text-bodyText/60 mt-1">
                        Requested {fmt(requestedLoanAmount)} for {loanType}
                    </p>
                </div>
                {results?.riskCategory && (
                    <div className={`px-4 py-2 rounded-xl border text-sm font-bold ${RISK_BG[results.riskCategory]} ${RISK_COLOR[results.riskCategory]}`}>
                        {results.riskCategory} Risk
                    </div>
                )}
            </div>

            {/* Rejection Reasons */}
            {!eligible && results?.rejectionReasons?.length > 0 && (
                <div className="bg-card border border-borderColour rounded-2xl p-6">
                    <p className="text-lg font-black text-heading mb-4">Why You Were Rejected</p>
                    <div className="flex flex-col gap-3">
                        {results.rejectionReasons.map((r, i) => (
                            // Reasons are display strings; index+content combo guards against duplicates
                            <div key={`${i}-${r}`} className="flex gap-3 items-start bg-danger/5 border border-danger/20 rounded-xl px-4 py-3">
                                <span className="text-danger font-bold mt-0.5 flex-shrink-0">✗</span>
                                <p className="text-sm text-bodyText">{r}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Approved Offer */}
            {eligible && (
                <div className="bg-card border border-borderColour rounded-2xl p-6">
                    <p className="text-lg font-black text-heading mb-5">Approved Offer</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {offerCards.map(({ label, value }) => (
                            <div key={label} className="bg-black/30 border border-borderColour rounded-xl p-4">
                                <p className="text-xs text-bodyText/50 uppercase tracking-wide mb-2">{label}</p>
                                <p className="text-lg font-black text-accentSoft">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Score bars */}
                    {results.eligibilityScore != null && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-5 border-t border-borderColour">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-xs text-bodyText/50 font-semibold uppercase tracking-wide">Eligibility Score</p>
                                    <p className="text-sm font-black text-accentSoft">{results.eligibilityScore} / 100</p>
                                </div>
                                <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-borderColour">
                                    <div
                                        className="h-full bg-button rounded-full transition-all duration-500"
                                        style={{ width: `${results.eligibilityScore}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-xs text-bodyText/50 font-semibold uppercase tracking-wide">Risk Score</p>
                                    <p className={`text-sm font-black ${riskScoreTextColor(results.riskScore)}`}>
                                        {results.riskScore} / 100
                                    </p>
                                </div>
                                <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-borderColour">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${riskScoreBarColor(results.riskScore)}`}
                                        style={{ width: `${results.riskScore}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Loan Details */}
            <div className="bg-card border border-borderColour rounded-2xl p-6">
                <p className="text-lg font-black text-heading mb-4">Application Details</p>
                <Row label="Loan Type" value={loanType} />
                <Row label="Requested Amount" value={fmt(requestedLoanAmount)} />

                {loanDetails && Object.entries(loanDetails).map(([k, v]) => {
                    if (v == null || v === '') return null
                    if (k === 'coApplicant') return null

                    if (k === 'collateralDetails' && typeof v === 'object') {
                        return (
                            <div key={k}>
                                <Row key="collateralType" label="Collateral Type" value={v.collateralType} />
                                <Row key="assetValue"     label="Asset Value"     value={fmt(v.assetValue)} />
                                <Row key="ownershipType"  label="Ownership Type"  value={v.ownershipType} />
                            </div>
                        )
                    }

                    if (typeof v === 'object') return null

                    const display = typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)
                    return <Row key={k} label={labelFromKey(k)} value={display} />
                })}
            </div>

            {/* Co-Applicant */}
            {loanDetails?.coApplicant && (
                <div className="bg-card border border-borderColour rounded-2xl p-6">
                    <p className="text-lg font-black text-heading mb-4">Co-Applicant</p>
                    <Row label="Name"            value={loanDetails.coApplicant.name} />
                    <Row label="Relationship"    value={loanDetails.coApplicant.relationship} />
                    <Row label="Age"             value={loanDetails.coApplicant.age} />
                    <Row label="Employment Type" value={loanDetails.coApplicant.employmentType} />
                    <Row label="Monthly Income"  value={fmt(loanDetails.coApplicant.monthlyNetIncome)} />
                    <Row label="Credit Score"    value={loanDetails.coApplicant.creditScore} />
                    <Row label="Primary Earner"  value={loanDetails.coApplicant.isPrimaryEarner ? 'Yes' : 'No'} />
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={() => navigate('/loan-check')}
                    className="bg-button hover:bg-buttonHover duration-300 text-white font-bold px-6 py-2.5 rounded-full text-sm"
                >
                    Run Another Check
                </button>
                <button
                    onClick={() => navigate('/loan-history')}
                    className="border border-borderColour hover:bg-card duration-300 text-bodyText font-bold px-6 py-2.5 rounded-full text-sm"
                >
                    View All History
                </button>
            </div>

        </div>
    )
}

export default LoanDetail
