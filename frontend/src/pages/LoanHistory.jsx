import { useContext, useEffect, useState, useMemo } from "react"
import { AppContext } from "../context/AppContext"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"

const LOAN_TYPES = ['Personal Loan', 'Home Loan', 'Education Loan', 'Vehicle Loan', 'Business Loan']

const RISK_COLOR = {
    'Very Low': 'text-success',
    'Low': 'text-success',
    'Medium': 'text-yellow-400',
    'High': 'text-danger',
    'Very High': 'text-danger',
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
        <div className="flex items-center justify-center min-h-screen text-accentSoft text-xl font-bold">
            Loading...
        </div>
    )

    if (error) return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <p className="text-danger font-semibold">{error}</p>
            <button
                onClick={() => window.location.reload()}
                className="bg-button hover:bg-buttonHover duration-300 text-white font-bold px-5 py-2 rounded-full text-sm"
            >
                Retry
            </button>
        </div>
    )

    return (
        <div className="flex flex-col gap-8 text-bodyText font-sans m-5">

            {/* Header */}
            <div>
                <p className="text-3xl font-black text-heading">Loan History ▤</p>
                <p className="text-sm text-bodyText/60 mt-1">All your past loan eligibility checks.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold text-accentSoft uppercase tracking-wide">Loan Type</p>
                    <select
                        className="bg-card border border-borderColour rounded-lg px-3 py-2 text-bodyText text-sm focus:outline-none focus:border-button transition-colors duration-200"
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                    >
                        <option value="">All Types</option>
                        {LOAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold text-accentSoft uppercase tracking-wide">Result</p>
                    <select
                        className="bg-card border border-borderColour rounded-lg px-3 py-2 text-bodyText text-sm focus:outline-none focus:border-button transition-colors duration-200"
                        value={filterResult}
                        onChange={e => setFilterResult(e.target.value)}
                    >
                        <option value="">All Results</option>
                        <option value="Eligible">Eligible</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
                {(filterType || filterResult) && (
                    <div className="flex items-end">
                        <button
                            onClick={() => { setFilterType(''); setFilterResult('') }}
                            className="border border-borderColour hover:bg-card duration-300 text-bodyText text-sm font-semibold px-4 py-2 rounded-lg"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>

            {/* Summary row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Total', value: checks.length, color: 'text-accentSoft' },
                    { label: 'Eligible', value: eligibleCount, color: 'text-success' },
                    { label: 'Rejected', value: rejectedCount, color: 'text-danger' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-card border border-borderColour rounded-xl p-4 text-center hover:bg-cardHover duration-300">
                        <p className={`text-2xl font-black ${color}`}>{value}</p>
                        <p className="text-xs text-bodyText/60 mt-1">{label}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="bg-card border border-borderColour rounded-xl p-12 text-center">
                    <p className="text-bodyText/50 mb-4">
                        {checks.length === 0 ? 'No eligibility checks yet.' : 'No checks match your filters.'}
                    </p>
                    {checks.length === 0 && (
                        <button
                            onClick={() => navigate('/loan-check')}
                            className="bg-button hover:bg-buttonHover duration-300 text-white font-bold px-5 py-2 rounded-full text-sm"
                        >
                            Run Your First Check →
                        </button>
                    )}
                </div>
            ) : (
                <div className="border border-borderColour rounded-xl overflow-hidden">
                    {/* Desktop header */}
                    <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_0.5fr] gap-3 font-bold p-3 bg-card border-b border-borderColour text-sm text-accentSoft">
                        <p>Loan Type</p>
                        <p>Requested</p>
                        <p>Result</p>
                        <p>Risk</p>
                        <p>Date</p>
                        <p></p>
                    </div>

                    {filtered.map((c) => (
                        <div
                            key={c._id}
                            onClick={() => navigate(`/loan-history/${c._id}`)}
                            className="cursor-pointer border-b border-borderColour hover:bg-card duration-200 transition-colors last:border-b-0"
                        >
                            {/* Desktop row */}
                            <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_0.5fr] gap-3 p-3 text-sm items-center">
                                <p className="font-semibold text-heading">{c.loanType}</p>
                                <p>{fmt(c.requestedLoanAmount)}</p>
                                <p className={`font-bold ${c.results?.eligible ? 'text-success' : 'text-danger'}`}>
                                    {c.results?.eligible ? '✓ Eligible' : '✗ Rejected'}
                                </p>
                                <p className={RISK_COLOR[c.results?.riskCategory] || 'text-bodyText'}>
                                    {c.results?.riskCategory || '—'}
                                </p>
                                <p className="text-bodyText/60">{formatDate(c.createdAt)}</p>
                                <p className="text-accentSoft text-xs font-semibold">View →</p>
                            </div>

                            {/* Mobile row */}
                            <div className="md:hidden px-4 py-3 flex items-center justify-between gap-3">
                                <div>
                                    <p className="font-bold text-heading">{c.loanType}</p>
                                    <p className="text-xs text-bodyText/60 mt-0.5">
                                        {fmt(c.requestedLoanAmount)} · {formatDate(c.createdAt)}
                                    </p>
                                    {c.results?.riskCategory && (
                                        <p className={`text-xs mt-0.5 ${RISK_COLOR[c.results.riskCategory]}`}>
                                            {c.results.riskCategory} Risk
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <p className={`font-bold text-sm ${c.results?.eligible ? 'text-success' : 'text-danger'}`}>
                                        {c.results?.eligible ? '✓ Eligible' : '✗ Rejected'}
                                    </p>
                                    <p className="text-xs text-accentSoft">View →</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    )
}

export default LoanHistory
