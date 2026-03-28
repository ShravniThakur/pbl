import { useContext, useEffect, useMemo, useState } from "react"
import { AppContext } from "../context/AppContext"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { CheckCircle2, Search, XCircle } from "lucide-react"

// ─── Constants ────────────────────────────────────────────────────────────────

const LOAN_TYPES = [
    'Personal Loan', 'Home Loan', 'Education Loan', 'Vehicle Loan', 'Business Loan',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`

// ─── Sub-components ───────────────────────────────────────────────────────────

const LoadingScreen = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-border-default border-t-primary rounded-full animate-spin"></div>
    </div>
)

const TypePill = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-full text-[13px] font-bold border transition-colors duration-200
                    ${active
                        ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                        : 'bg-white border-border-default text-text-muted hover:border-primary/50 hover:text-primary hover:bg-[#F8F7F4]'
                    }`}
    >
        {label}
    </button>
)

const ProductCard = ({ product }) => {
    const {
        bankName, productName, logoUrl, description, features,
        loanType, minAmount, maxAmount,
        minInterestRate, maxInterestRate,
        minTenureMonths, maxTenureMonths,
        minCreditScore, minMonthlyIncome,
    } = product

    return (
        <div className="relative bg-surface border border-border-default rounded-[14px] overflow-hidden flex flex-col transition-shadow hover:shadow-card hover:border-primary/40">
            {/* Card header */}
            <div className="p-5 sm:p-6 flex flex-col gap-5 flex-1 relative z-0">
                <div className="flex items-start gap-3.5 pr-2">
                    {logoUrl ? (
                         <div className="w-12 h-12 rounded-[10px] bg-white border border-border-default p-1.5 flex items-center justify-center shrink-0 shadow-sm">
                             <img src={logoUrl} alt={bankName} className="w-full h-full object-contain" />
                         </div>
                    ) : (
                         <div className="w-12 h-12 rounded-[10px] bg-[#F8F7F4] border border-border-default flex items-center justify-center shrink-0 shadow-sm">
                             <span className="text-primary font-black text-lg">{bankName.charAt(0)}</span>
                         </div>
                    )}
                    <div className="flex flex-col justify-center min-w-0 pt-0.5">
                        <p className="text-[16px] font-bold text-text-primary leading-snug truncate">{productName}</p>
                        <p className="text-[13px] font-medium text-text-muted mt-0.5 truncate">{bankName}</p>
                    </div>
                </div>

                {/* Badge */}
                <div>
                     <span className="inline-block bg-[#F5F5F4] text-text-primary border border-border-default px-2.5 py-1 rounded-[6px] text-[11px] font-bold uppercase tracking-[0.05em]">
                        {loanType}
                    </span>
                </div>

                {/* Description */}
                {description && (
                    <p className="text-[13px] font-medium text-text-muted leading-relaxed line-clamp-2">{description}</p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mt-auto">
                    {[
                        { label: 'Interest',   value: `${minInterestRate}–${maxInterestRate}%` },
                        { label: 'Amt range',  value: `${fmt(minAmount).replace('₹', '')}–${fmt(maxAmount).replace('₹', '')}` },
                        { label: 'Term',       value: `${minTenureMonths}–${maxTenureMonths} m` },
                    ].map(({ label, value }) => (
                         <div key={label} className="bg-[#F8F7F4] border border-border-default rounded-[9px] px-2 py-2.5 text-center flex flex-col justify-center">
                             <p className="text-[10px] font-semibold text-text-muted uppercase tracking-[0.05em] mb-1 truncate">{label}</p>
                             <p className="text-[13px] font-bold text-primary leading-none truncate">{value}</p>
                         </div>
                    ))}
                </div>

                {/* Features */}
                {features?.length > 0 && (
                     <div className="pt-4 border-t border-border-default mt-1">
                         <ul className="flex flex-col gap-2">
                             {features.slice(0, 3).map((f, i) => (
                                 <li key={i} className="flex items-start gap-2.5 text-[13px] font-medium text-text-primary leading-snug">
                                     <CheckCircle2 size={16} className="text-emerald shrink-0 mt-[1px]" />
                                     <span>{f}</span>
                                 </li>
                             ))}
                         </ul>
                     </div>
                )}
            </div>

            {/* Eligibility footer */}
            <div className="bg-[#F8F7F4] border-t border-border-default px-5 sm:px-6 py-4 flex gap-6 items-center">
                <div className="flex flex-col">
                    <p className="text-[10px] text-text-muted uppercase tracking-[0.05em] font-bold mb-1">Min Credit</p>
                    <p className="text-[14px] font-black text-text-primary leading-none">
                        {minCreditScore === 0 ? 'None' : minCreditScore}
                    </p>
                </div>
                <div className="w-[1px] h-6 bg-border-default"></div>
                <div className="flex flex-col">
                    <p className="text-[10px] text-text-muted uppercase tracking-[0.05em] font-bold mb-1">Min Income</p>
                    <p className="text-[14px] font-black text-text-primary leading-none">
                        {minMonthlyIncome === 0 ? 'None' : fmt(minMonthlyIncome)}
                    </p>
                </div>
            </div>
        </div>
    )
}

// ─── LoanProducts ─────────────────────────────────────────────────────────────

const LoanProducts = () => {
    const { token, backend_url } = useContext(AppContext)
    const navigate = useNavigate()

    const [products,    setProducts]    = useState([])
    const [loading,     setLoading]     = useState(true)
    const [activeType,  setActiveType]  = useState('All')
    const [search,      setSearch]      = useState('')

    useEffect(() => {
        if (!token) navigate('/login')
    }, [token, navigate])

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get(`${backend_url}/api/loan-products`, {
                    headers: { Authorization: token },
                })
                if (res.data.success) setProducts(res.data.data || [])
            } catch (err) {
                console.error('Failed to load loan products:', err)
            } finally {
                setLoading(false)
            }
        }
        if (token) fetchProducts()
    }, [token, backend_url])

    const filtered = useMemo(() => products.filter(p => {
        const matchType   = activeType === 'All' || p.loanType === activeType
        const matchSearch = !search ||
            p.bankName.toLowerCase().includes(search.toLowerCase()) ||
            p.productName.toLowerCase().includes(search.toLowerCase())
        return matchType && matchSearch
    }), [products, activeType, search])

    if (loading) return <LoadingScreen />

    return (
        <div className="max-w-7xl w-full mx-auto px-8 md:px-12 py-12 md:py-16 flex flex-col gap-10 font-inter animate-fade-up">

            {/* Header */}
            <div>
                <h1 className="text-[40px] font-black text-sidebar-bg tracking-[-0.03em] leading-tight py-4">Loan Products Directory</h1>
                <p className="text-sm font-medium text-text-muted mt-1">
                    Explore terms, rates, and requirements for top financial products.
                </p>
            </div>

            {/* Summary stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {['All', ...LOAN_TYPES].map(type => {
                    const count = type === 'All'
                        ? products.length
                        : products.filter(p => p.loanType === type).length
                    return (
                        <button
                            key={type}
                            onClick={() => { setActiveType(type); setSearch('') }}
                            className={`bg-surface border rounded-[14px] p-4 text-left hover:shadow-sm
                                        duration-200 transition-all flex flex-col justify-center
                                        ${activeType === type
                                            ? 'border-primary/50 ring-1 ring-primary/20 shadow-sm'
                                            : 'border-border-default hover:border-primary/30'
                                        }`}
                        >
                            <p className={`text-[24px] font-black leading-none mb-1 ${activeType === type ? 'text-primary' : 'text-text-primary'}`}>
                                {count}
                            </p>
                            <p className="text-[12px] font-semibold text-text-muted uppercase tracking-[0.05em]">
                                {type === 'All' ? 'All Products' : type.replace(' Loan', '')}
                            </p>
                        </button>
                    )
                })}
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Type pills */}
                <div className="flex flex-wrap gap-2">
                    {['All', ...LOAN_TYPES].map(type => (
                        <TypePill
                            key={type}
                            label={type}
                            active={activeType === type}
                            onClick={() => setActiveType(type)}
                        />
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full lg:w-64">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted z-10" />
                    <input
                        type="text"
                        placeholder="Search banks or products..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="bg-white border border-border-default rounded-full pl-10 pr-4 py-2.5 text-text-primary
                                   text-sm font-medium focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)]
                                   transition-shadow duration-200 w-full placeholder:text-text-muted"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                            <XCircle size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Results count */}
            {(activeType !== 'All' || search) && (
                <div className="flex items-center justify-between -mt-3">
                    <p className="text-sm font-semibold text-text-muted">
                        Showing <span className="text-text-primary">{filtered.length}</span> {filtered.length === 1 ? 'product' : 'products'}
                    </p>
                    <button
                        onClick={() => { setActiveType('All'); setSearch('') }}
                        className="text-sm font-bold text-primary hover:text-primary-hover transition-colors"
                    >
                        Clear filters
                    </button>
                </div>
            )}

            {/* Product grid */}
            {filtered.length === 0 ? (
                <div className="bg-[#F8F7F4] border border-border-default rounded-[14px] p-12 text-center flex flex-col items-center">
                    <Search size={40} className="text-text-muted/50 mb-4" />
                    <p className="text-text-primary font-bold text-lg mb-1">No products found</p>
                    <p className="text-text-muted text-sm font-medium mb-4">Try adjusting your filters or search query.</p>
                    <button
                        onClick={() => { setActiveType('All'); setSearch('') }}
                        className="text-primary font-bold text-sm bg-primary/10 px-5 py-2 rounded-lg hover:bg-primary/20 transition-colors"
                    >
                        Clear filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 max-w-[1150px] mx-auto w-full">
                    {filtered.map(p => (
                        <ProductCard key={p._id} product={p} />
                    ))}
                </div>
            )}

            {/* CTA */}
            <div className="bg-primary/5 border border-primary/20 rounded-[14px] p-6 sm:p-8
                            flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                    <p className="text-[20px] font-bold text-primary mb-1">Ready to apply?</p>
                    <p className="text-sm font-medium text-text-primary/70">
                        Run an eligibility check to match with the best products for your profile securely using AI.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/loan-check')}
                    className="bg-primary hover:bg-primary-hover duration-200 text-white font-bold
                               px-6 py-3 rounded-[9px] text-sm whitespace-nowrap shadow-button-primary"
                >
                    Check Eligibility
                </button>
            </div>

        </div>
    )
}

export default LoanProducts
