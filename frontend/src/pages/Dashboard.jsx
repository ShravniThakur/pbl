import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { AppContext } from "../context/AppContext"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"
import { 
    Activity, CheckCircle2, XCircle, UserCircle, Calculator, 
    ArrowRight, AlertTriangle, Briefcase 
} from "lucide-react"

// ─── Constants ────────────────────────────────────────────────────────────────

const RISK_COLOR = {
    'Very Low': 'bg-emerald-500',
    'Low':      'bg-emerald-400',
    'Medium':   'bg-amber-400',
    'High':     'bg-rose-500',
    'Very High':'bg-rose-600',
}

const fmt = (n) =>
    n !== null && n !== undefined
        ? `₹${Number(n).toLocaleString('en-IN')}`
        : '—'

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ label, value, Icon, colorClass, delayClass }) => (
    <div className={`bg-surface border border-border-default rounded-[14px] p-6 shadow-card hover:shadow-card-hover hover:-translate-y-[2px] transition-all duration-200 animate-fade-up ${delayClass}`}>
        <div className="flex justify-between items-start mb-4">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.07em]">{label}</p>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                <Icon size={16} />
            </div>
        </div>
        <p className="text-[32px] font-bold text-text-primary tabular-nums leading-none">{value}</p>
    </div>
)

const LoadingScreen = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-border-default border-t-primary rounded-full animate-spin"></div>
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

    useEffect(() => {
        if (!token) navigate('/login')
    }, [token, navigate])

    const fetchData = useCallback(async (signal) => {
        try {
            const headers = { Authorization: token }
            const config  = { headers, signal }

            const [userRes, checksRes] = await Promise.all([
                axios.get(`${backend_url}/user/profile`, config),
                axios.get(`${backend_url}/loan-eligibility`, config),
            ])

            if (userRes.data?.success) setUser(userRes.data.user)
            if (checksRes.data?.success) setChecks(checksRes.data.checks || [])

            try {
                const profileRes = await axios.get(`${backend_url}/financial-profile`, config)
                if (profileRes.data?.success) setProfile(profileRes.data.profile)
            } catch (err) {
                setProfile(null)
            }
        } catch (err) {
            if (axios.isCancel(err)) return
            toast.error(err.response?.data?.message || 'Failed to sync dashboard data')
        } finally {
            setLoading(false)
        }
    }, [token, backend_url])

    useEffect(() => {
        if (!token) return
        const controller = new AbortController()
        fetchData(controller.signal)
        return () => controller.abort()
    }, [fetchData, token])

    const totalChecks    = checks?.length || 0
    const approvedChecks = checks?.filter(c =>  c?.results?.eligible).length || 0
    const rejectedChecks = totalChecks - approvedChecks
    const recentChecks   = checks?.slice(0, 5) || []

    const statCards = useMemo(() => [
        {
            label: 'Total Checks',
            value: totalChecks,
            Icon: Activity,
            colorClass: 'bg-primary-light text-primary',
            delayClass: 'animate-delay-0'
        },
        {
            label: 'Approved',
            value: approvedChecks,
            Icon: CheckCircle2,
            colorClass: 'bg-emerald-light text-emerald',
            delayClass: 'animate-delay-1'
        },
        {
            label: 'Rejected',
            value: rejectedChecks,
            Icon: XCircle,
            colorClass: 'bg-rose-light text-rose',
            delayClass: 'animate-delay-2'
        },
        {
            label: 'Profile Status',
            value: profile ? '100%' : '0%',
            Icon: UserCircle,
            colorClass: profile ? 'bg-emerald-light text-emerald' : 'bg-amber-light text-amber-500',
            delayClass: 'animate-delay-3'
        },
    ], [profile, totalChecks, approvedChecks, rejectedChecks])

    if (loading) return <LoadingScreen />

    const firstName = user?.name ? user.name.split(' ')[0] : 'User'
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'

    return (
        <div className="max-w-6xl w-full mx-auto px-6 py-8 flex flex-col gap-8 font-inter">

            {/* Header */}
            <div className="flex items-baseline gap-4 animate-fade-up">
                <h1 className="text-[40px] font-black text-sidebar-bg tracking-[-0.03em] leading-tight py-4">
                    {greeting}, {firstName}
                </h1>
                <p className="text-sm font-medium text-text-muted">{today}</p>
            </div>

            {/* Financial Profile Banner */}
            {!profile && (
                <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[14px] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-up">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <AlertTriangle className="text-amber-600 w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-text-primary font-semibold text-base mb-0.5">Financial Profile incomplete</p>
                            <p className="text-sm text-amber-800">Please complete your financial profile to receive accurate loan eligibility checks.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/financial-profile')}
                        className="shrink-0 bg-primary hover:bg-primary-hover shadow-button-primary text-white font-semibold px-5 py-2.5 rounded-[9px] transition-colors duration-200 text-sm flex items-center gap-2"
                    >
                        Complete Profile
                        <ArrowRight size={16} />
                    </button>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card) => (
                    <StatCard key={card.label} {...card} />
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Col (History) */}
                <div className="lg:col-span-2 space-y-4 animate-fade-up animate-delay-1">
                    <div className="flex justify-between items-end">
                        <h2 className="text-lg font-semibold text-text-primary">Recent Checks</h2>
                        {totalChecks > 5 && (
                            <button onClick={() => navigate('/loan-history')} className="text-sm font-medium text-primary flex items-center gap-1 hover:underline">
                                View History <ArrowRight size={14} />
                            </button>
                        )}
                    </div>

                    <div className="bg-surface border border-border-default rounded-[14px] overflow-hidden">
                        {recentChecks.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center">
                                <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mb-4">
                                    <Activity className="text-primary w-6 h-6" />
                                </div>
                                <p className="text-text-primary font-semibold text-base mb-1">No checks found</p>
                                <p className="text-text-muted text-sm mb-6">You haven't run any eligibility checks yet.</p>
                                <button
                                    onClick={() => navigate('/loan-check')}
                                    className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-[9px] shadow-button-primary font-medium text-sm transition-colors duration-200"
                                >
                                    Run a Check
                                </button>
                            </div>
                        ) : (
                            <div className="w-full text-sm">
                                <div className="grid grid-cols-[1.5fr_1fr_1fr_1.5fr] gap-4 p-4 border-b border-border-default bg-[#F8F7F4] text-[11px] font-semibold text-text-muted uppercase tracking-[0.07em]">
                                    <div>Loan Type</div>
                                    <div>Amount</div>
                                    <div>Status</div>
                                    <div>Risk Category</div>
                                </div>
                                {recentChecks.map((c, idx) => (
                                    <div 
                                        key={c?._id || idx}
                                        onClick={() => c?._id && navigate(`/loan-history/${c._id}`)}
                                        className={`grid grid-cols-[1.5fr_1fr_1fr_1.5fr] gap-4 p-4 items-center cursor-pointer transition-colors duration-150 relative hover:bg-[#EEF2FF] border-b border-border-default last:border-b-0 ${idx % 2 !== 0 ? 'bg-[#F8F7F4]' : 'bg-surface'}`}
                                    >
                                        <div className="font-semibold text-text-primary font-inter">{c?.loanType || 'N/A'}</div>
                                        <div className="tabular-nums text-text-secondary">{fmt(c?.requestedLoanAmount)}</div>
                                        <div>
                                            {c?.results?.eligible ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-light text-emerald">
                                                    Eligible
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-light text-rose">
                                                    Rejected
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-text-secondary">
                                            <div className={`w-2 h-2 rounded-full ${RISK_COLOR[c?.results?.riskCategory] || 'bg-gray-400'}`} />
                                            {c?.results?.riskCategory || 'Unknown'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Col */}
                <div className="space-y-4 animate-fade-up animate-delay-2">
                    <h2 className="text-lg font-semibold text-text-primary">Quick Actions</h2>
                    
                    <div 
                        onClick={() => navigate('/loan-check')}
                        className="bg-surface group cursor-pointer border border-border-default hover:border-border-hover rounded-[14px] p-5 shadow-card hover:shadow-card-hover transition-all duration-200"
                    >
                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 shrink-0 bg-primary-light rounded-full flex justify-center items-center text-primary group-hover:scale-110 transition-transform duration-200">
                                <Calculator size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-text-primary mb-1">Check Eligibility</h3>
                                <p className="text-sm text-text-secondary leading-snug">Run a predictive AI check against standard bank underwriting algorithms.</p>
                            </div>
                            <ArrowRight className="text-text-muted group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 duration-200" size={18} />
                        </div>
                    </div>

                    <div 
                        onClick={() => navigate('/loan-products')}
                        className="bg-surface group cursor-pointer border border-border-default hover:border-border-hover rounded-[14px] p-5 shadow-card hover:shadow-card-hover transition-all duration-200"
                    >
                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 shrink-0 bg-emerald-light rounded-full flex justify-center items-center text-emerald group-hover:scale-110 transition-transform duration-200">
                                <Briefcase size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-text-primary mb-1">Browse Products</h3>
                                <p className="text-sm text-text-secondary leading-snug">Discover partner bank loans that match your unique financial profile.</p>
                            </div>
                            <ArrowRight className="text-text-muted group-hover:text-emerald transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 duration-200" size={18} />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default Dashboard