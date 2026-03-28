import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Constants ────────────────────────────────────────────────────────────────

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const LOAN_TYPES = [
    'Personal Loan', 'Home Loan', 'Education Loan', 'Vehicle Loan', 'Business Loan',
]

const EMPTY_FORM = {
    bankName:         '',
    productName:      '',
    logoUrl:          '',
    description:      '',
    features:         '',   // comma-separated in the UI, split before save
    loanType:         '',
    minAmount:        '',
    maxAmount:        '',
    minInterestRate:  '',
    maxInterestRate:  '',
    minTenureMonths:  '',
    maxTenureMonths:  '',
    minCreditScore:   '600',
    minMonthlyIncome: '0',
    isActive:         true,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => Number(n).toLocaleString('en-IN')

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
    }
}

// ─── Shared primitives (match app-wide style) ─────────────────────────────────

const INPUT_CLASS = `bg-white border border-borderColour rounded-lg px-3 py-2 text-bodyText text-sm
    focus:outline-none focus:border-button transition-colors duration-200 w-full`

const Field = ({ label, children }) => (
    <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-accentSoft uppercase tracking-wide">{label}</p>
        {children}
    </div>
)

const SectionHeader = ({ title }) => (
    <div className="border-b border-borderColour pb-3 mb-4">
        <p className="text-sm font-black text-heading">{title}</p>
    </div>
)

// ─── Stat Card (mirrors Dashboard.jsx StatCard) ───────────────────────────────

const StatCard = ({ label, value, color }) => (
    <div className="bg-card border border-borderColour rounded-2xl p-5 hover:bg-cardHover duration-300">
        <p className="text-xs font-semibold text-bodyText/60 uppercase tracking-wide mb-2">{label}</p>
        <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
)

// ─── Product Modal ────────────────────────────────────────────────────────────

const ProductModal = ({ product, onClose, onSave }) => {
    const [form,    setForm]    = useState(EMPTY_FORM)
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState('')

    useEffect(() => {
        if (product) {
            setForm({
                ...product,
                features: Array.isArray(product.features)
                    ? product.features.join(', ')
                    : product.features || '',
            })
        } else {
            setForm(EMPTY_FORM)
        }
    }, [product])

    const change = (e) => {
        const { name, value, type, checked } = e.target
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
        setError('')
    }

    const submit = async () => {
        setLoading(true)
        setError('')
        try {
            const payload = {
                ...form,
                features:         form.features.split(',').map(f => f.trim()).filter(Boolean),
                minAmount:        Number(form.minAmount),
                maxAmount:        Number(form.maxAmount),
                minInterestRate:  Number(form.minInterestRate),
                maxInterestRate:  Number(form.maxInterestRate),
                minTenureMonths:  Number(form.minTenureMonths),
                maxTenureMonths:  Number(form.maxTenureMonths),
                minCreditScore:   Number(form.minCreditScore),
                minMonthlyIncome: Number(form.minMonthlyIncome),
            }
            const url    = product
                ? `${BACKEND_URL}/api/loan-products/admin/${product._id}`
                : `${BACKEND_URL}/api/loan-products/admin`
            const method = product ? 'PUT' : 'POST'
            const res    = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) })
            const json   = await res.json()
            if (!json.success) throw new Error(json.message)
            onSave()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
            <div className="bg-white border border-borderColour rounded-2xl w-full max-w-2xl
                            max-h-[90vh] overflow-y-auto shadow-xl font-sans">

                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-borderColour px-6 py-4
                                flex items-center justify-between">
                    <p className="text-lg font-black text-heading">
                        {product ? 'Edit Loan Product' : 'Add Loan Product'}
                    </p>
                    <button
                        onClick={onClose}
                        className="text-bodyText/40 hover:text-bodyText duration-200 text-xl leading-none"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6 flex flex-col gap-6">

                    {/* Lender */}
                    <div className="bg-card border border-borderColour rounded-xl p-5">
                        <SectionHeader title="Lender Info" />
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Bank Name">
                                <input className={INPUT_CLASS} type="text" name="bankName"
                                    placeholder="e.g. HDFC Bank" value={form.bankName} onChange={change} />
                            </Field>
                            <Field label="Product Name">
                                <input className={INPUT_CLASS} type="text" name="productName"
                                    placeholder="e.g. Smart Home Loan" value={form.productName} onChange={change} />
                            </Field>
                            <div className="col-span-2">
                                <Field label="Logo URL (optional)">
                                    <input className={INPUT_CLASS} type="url" name="logoUrl"
                                        placeholder="https://..." value={form.logoUrl} onChange={change} />
                                </Field>
                            </div>
                            <div className="col-span-2">
                                <Field label="Description">
                                    <textarea
                                        name="description" rows={2} value={form.description} onChange={change}
                                        placeholder="Short description of the product"
                                        className={`${INPUT_CLASS} resize-none`}
                                    />
                                </Field>
                            </div>
                            <div className="col-span-2">
                                <Field label="Features (comma-separated)">
                                    <input className={INPUT_CLASS} type="text" name="features"
                                        placeholder="Zero processing fee, Doorstep service, Pre-approved offers"
                                        value={form.features} onChange={change} />
                                </Field>
                            </div>
                        </div>
                    </div>

                    {/* Loan type */}
                    <div className="bg-card border border-borderColour rounded-xl p-5">
                        <SectionHeader title="Loan Type" />
                        <Field label="Type">
                            <select className={INPUT_CLASS} name="loanType" value={form.loanType} onChange={change}>
                                <option value="">Select loan type</option>
                                {LOAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </Field>
                    </div>

                    {/* Ranges */}
                    <div className="bg-card border border-borderColour rounded-xl p-5">
                        <SectionHeader title="Amount, Rate & Tenure" />
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Min Amount (₹)">
                                <input className={INPUT_CLASS} type="number" name="minAmount"
                                    placeholder="100000" value={form.minAmount} onChange={change} />
                            </Field>
                            <Field label="Max Amount (₹)">
                                <input className={INPUT_CLASS} type="number" name="maxAmount"
                                    placeholder="10000000" value={form.maxAmount} onChange={change} />
                            </Field>
                            <Field label="Min Interest Rate (%)">
                                <input className={INPUT_CLASS} type="number" name="minInterestRate"
                                    placeholder="8.5" value={form.minInterestRate} onChange={change} />
                            </Field>
                            <Field label="Max Interest Rate (%)">
                                <input className={INPUT_CLASS} type="number" name="maxInterestRate"
                                    placeholder="14.0" value={form.maxInterestRate} onChange={change} />
                            </Field>
                            <Field label="Min Tenure (months)">
                                <input className={INPUT_CLASS} type="number" name="minTenureMonths"
                                    placeholder="12" value={form.minTenureMonths} onChange={change} />
                            </Field>
                            <Field label="Max Tenure (months)">
                                <input className={INPUT_CLASS} type="number" name="maxTenureMonths"
                                    placeholder="240" value={form.maxTenureMonths} onChange={change} />
                            </Field>
                        </div>
                    </div>

                    {/* Eligibility */}
                    <div className="bg-card border border-borderColour rounded-xl p-5">
                        <SectionHeader title="Eligibility Criteria" />
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Min Credit Score">
                                <input className={INPUT_CLASS} type="number" name="minCreditScore"
                                    placeholder="600" value={form.minCreditScore} onChange={change} />
                            </Field>
                            <Field label="Min Monthly Income (₹)">
                                <input className={INPUT_CLASS} type="number" name="minMonthlyIncome"
                                    placeholder="25000" value={form.minMonthlyIncome} onChange={change} />
                            </Field>
                        </div>
                    </div>

                    {/* Active toggle */}
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="isActive"
                            checked={form.isActive}
                            onChange={change}
                            className="w-4 h-4 accent-button"
                        />
                        <span className="text-sm text-bodyText">
                            Product is active (visible to recommendation engine)
                        </span>
                    </label>

                    {error && (
                        <div className="flex gap-2 items-start bg-danger/5 border border-danger/20
                                        rounded-xl px-4 py-3">
                            <span className="text-danger font-bold flex-shrink-0">✗</span>
                            <p className="text-danger text-sm">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-borderColour px-6 py-4
                                flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="border border-borderColour hover:bg-card duration-300
                                   font-bold px-5 py-2 rounded-full text-sm text-bodyText"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={submit}
                        disabled={loading}
                        className="bg-button hover:bg-buttonHover duration-300 text-white font-black
                                   px-6 py-2 rounded-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : product ? 'Save Changes' : 'Create Product'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Delete Confirm (inline, mirrors FinancialProfile.jsx pattern) ─────────────

const DeleteConfirm = ({ onConfirm, onCancel, loading }) => (
    <div className="flex items-center gap-3 bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 text-sm">
        <p className="text-danger font-semibold flex-1">Delete this product? This cannot be undone.</p>
        <button
            onClick={onConfirm}
            disabled={loading}
            className="bg-danger hover:bg-danger/80 duration-200 text-white font-bold
                       px-4 py-1.5 rounded-lg text-xs disabled:opacity-50"
        >
            {loading ? 'Deleting...' : 'Yes, delete'}
        </button>
        <button
            onClick={onCancel}
            className="border border-borderColour hover:bg-card duration-200 font-bold
                       px-4 py-1.5 rounded-lg text-xs text-bodyText"
        >
            Cancel
        </button>
    </div>
)

// ─── Main Dashboard ────────────────────────────────────────────────────────────

const AdminDashboard = () => {
    const [products,      setProducts]      = useState([])
    const [loading,       setLoading]       = useState(true)
    const [modalOpen,     setModalOpen]     = useState(false)
    const [editTarget,    setEditTarget]    = useState(null)
    const [deleteId,      setDeleteId]      = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [filterType,    setFilterType]    = useState('')
    const [filterStatus,  setFilterStatus]  = useState('')
    const navigate = useNavigate()

    const fetchProducts = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`${BACKEND_URL}/api/loan-products/admin/all`, { headers: authHeaders() })
            if (res.status === 401) { navigate('/admin/login'); return }
            const json = await res.json()
            setProducts(json.data || [])
        } catch {
            // non-fatal — user sees empty state
        } finally {
            setLoading(false)
        }
    }, [navigate])

    useEffect(() => { fetchProducts() }, [fetchProducts])

    const handleLogout = () => {
        localStorage.removeItem('adminToken')
        navigate('/admin/login')
    }

    const openCreate = ()  => { setEditTarget(null); setModalOpen(true) }
    const openEdit   = (p) => { setEditTarget(p);    setModalOpen(true) }
    const closeModal = ()  => { setModalOpen(false); setEditTarget(null) }
    const onSave     = ()  => { closeModal(); fetchProducts() }

    const confirmDelete = async () => {
        setDeleteLoading(true)
        try {
            await fetch(`${BACKEND_URL}/api/loan-products/admin/${deleteId}`, {
                method: 'DELETE', headers: authHeaders(),
            })
            setDeleteId(null)
            fetchProducts()
        } finally {
            setDeleteLoading(false)
        }
    }

    const toggleActive = async (p) => {
        await fetch(`${BACKEND_URL}/api/loan-products/admin/${p._id}`, {
            method:  'PUT',
            headers: authHeaders(),
            body:    JSON.stringify({ isActive: !p.isActive }),
        })
        fetchProducts()
    }

    const visible = products.filter(p => {
        if (filterType   && p.loanType !== filterType) return false
        if (filterStatus === 'Active'   && !p.isActive) return false
        if (filterStatus === 'Inactive' &&  p.isActive) return false
        return true
    })

    const activeCount   = products.filter(p => p.isActive).length
    const inactiveCount = products.length - activeCount

    return (
        <div className="flex flex-col gap-8 text-bodyText font-sans min-h-screen bg-white">

            {/* Topbar — identical height/style to app Navbar */}
            <div className="fixed z-50 h-18 w-full bg-white border-b border-borderColour
                            flex items-center justify-between px-5">
                <p className="text-lg font-black text-heading">Admin Dashboard ⬡</p>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-bodyText/40 uppercase tracking-wide hidden sm:block">
                        Loan Products
                    </span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-borderColour
                                   text-heading font-semibold text-sm hover:bg-button hover:text-white
                                   hover:border-button transition-colors duration-200 cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
                             viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                        </svg>
                        Log out
                    </button>
                </div>
            </div>

            {/* Page body */}
            <div className="mt-18 flex flex-col gap-8 m-5">

                {/* Header */}
                <div>
                    <p className="text-3xl font-black text-heading">Loan Products 📋</p>
                    <p className="text-sm text-bodyText/60 mt-1">
                        Create and manage products recommended to eligible users.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <StatCard label="Total Products" value={products.length} color="text-accentSoft" />
                    <StatCard label="Active"         value={activeCount}     color="text-success"    />
                    <StatCard label="Inactive"       value={inactiveCount}   color="text-danger"     />
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                            className="bg-card border border-borderColour rounded-lg px-3 py-2
                                       text-bodyText text-sm focus:outline-none focus:border-button
                                       transition-colors duration-200"
                        >
                            <option value="">All Types</option>
                            {LOAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>

                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="bg-card border border-borderColour rounded-lg px-3 py-2
                                       text-bodyText text-sm focus:outline-none focus:border-button
                                       transition-colors duration-200"
                        >
                            <option value="">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>

                        {(filterType || filterStatus) && (
                            <button
                                onClick={() => { setFilterType(''); setFilterStatus('') }}
                                className="border border-borderColour hover:bg-card duration-200
                                           text-bodyText text-sm font-semibold px-4 py-2 rounded-lg"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <button
                        onClick={openCreate}
                        className="bg-button hover:bg-buttonHover duration-300 text-white font-black
                                   px-5 py-2 rounded-full text-sm"
                    >
                        + Add Product
                    </button>
                </div>

                {/* Inline delete confirm */}
                {deleteId && (
                    <DeleteConfirm
                        onConfirm={confirmDelete}
                        onCancel={() => setDeleteId(null)}
                        loading={deleteLoading}
                    />
                )}

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-accentSoft text-xl font-bold">
                        <span className="animate-pulse">Loading...</span>
                    </div>
                ) : visible.length === 0 ? (
                    <div className="bg-card border border-borderColour rounded-2xl p-12 text-center">
                        <p className="text-bodyText/50 mb-4">
                            {products.length === 0
                                ? 'No products yet. Add your first loan product.'
                                : 'No products match your filters.'}
                        </p>
                        {products.length === 0 && (
                            <button
                                onClick={openCreate}
                                className="bg-button hover:bg-buttonHover duration-300 text-white
                                           font-bold px-5 py-2 rounded-full text-sm"
                            >
                                Add First Product →
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="border border-borderColour rounded-2xl overflow-hidden">
                        {/* Desktop header */}
                        <div className="hidden md:grid grid-cols-[2fr_1fr_1.2fr_1fr_1fr_0.8fr_0.5fr]
                                        gap-3 font-bold p-3 bg-card border-b border-borderColour
                                        text-sm text-accentSoft">
                            <p>Bank / Product</p>
                            <p>Type</p>
                            <p>Amount Range</p>
                            <p>Rate</p>
                            <p>Min Score</p>
                            <p>Status</p>
                            <p></p>
                        </div>

                        {visible.map((p) => (
                            <div key={p._id}
                                 className="border-b border-borderColour last:border-b-0
                                            hover:bg-card duration-200 transition-colors">

                                {/* Desktop row */}
                                <div className="hidden md:grid grid-cols-[2fr_1fr_1.2fr_1fr_1fr_0.8fr_0.5fr]
                                                gap-3 p-3 text-sm items-center">
                                    <div className="flex items-center gap-3">
                                        {p.logoUrl ? (
                                            <img src={p.logoUrl} alt={p.bankName}
                                                 className="w-8 h-8 rounded-lg object-contain border
                                                            border-borderColour bg-white p-0.5 flex-shrink-0" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 border
                                                            border-borderColour flex items-center
                                                            justify-center flex-shrink-0">
                                                <span className="text-accentSoft font-black text-sm">
                                                    {p.bankName.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="font-semibold text-heading truncate">{p.productName}</p>
                                            <p className="text-bodyText/50 text-xs">{p.bankName}</p>
                                        </div>
                                    </div>

                                    <p className="text-bodyText/70">{p.loanType}</p>

                                    <p className="text-bodyText/70 text-xs">
                                        ₹{fmt(p.minAmount)} – ₹{fmt(p.maxAmount)}
                                    </p>

                                    <p className="text-bodyText/70">{p.minInterestRate}%–{p.maxInterestRate}%</p>

                                    <p className="text-bodyText/70">{p.minCreditScore}</p>

                                    <button
                                        onClick={() => toggleActive(p)}
                                        className={`text-xs font-bold px-3 py-1 rounded-full transition-colors
                                                    ${p.isActive
                                                        ? 'bg-success/10 text-success border border-success/30 hover:bg-success/20'
                                                        : 'bg-card text-bodyText/50 border border-borderColour hover:bg-cardHover'
                                                    }`}
                                    >
                                        {p.isActive ? '● Active' : '○ Inactive'}
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEdit(p)}
                                            className="text-accentSoft hover:text-buttonHover
                                                       duration-200 text-xs font-semibold"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(p._id)}
                                            className="text-danger/60 hover:text-danger
                                                       duration-200 text-xs font-semibold"
                                        >
                                            Del
                                        </button>
                                    </div>
                                </div>

                                {/* Mobile row */}
                                <div className="md:hidden px-4 py-3 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-bold text-heading">{p.productName}</p>
                                        <p className="text-xs text-bodyText/60 mt-0.5">
                                            {p.bankName} · {p.loanType}
                                        </p>
                                        <p className="text-xs text-bodyText/50 mt-0.5">
                                            ₹{fmt(p.minAmount)}–₹{fmt(p.maxAmount)} ·{' '}
                                            {p.minInterestRate}%–{p.maxInterestRate}%
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`text-xs font-bold
                                                          ${p.isActive ? 'text-success' : 'text-bodyText/40'}`}>
                                            {p.isActive ? '● Active' : '○ Inactive'}
                                        </span>
                                        <button
                                            onClick={() => openEdit(p)}
                                            className="text-accentSoft text-xs font-semibold"
                                        >
                                            Edit →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            {modalOpen && (
                <ProductModal
                    product={editTarget}
                    onClose={closeModal}
                    onSave={onSave}
                />
            )}
        </div>
    )
}

export default AdminDashboard
