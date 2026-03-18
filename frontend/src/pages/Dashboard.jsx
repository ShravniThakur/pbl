import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { AppContext } from "../context/AppContext"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"

// ─── Constants (outside component to avoid re-creation on every render) ───────

const RISK_COLOR = {
    'Very Low': 'text-success',
    'Low':      'text-success',
    'Medium':   'text-yellow-400',
    'High':     'text-danger',
    'Very High':'text-danger',
}

const fmt = (n) =>
    n !== null && n !== undefined
        ? `₹${Number(n).toLocaleString('en-IN')}`
        : '—'

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, color }) => (
    <div className="bg-card border border-borderColour rounded-2xl p-5 hover:bg-cardHover duration-300">
        <p className="text-xs font-semibold text-bodyText/60 uppercase tracking-wide mb-2">{label}</p>
        <p className={`text-2xl font-black ${color}`}>{value}</p>
        <p className="text-xs text-bodyText/50 mt-1">{sub}</p>
    </div>
)

const LoadingScreen = () => (
    <div
        role="status"
        aria-busy="true"
        aria-label="Loading dashboard"
        className="flex items-center justify-center min-h-screen text-accentSoft text-xl font-bold"
    >
        <span className="animate-pulse">Loading...</span>
    </div>
)

// ─── Dashboard ────────────────────────────────────────────────────────────────

const Dashboard = () => {
    const { token, backend_url } = useContext(AppContext)
    const navigate = useNavigate()

    const [user,    setUser]    = useState(null)
    const [profile, setProfile] = useState(null)
    const [checks,  setChecks]  = useState([])
    const [loading, setLoading] = useState(true)

    // ── Auth guard ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!token) navigate('/login')
    }, [token, navigate])

    // ── Data fetching ───────────────────────────────────────────────────────
    const fetchData = useCallback(async (signal) => {
        try {
            const headers = { Authorization: token }
            const config  = { headers, signal }

            const [userRes, checksRes] = await Promise.all([
                axios.get(`${backend_url}/user/profile`,       config),
                axios.get(`${backend_url}/loan-eligibility`,   config),
            ])

            if (userRes.data.success)   setUser(userRes.data.user)
            else                        toast.error(userRes.data.message)

            if (checksRes.data.success) setChecks(checksRes.data.checks)
            else                        toast.error(checksRes.data.message)

            // Financial profile may not exist yet — handle gracefully
            try {
                const profileRes = await axios.get(`${backend_url}/financial-profile`, config)
                if (profileRes.data.success) setProfile(profileRes.data.profile)
            } catch (err) {
                // Not a critical failure — user may not have set up a profile yet
                if (import.meta.env.DEV) console.warn('No financial profile:', err)
                setProfile(null)
            }

        } catch (err) {
            // Ignore AbortError caused by unmount cleanup
            if (axios.isCancel(err)) return
            toast.error(err.response?.data?.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }, [token, backend_url])

    useEffect(() => {
        if (!token) return
        // AbortController prevents state updates on unmounted component
        const controller = new AbortController()
        fetchData(controller.signal)
        return () => controller.abort()
    }, [fetchData, token])

    // ── Derived stats (memoized) ────────────────────────────────────────────
    const totalChecks    = useMemo(() => checks.length, [checks])
    const approvedChecks = useMemo(() => checks.filter(c =>  c.results?.eligible).length, [checks])
    const rejectedChecks = useMemo(() => checks.filter(c => !c.results?.eligible).length, [checks])
    const recentChecks   = useMemo(() => checks.slice(0, 5), [checks])

    const statCards = useMemo(() => [
        {
            label: 'Financial Profile',
            value: profile ? 'Complete ✅' : 'Incomplete ⚠️',
            sub:   profile ? `Credit Score: ${profile.creditScore}` : 'Setup required',
            color: profile ? 'text-success' : 'text-yellow-400',
        },
        {
            label: 'Total Checks',
            value: totalChecks,
            sub:   'Eligibility checks run',
            color: 'text-accentSoft',
        },
        {
            label: 'Approved',
            value: approvedChecks,
            sub:   'Checks eligible',
            color: 'text-success',
        },
        {
            label: 'Rejected',
            value: rejectedChecks,
            sub:   'Checks not eligible',
            color: 'text-danger',
        },
    ], [profile, totalChecks, approvedChecks, rejectedChecks])

    const snapshotFields = useMemo(() => profile
        ? [
            { label: 'Monthly Income',  value: fmt(profile.monthlyNetIncome) },
            { label: 'Credit Score',    value: profile.creditScore },
            { label: 'Employment',      value: profile.employmentType },
            { label: 'Payment History', value: profile.paymentHistoryFlag },
            { label: 'City Tier',       value: profile.cityTier },
            { label: 'Resident Type',   value: profile.residentType?.split('(')[0].trim() },
            { label: 'Existing EMIs',   value: profile.existingEmis?.length ?? 0 },
            { label: 'Other Loans',     value: profile.otherLoans?.length ?? 0 },
          ]
        : [],
    [profile])

    // ── Render ──────────────────────────────────────────────────────────────
    if (loading) return <LoadingScreen />

    const firstName = user?.name?.split(' ')[0] ?? 'there'

    return (
        <div className="flex flex-col gap-10 text-bodyText font-sans m-5">

            {/* Header */}
            <div>
                <p className="text-3xl font-black text-heading">Dashboard 👋</p>
                {user && (
                    <p className="text-accentSoft font-semibold mt-1">
                        Welcome back, {firstName}!
                    </p>
                )}
            </div>

            {/* Financial Profile Banner */}
            {!profile && (
                <div className="bg-card border border-button/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-heading font-bold text-lg">⚠️ Financial Profile Incomplete</p>
                        <p className="text-sm mt-1">Complete your financial profile before running any loan eligibility checks.</p>
                    </div>
                    <button
                        onClick={() => navigate('/financial-profile')}
                        className="bg-button hover:bg-buttonHover duration-300 text-white font-bold px-5 py-2 rounded-full whitespace-nowrap"
                    >
                        Complete Now →
                    </button>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(({ label, value, sub, color }) => (
                    <StatCard key={label} label={label} value={value} sub={sub} color={color} />
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <p className="text-xl font-black text-heading mb-4">Quick Actions</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                        onClick={() => navigate('/loan-check')}
                        className="bg-card border border-borderColour rounded-2xl p-5 hover:bg-cardHover hover:border-button/50 duration-300 cursor-pointer flex items-center gap-4"
                    >
                        <span className="text-3xl">◎</span>
                        <div>
                            <p className="font-bold text-heading">Check Loan Eligibility</p>
                            <p className="text-sm text-bodyText/60 mt-0.5">Run a new eligibility check for any loan type</p>
                        </div>
                    </div>
                    <div
                        onClick={() => navigate('/financial-profile')}
                        className="bg-card border border-borderColour rounded-2xl p-5 hover:bg-cardHover hover:border-button/50 duration-300 cursor-pointer flex items-center gap-4"
                    >
                        <span className="text-3xl">◈</span>
                        <div>
                            <p className="font-bold text-heading">Financial Profile</p>
                            <p className="text-sm text-bodyText/60 mt-0.5">
                                {profile ? 'View or update your financial profile' : 'Set up your financial profile'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Snapshot */}
            {profile && (
                <div>
                    <p className="text-xl font-black text-heading mb-4">Financial Snapshot</p>
                    <div className="bg-card border border-borderColour rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-5">
                        {snapshotFields.map(({ label, value }) => (
                            <div key={label}>
                                <p className="text-xs text-bodyText/50 font-semibold uppercase tracking-wide mb-1">{label}</p>
                                <p className="text-heading font-bold text-sm">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Checks */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xl font-black text-heading">Recent Checks</p>
                    {checks.length > 5 && (
                        <button
                            onClick={() => navigate('/loan-history')}
                            className="text-accentSoft text-sm font-semibold hover:text-buttonHover duration-200"
                        >
                            View All →
                        </button>
                    )}
                </div>

                {recentChecks.length === 0 ? (
                    <div className="bg-card border border-borderColour rounded-2xl p-10 text-center">
                        <p className="text-bodyText/50 mb-4">No eligibility checks yet.</p>
                        <button
                            onClick={() => navigate('/loan-check')}
                            className="bg-button hover:bg-buttonHover duration-300 text-white font-bold px-5 py-2 rounded-full text-sm"
                        >
                            Run Your First Check →
                        </button>
                    </div>
                ) : (
                    <div className="border border-borderColour rounded-2xl overflow-hidden">
                        <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-3 font-bold p-3 bg-card border-b border-borderColour text-sm text-accentSoft">
                            <p>Loan Type</p>
                            <p>Amount</p>
                            <p>Result</p>
                            <p>Risk</p>
                            <p>Date</p>
                        </div>
                        {recentChecks.map((c) => (
                            <div
                                key={c._id}  // ✅ stable key instead of array index
                                onClick={() => navigate(`/loan-history/${c._id}`)}
                                className="cursor-pointer border-b border-borderColour hover:bg-card duration-200 last:border-b-0"
                            >
                                {/* Desktop */}
                                <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-3 p-3 text-sm items-center">
                                    <p className="font-semibold text-heading">{c.loanType}</p>
                                    <p>{fmt(c.requestedLoanAmount)}</p>
                                    <p className={c.results?.eligible ? 'text-success font-bold' : 'text-danger font-bold'}>
                                        {c.results?.eligible ? '✓ Eligible' : '✗ Rejected'}
                                    </p>
                                    <p className={RISK_COLOR[c.results?.riskCategory] || 'text-bodyText'}>
                                        {c.results?.riskCategory || '—'}
                                    </p>
                                    <p className="text-bodyText/60">
                                        {new Date(c.createdAt).toLocaleDateString('en-IN')}
                                    </p>
                                </div>
                                {/* Mobile */}
                                <div className="md:hidden px-4 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-heading">{c.loanType}</p>
                                        <p className="text-sm text-bodyText/60">
                                            {fmt(c.requestedLoanAmount)} · {new Date(c.createdAt).toLocaleDateString('en-IN')}
                                        </p>
                                    </div>
                                    <p className={`font-bold text-sm ${c.results?.eligible ? 'text-success' : 'text-danger'}`}>
                                        {c.results?.eligible ? '✓' : '✗'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    )
}

export default Dashboard
