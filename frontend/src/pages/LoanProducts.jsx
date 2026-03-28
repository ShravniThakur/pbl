import { useContext, useEffect, useMemo, useState } from "react"
import { AppContext } from "../context/AppContext"
import { useNavigate } from "react-router-dom"
import axios from "axios"

// ─── Constants ────────────────────────────────────────────────────────────────

const LOAN_TYPES = [
    'Personal Loan', 'Home Loan', 'Education Loan', 'Vehicle Loan', 'Business Loan',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`

// ─── Sub-components ───────────────────────────────────────────────────────────

const LoadingScreen = () => (
    <div className="flex items-center justify-center min-h-screen text-accentSoft text-xl font-bold">
        <span className="animate-pulse">Loading...</span>
    </div>
)

const TypePill = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors duration-200
                    ${active
                        ? 'bg-button text-white border-button'
                        : 'bg-card border-borderColour text-bodyText hover:border-button/50 hover:text-accentSoft'
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
        <div className="bg-card border border-borderColour rounded-xl overflow-hidden
                        hover:border-button/40 hover:shadow-sm transition-all duration-200 flex flex-col">

            {/* Card header */}
            <div className="p-5 flex items-start gap-3 border-b border-borderColour">
                {logoUrl ? (
                    <img
                        src={logoUrl}
                        alt={bankName}
                        className="w-11 h-11 rounded-lg object-contain border border-borderColour bg-white p-1 flex-shrink-0"
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                    />
                ) : null}
                <div
                    className="w-11 h-11 rounded-lg bg-slate-100 border border-borderColour
                               items-center justify-center flex-shrink-0"
                    style={{ display: logoUrl ? 'none' : 'flex' }}
                >
                    <span className="text-accentSoft font-black text-base">{bankName.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-heading font-black text-sm leading-snug truncate">{productName}</p>
                    <p className="text-bodyText/50 text-xs mt-0.5">{bankName}</p>
                    <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wide
                                     bg-button/10 text-accentSoft border border-button/20 px-2 py-0.5 rounded-full">
                        {loanType}
                    </span>
                </div>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-3 gap-px bg-borderColour border-b border-borderColour">
                {[
                    { label: 'Interest Rate', value: `${minInterestRate}% – ${maxInterestRate}%` },
                    { label: 'Loan Amount',   value: `${fmt(minAmount)} – ${fmt(maxAmount)}` },
                    { label: 'Tenure',        value: `${minTenureMonths} – ${maxTenureMonths} mo` },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-card px-3 py-3 text-center">
                        <p className="text-bodyText/40 text-[9px] uppercase tracking-wide mb-1">{label}</p>
                        <p className="text-accentSoft font-black text-[11px] leading-tight">{value}</p>
                    </div>
                ))}
            </div>

            {/* Description + features */}
            <div className="p-5 flex flex-col gap-3 flex-1">
                {description && (
                    <p className="text-bodyText/60 text-xs leading-relaxed line-clamp-2">{description}</p>
                )}

                {features?.length > 0 && (
                    <ul className="flex flex-col gap-1.5">
                        {features.slice(0, 3).map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-bodyText/70">
                                <span className="text-success font-bold flex-shrink-0 mt-0.5">✓</span>
                                {f}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Eligibility footer */}
            <div className="px-5 pb-5 flex flex-wrap gap-3 border-t border-borderColour pt-4">
                <div className="flex flex-col">
                    <p className="text-[10px] text-bodyText/40 uppercase tracking-wide">Min Credit Score</p>
                    <p className="text-sm font-black text-heading">
                        {minCreditScore === 0 ? 'No min' : minCreditScore}
                    </p>
                </div>
                <div className="flex flex-col">
                    <p className="text-[10px] text-bodyText/40 uppercase tracking-wide">Min Monthly Income</p>
                    <p className="text-sm font-black text-heading">
                        {minMonthlyIncome === 0 ? 'No min' : fmt(minMonthlyIncome)}
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
        <div className="flex flex-col gap-8 text-bodyText font-sans m-5">

            {/* Header */}
            <div>
                <p className="text-3xl font-black text-heading">Loan Products ★</p>
                <p className="text-sm text-bodyText/60 mt-1">
                    Browse all available loan products from top lenders.
                </p>
            </div>

            {/* Summary stat */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {['All', ...LOAN_TYPES].map(type => {
                    const count = type === 'All'
                        ? products.length
                        : products.filter(p => p.loanType === type).length
                    return (
                        <button
                            key={type}
                            onClick={() => { setActiveType(type); setSearch('') }}
                            className={`bg-card border rounded-2xl p-4 text-left hover:bg-cardHover
                                        duration-300 transition-all
                                        ${activeType === type
                                            ? 'border-button/50 ring-1 ring-button/20'
                                            : 'border-borderColour'
                                        }`}
                        >
                            <p className={`text-2xl font-black ${activeType === type ? 'text-accentSoft' : 'text-heading'}`}>
                                {count}
                            </p>
                            <p className="text-xs text-bodyText/50 mt-1 font-semibold leading-tight">
                                {type === 'All' ? 'All Products' : type}
                            </p>
                        </button>
                    )
                })}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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
                <input
                    type="text"
                    placeholder="Search bank or product..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-card border border-borderColour rounded-lg px-4 py-2 text-bodyText
                               text-sm focus:outline-none focus:border-button transition-colors duration-200
                               w-full sm:w-56"
                />
            </div>

            {/* Results count */}
            {(activeType !== 'All' || search) && (
                <div className="flex items-center justify-between -mt-4">
                    <p className="text-sm text-bodyText/50">
                        {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
                    </p>
                    {(activeType !== 'All' || search) && (
                        <button
                            onClick={() => { setActiveType('All'); setSearch('') }}
                            className="text-xs text-accentSoft font-semibold hover:text-buttonHover duration-200"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            )}

            {/* Product grid */}
            {filtered.length === 0 ? (
                <div className="bg-card border border-borderColour rounded-2xl p-12 text-center">
                    <p className="text-bodyText/50 mb-2">No products found.</p>
                    <button
                        onClick={() => { setActiveType('All'); setSearch('') }}
                        className="text-accentSoft text-sm font-semibold hover:text-buttonHover duration-200"
                    >
                        Clear filters →
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map(p => (
                        <ProductCard key={p._id} product={p} />
                    ))}
                </div>
            )}

            {/* CTA */}
            <div className="bg-card border border-borderColour rounded-2xl p-6
                            flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <p className="text-heading font-black text-lg">Ready to check your eligibility?</p>
                    <p className="text-sm text-bodyText/60 mt-0.5">
                        Run a check to see which products you qualify for.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/loan-check')}
                    className="bg-button hover:bg-buttonHover duration-300 text-white font-bold
                               px-6 py-2.5 rounded-full text-sm whitespace-nowrap"
                >
                    Check Eligibility →
                </button>
            </div>

        </div>
    )
}

export default LoanProducts
