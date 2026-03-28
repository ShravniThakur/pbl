import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { AppContext } from "../context/AppContext"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"
import { CheckCircle, XCircle, AlertTriangle, ArrowLeft, TrendingUp, TrendingDown, Info } from "lucide-react"
import BlockchainVerifier from "../components/BlockchainVerifier"
import RecommendedProducts from "../components/RecommendedProducts"

// ─── Constants ────────────────────────────────────────────────────────────────

const RISK_BADGE = {
    'Very Low':  'bg-emerald-light text-emerald border-emerald-light',
    'Low':       'bg-emerald-light text-emerald border-emerald-light',
    'Medium':    'bg-amber-100 text-amber-600 border-amber-200',
    'High':      'bg-rose-light text-rose border-[#FECDD3]',
    'Very High': 'bg-rose-light text-rose border-[#FECDD3]',
}

const RISK_BAR_COLOR = {
    'Very Low':  'bg-emerald',
    'Low':       'bg-emerald',
    'Medium':    'bg-amber-500',
    'High':      'bg-rose',
    'Very High': 'bg-rose',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—'

const labelFromKey = (k) =>
    k.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
     .replace(/([a-z])([A-Z])/g, '$1 $2')
     .replace(/^./, s => s.toUpperCase())

const riskScoreBarColor = (score) => score > 60 ? 'bg-rose' : score > 30 ? 'bg-amber-500' : 'bg-emerald'

// ─── Sub-components ───────────────────────────────────────────────────────────

const LoadingScreen = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-border-default border-t-primary rounded-full animate-spin"></div>
    </div>
)

const Row = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border-default last:border-b-0 gap-1 sm:gap-4">
        <p className="text-[12px] text-text-muted font-semibold uppercase tracking-[0.05em] flex-shrink-0">{label}</p>
        <p className="text-sm font-medium text-text-primary sm:text-right">{value}</p>
    </div>
)

const SectionCard = ({ title, children }) => (
    <div className="bg-surface border border-border-default rounded-[14px] p-6 shadow-card mb-6">
        <h2 className="text-[18px] font-bold text-text-primary mb-5">{title}</h2>
        {children}
    </div>
)

const StatCard = ({ label, value }) => (
    <div className="bg-[#F8F7F4] border border-border-default rounded-xl p-4 flex flex-col justify-center">
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.07em] mb-1.5">{label}</p>
        <p className="text-[20px] font-bold text-primary">{value}</p>
    </div>
)

const LoanDetail = () => {
    const { token, backend_url } = useContext(AppContext)
    const { id } = useParams()
    const navigate = useNavigate()

    const [check, setCheck] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!token) navigate('/login')
    }, [token, navigate])

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

    const offerCards = useMemo(() => {
        if (!check?.results) return []
        const { maxApprovedLoanAmount, maxApprovedTenureMonths, maxApprovedInterestRatePercent, emi } = check.results
        return [
            { label: 'Max Amount', value: fmt(maxApprovedLoanAmount) },
            { label: 'Tenure', value: `${maxApprovedTenureMonths} mo` },
            { label: 'Interest Rate', value: `${maxApprovedInterestRatePercent}%` },
            { label: 'Est. EMI', value: fmt(emi) },
        ]
    }, [check])

    if (loading) return <LoadingScreen />

    if (!check) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <AlertTriangle size={48} className="text-text-muted opacity-50 mb-2" />
            <p className="text-text-primary font-medium text-lg">Check not found.</p>
            <button onClick={() => navigate('/loan-history')} className="mt-2 px-6 py-2 rounded-[9px] bg-white border border-border-default text-text-primary text-sm font-semibold hover:bg-[#F5F5F4] transition-colors">
                Back to History
            </button>
        </div>
    )

    const results = check?.results
    const loanType = check?.loanType
    const requestedLoanAmount = check?.requestedLoanAmount
    const loanDetails = check?.loanDetails
    const createdAt = check?.createdAt
    const eligible = results?.eligible

    return (
        <div className="max-w-7xl w-full mx-auto px-8 md:px-12 py-12 md:py-16 flex flex-col gap-10 font-inter animate-fade-up">

            {/* Header */}
            <div className="flex flex-col gap-4 mb-2">
                <button onClick={() => navigate('/loan-history')} className="flex items-center gap-1.5 w-max text-text-muted hover:text-text-primary transition-colors text-sm font-medium">
                    <ArrowLeft size={16} /> Back to History
                </button>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-[40px] font-black text-sidebar-bg tracking-[-0.03em] leading-tight py-4">Eligibility Result</h1>
                        <p className="text-sm font-medium text-text-muted mt-1 flex items-center gap-2">
                            <span className="bg-[#F5F5F4] text-text-primary px-2 py-0.5 rounded-md border border-border-default text-[12px]">{loanType}</span>
                            {createdAt ? new Date(createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Result Banner */}
            <div className={`relative overflow-hidden rounded-[14px] border ${eligible ? 'bg-emerald-light border-[#A7F3D0]' : 'bg-rose-light border-[#FECDD3]'} p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm`}>
                <div className="flex items-start gap-4 z-10">
                    {eligible ? <CheckCircle size={40} className="text-emerald shrink-0 mt-1" /> : <XCircle size={40} className="text-rose shrink-0 mt-1" />}
                    <div>
                        <p className={`text-[28px] font-black tracking-tight ${eligible ? 'text-emerald' : 'text-rose'} leading-none mb-2`}>
                            {eligible ? 'Eligible for Loan' : 'Not Eligible'}
                        </p>
                        <p className={`text-sm font-medium ${eligible ? 'text-emerald/80' : 'text-rose/80'}`}>
                            Requested <span className="font-bold">{fmt(requestedLoanAmount)}</span> for {loanType}
                        </p>
                    </div>
                </div>
                {results?.riskCategory && (
                    <div className="z-10 bg-white/80 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/50 shadow-sm flex flex-col items-center min-w-[120px]">
                        <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.05em] mb-0.5">Risk Category</p>
                        <p className={`text-sm font-black ${eligible ? 'text-emerald' : 'text-rose'}`}>{results.riskCategory}</p>
                    </div>
                )}
            </div>

            {/* Blockchain Verifier */}
            {check?.blockchainTxHash && (
                <div className="bg-surface border border-border-default rounded-[14px] p-6 shadow-card">
                    <BlockchainVerifier loanId={check._id} />
                </div>
            )}

            {/* Rejection Reasons */}
            {!eligible && results?.rejectionReasons?.length > 0 && (
                <div className="bg-rose-light border border-[#FECDD3] rounded-[14px] p-6 shadow-sm">
                    <h2 className="text-[18px] font-bold text-rose flex items-center gap-2 mb-4">
                        <AlertTriangle size={20} /> Reasons for Rejection
                    </h2>
                    <div className="flex flex-col gap-3">
                        {results.rejectionReasons.map((r, i) => (
                            <div key={`${i}-${r}`} className="flex gap-3 items-start bg-white border border-[#FECDD3] rounded-xl px-4 py-3 shadow-sm">
                                <span className="text-rose mt-0.5 shrink-0"><XCircle size={16} /></span>
                                <p className="text-sm font-medium text-text-primary leading-relaxed">{r}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Approved Offer & Scores */}
            {eligible && (
                <SectionCard title="Approved Offer Details">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
                        {offerCards.map((card) => <StatCard key={card.label} {...card} />)}
                    </div>

                    {results?.eligibilityScore != null && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-border-default">
                            <div>
                                <div className="flex justify-between items-center mb-2.5">
                                    <p className="text-[12px] font-bold text-text-muted uppercase tracking-wider">Eligibility Score</p>
                                    <p className="text-sm font-black text-primary">{results.eligibilityScore} <span className="text-text-muted font-semibold">/ 100</span></p>
                                </div>
                                <div className="h-2.5 bg-[#F5F5F4] rounded-full overflow-hidden border border-border-default shadow-inner">
                                    <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: `${results.eligibilityScore}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2.5">
                                    <p className="text-[12px] font-bold text-text-muted uppercase tracking-wider">Risk Score</p>
                                    <p className={`text-sm font-black`}>
                                        {results.riskScore} <span className="text-text-muted font-semibold">/ 100</span>
                                    </p>
                                </div>
                                <div className="h-2.5 bg-[#F5F5F4] rounded-full overflow-hidden border border-border-default shadow-inner">
                                    <div className={`h-full rounded-full transition-all duration-1000 ease-out ${riskScoreBarColor(results.riskScore)}`} style={{ width: `${results.riskScore}%` }} />
                                </div>
                            </div>
                        </div>
                    )}
                </SectionCard>
            )}

            {/* SHAP Explanation */}
            {check?.mlExplanation && (
                <SectionCard title="AI Decision Insight">
                    <p className="text-sm font-medium text-text-muted leading-relaxed mb-6 bg-[#F8F7F4] p-4 rounded-xl border border-border-default">
                        <Info size={16} className="inline mr-2 text-primary" />
                        {check.mlExplanation?.summary}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Positive Factors */}
                        <div className="bg-emerald-light border border-[#A7F3D0] rounded-[14px] p-5">
                            <h3 className="text-[12px] font-bold text-emerald uppercase tracking-[0.08em] mb-4 flex items-center gap-1.5">
                                <TrendingUp size={16} strokeWidth={3} /> Positive Impact Factors
                            </h3>
                            <div className="flex flex-col gap-2.5">
                                {check.mlExplanation?.topPositive?.length > 0 ? check.mlExplanation.topPositive.map((f) => (
                                    <div key={f.feature} className="bg-white border border-[#A7F3D0] rounded-[10px] px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-[13px] font-bold text-text-primary capitalize">{f.label}</p>
                                            <p className="text-[13px] font-black text-emerald">+{f.shap_value?.toFixed(2)}</p>
                                        </div>
                                        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{f.magnitude} Impact</p>
                                    </div>
                                )) : <p className="text-sm text-text-muted italic px-2">No significant positive factors.</p>}
                            </div>
                        </div>

                        {/* Negative Factors */}
                        <div className="bg-rose-light border border-[#FECDD3] rounded-[14px] p-5">
                            <h3 className="text-[12px] font-bold text-rose uppercase tracking-[0.08em] mb-4 flex items-center gap-1.5">
                                <TrendingDown size={16} strokeWidth={3} /> Negative Impact Factors
                            </h3>
                            <div className="flex flex-col gap-2.5">
                                {check.mlExplanation?.topNegative?.length > 0 ? check.mlExplanation.topNegative.map((f) => (
                                    <div key={f.feature} className="bg-white border border-[#FECDD3] rounded-[10px] px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-[13px] font-bold text-text-primary capitalize">{f.label}</p>
                                            <p className="text-[13px] font-black text-rose">{f.shap_value?.toFixed(2)}</p>
                                        </div>
                                        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{f.magnitude} Impact</p>
                                    </div>
                                )) : <p className="text-sm text-text-muted italic px-2">No significant negative factors.</p>}
                            </div>
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* Application Data */}
            <SectionCard title="Application Details">
                <Row label="Loan Type" value={loanType} />
                <Row label="Requested Amount" value={fmt(requestedLoanAmount)} />
                {loanDetails && Object.entries(loanDetails).map(([k, v]) => {
                    if (v == null || v === '' || k === 'coApplicant') return null
                    if (k === 'collateralDetails' && typeof v === 'object') {
                        return (
                            <div key={k} className="mt-4 pt-4 border-t border-border-default border-dashed">
                                <p className="text-[12px] text-text-primary font-bold uppercase tracking-[0.05em] mb-2 px-1">Collateral Data</p>
                                <div className="bg-[#F8F7F4] rounded-xl p-2 border border-border-default">
                                    <Row key="collateralType" label="Type" value={v.collateralType} />
                                    <Row key="assetValue" label="Asset Value" value={fmt(v.assetValue)} />
                                    <Row key="ownershipType" label="Ownership" value={v.ownershipType} />
                                </div>
                            </div>
                        )
                    }
                    if (typeof v === 'object') return null
                    const display = typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)
                    return <Row key={k} label={labelFromKey(k)} value={display} />
                })}
            </SectionCard>

            {/* ML Raw Output (Keep low priority at bottom) */}
            {check?.mlResult && (
                <div className="bg-surface border border-border-default rounded-[14px] p-6 shadow-card mb-6 opacity-80 hover:opacity-100 transition-opacity">
                    <p className="text-[14px] font-bold text-text-primary mb-4 flex items-center gap-2">Machine Learning Details</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Raw Score', value: `${check.mlResult?.score || 0}/100` },
                            { label: 'Probability', value: `${((check.mlResult?.probability || 0) * 100).toFixed(1)}%` },
                            { label: 'Risk Eval', value: check.mlResult?.riskCategory || 'N/A' },
                            { label: 'Confidence', value: check.mlResult?.confidence || 'N/A' },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-white border border-border-default rounded-[9px] p-3 text-center">
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] mb-1">{label}</p>
                                <p className="text-[14px] font-black text-text-primary">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommended Products */}
            {eligible && (
                <div className="mb-6">
                    <RecommendedProducts products={check?.recommendedProducts} />
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 pb-12">
                <button onClick={() => navigate('/loan-history')} className="order-2 sm:order-1 flex-1 sm:flex-none px-6 py-3.5 rounded-[9px] border-2 border-border-default text-text-primary text-sm font-bold hover:bg-[#F5F5F4] transition-colors text-center">
                    View All History
                </button>
                <button onClick={() => navigate('/loan-check')} className="order-1 sm:order-2 flex-1 sm:flex-none px-6 py-3.5 rounded-[9px] bg-primary text-white text-sm font-bold shadow-button-primary hover:bg-primary-hover transition-colors text-center">
                    New Application
                </button>
            </div>

        </div>
    )
}

export default LoanDetail
