import { useContext, useEffect, useState, useMemo } from "react"
import { AppContext } from "../context/AppContext"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"
import { FileText, Filter, ChevronRight, XCircle } from "lucide-react"

const LOAN_TYPES = ['Personal Loan', 'Home Loan', 'Education Loan', 'Vehicle Loan', 'Business Loan']

const RISK_BADGE = {
    'Very Low':  'bg-emerald-light text-emerald border-emerald-light',
    'Low':       'bg-emerald-light text-emerald border-emerald-light',
    'Medium':    'bg-amber-100 text-amber-600 border-amber-200',
    'High':      'bg-rose-light text-rose border-[#FECDD3]',
    'Very High': 'bg-rose-light text-rose border-[#FECDD3]',
}

const fmt = (n) => n !== null && n !== undefined ? `₹${Number(n).toLocaleString('en-IN')}` : '—'

const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const LoanHistory = () => {
    const { token, backend_url } = useContext(AppContext)
    const navigate = useNavigate()

    const [checks, setChecks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filterType, setFilterType] = useState('')
    const [filterResult, setFilterResult] = useState('')

    useEffect(() => {
        if (!token) {
            navigate('/login')
            return
        }

        const fetchChecks = async () => {
            try {
                const res = await axios.get(backend_url + '/loan-eligibility', {
                    headers: { Authorization: token }
                })
                if (res.data.success) setChecks(res.data.checks)
                else toast.error(res.data.message)
            } catch (err) {
                const message = err.response?.data?.message || 'Failed to load history. Please try again.'
                toast.error(message)
                setError(message)
            } finally {
                setLoading(false)
            }
        }

        fetchChecks()
    }, [token, navigate, backend_url])

    const eligibleCount = useMemo(() => checks.filter(c => c.results?.eligible).length, [checks])
    const rejectedCount = useMemo(() => checks.length - eligibleCount, [checks, eligibleCount])

    const filtered = useMemo(() => checks.filter(c => {
        if (filterType && c.loanType !== filterType) return false
        if (filterResult === 'Eligible' && !c.results?.eligible) return false
        if (filterResult === 'Rejected' && c.results?.eligible) return false
        return true
    }), [checks, filterType, filterResult])

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-border-default border-t-primary rounded-full animate-spin"></div>
        </div>
    )

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-up">
            <p className="text-rose font-medium text-lg">{error}</p>
            <button
                onClick={() => window.location.reload()}
                className="bg-primary hover:bg-primary-hover duration-200 text-white font-bold px-6 py-2.5 rounded-[9px] text-sm shadow-button-primary"
            >
                Retry
            </button>
        </div>
    )

    return (
        <div className="max-w-7xl w-full mx-auto px-8 md:px-12 py-12 md:py-16 flex flex-col gap-10 font-inter animate-fade-up">

            {/* Header */}
            <div>
                <h1 className="text-[40px] font-black text-sidebar-bg tracking-[-0.03em] leading-tight py-4">Application History</h1>
                <p className="text-sm font-medium text-text-muted mt-1">Review your automated eligibility checks and loan results.</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Logs', value: checks.length,   color: 'text-primary' },
                    { label: 'Approved',   value: eligibleCount, color: 'text-emerald' },
                    { label: 'Rejected',   value: rejectedCount, color: 'text-rose' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-surface border border-border-default rounded-[14px] p-5 shadow-sm">
                        <p className={`text-[28px] font-black leading-none mb-1 ${color}`}>{value}</p>
                        <p className="text-[12px] font-semibold text-text-muted uppercase tracking-[0.05em]">{label}</p>
                    </div>
                ))}
            </div>

            {/* Table Area Container */}
            <div className="bg-surface border border-border-default rounded-[14px] flex flex-col shadow-card">
                
                {/* Filters Banner */}
                <div className="p-4 border-b border-border-default bg-[#F8F7F4]/50 rounded-t-[14px] flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex items-center gap-2 text-text-muted font-semibold text-[13px]">
                        <Filter size={16} /> Filters
                    </div>
                    <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                        <select
                            className="bg-white border border-border-default rounded-[8px] px-3 py-1.5 text-text-primary text-[13px] font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 appearance-none min-w-[140px]"
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            {LOAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select
                            className="bg-white border border-border-default rounded-[8px] px-3 py-1.5 text-text-primary text-[13px] font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 appearance-none min-w-[140px]"
                            value={filterResult}
                            onChange={e => setFilterResult(e.target.value)}
                        >
                            <option value="">All Results</option>
                            <option value="Eligible">Eligible</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                        {(filterType || filterResult) && (
                            <button
                                onClick={() => { setFilterType(''); setFilterResult('') }}
                                className="flex items-center justify-center bg-rose/10 text-rose border border-rose/20 rounded-[8px] px-3 py-1.5 text-[13px] font-bold hover:bg-rose/20 transition-colors shrink-0"
                            >
                                <XCircle size={14} className="mr-1.5" /> Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Table Data */}
                {filtered.length === 0 ? (
                    <div className="p-16 text-center flex flex-col items-center">
                        <FileText size={48} className="text-text-muted/30 mb-4" />
                        <p className="text-text-primary font-bold text-lg mb-1">
                            {checks.length === 0 ? 'No applications yet' : 'No matches found'}
                        </p>
                        <p className="text-text-muted text-[13px] font-medium mb-6">
                            {checks.length === 0 ? 'Run your first loan check to see it here.' : 'Try clearing your filters to see more results.'}
                        </p>
                        {checks.length === 0 && (
                            <button
                                onClick={() => navigate('/loan-check')}
                                className="bg-primary hover:bg-primary-hover transition-colors text-white font-bold px-6 py-2.5 rounded-[9px] text-sm shadow-button-primary"
                            >
                                Start New Application
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {/* Desktop header */}
                        <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-border-default bg-[#F8F7F4] text-[11px] font-bold text-text-muted uppercase tracking-[0.05em]">
                            <p>Loan Type</p>
                            <p>Amount</p>
                            <p>Status</p>
                            <p>Risk Eval</p>
                            <p>Date</p>
                            <p className="w-8"></p>
                        </div>

                        {/* Rows */}
                        <div className="flex flex-col divide-y divide-border-default">
                            {filtered.map((c) => {
                                const isEligible = c.results?.eligible
                                const riskBadgeClass = RISK_BADGE[c.results?.riskCategory] || 'bg-[#F5F5F4] text-text-muted border-border-default'
                                
                                return (
                                    <div
                                        key={c._id}
                                        onClick={() => navigate(`/loan-history/${c._id}`)}
                                        className="group cursor-pointer hover:bg-[#F8F7F4]/80 transition-colors"
                                    >
                                        {/* Desktop row */}
                                        <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 text-[13px] items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#F5F5F4] border border-border-default flex items-center justify-center shrink-0">
                                                    <FileText size={14} className="text-primary" />
                                                </div>
                                                <p className="font-bold text-text-primary truncate">{c.loanType}</p>
                                            </div>
                                            <p className="font-semibold text-text-primary">{fmt(c.requestedLoanAmount)}</p>
                                            
                                            <div>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wide
                                                    ${isEligible ? 'bg-emerald-light text-emerald border-[#A7F3D0]' : 'bg-rose-light text-rose border-[#FECDD3]'}`}>
                                                    {isEligible ? 'Approved' : 'Rejected'}
                                                </span>
                                            </div>
                                            
                                            <div>
                                                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border uppercase tracking-wider ${riskBadgeClass}`}>
                                                    {c.results?.riskCategory || '—'}
                                                </span>
                                            </div>
                                            
                                            <p className="text-text-muted font-medium">{formatDate(c.createdAt)}</p>
                                            
                                            <div className="w-8 flex justify-end text-text-muted group-hover:text-primary transition-colors">
                                                <ChevronRight size={18} />
                                            </div>
                                        </div>

                                        {/* Mobile row */}
                                        <div className="md:hidden px-5 py-4 flex items-center justify-between gap-3">
                                            <div className="flex flex-col pt-0.5">
                                                <p className="font-bold text-text-primary text-[14px] leading-tight">{c.loanType}</p>
                                                <p className="text-[12px] text-text-muted font-medium mt-1">
                                                    {fmt(c.requestedLoanAmount)} <span className="mx-1">•</span> {formatDate(c.createdAt)}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider
                                                    ${isEligible ? 'bg-emerald-light text-emerald border-[#A7F3D0]' : 'bg-rose-light text-rose border-[#FECDD3]'}`}>
                                                    {isEligible ? 'Approved' : 'Rejected'}
                                                </span>
                                                <ChevronRight size={16} className="text-text-muted" />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default LoanHistory
