import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Plus, Search, Filter, XCircle, LayoutDashboard, Edit2, Trash2 } from 'lucide-react'

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

const INPUT_CLASS = `bg-white border border-border-default rounded-[8px] px-3.5 py-2.5 text-text-primary text-[13px] font-medium focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)] transition-all duration-200 w-full placeholder:text-text-muted/60`

const Field = ({ label, children }) => (
    <div className="flex flex-col gap-1.5">
        <p className="text-[12px] font-bold text-text-primary uppercase tracking-[0.05em]">{label}</p>
        {children}
    </div>
)

const SectionHeader = ({ title }) => (
    <div className="border-b border-border-default pb-3 mb-4">
        <p className="text-[14px] font-bold text-text-primary uppercase tracking-[0.02em]">{title}</p>
    </div>
)

// ─── Stat Card (mirrors Dashboard.jsx StatCard) ───────────────────────────────

const StatCard = ({ label, value, colorClass }) => (
    <div className="bg-surface border border-border-default rounded-[14px] p-5 shadow-sm flex flex-col justify-between">
        <p className="text-[12px] font-bold text-text-muted uppercase tracking-[0.05em] mb-2">{label}</p>
        <p className={`text-[32px] font-black leading-none ${colorClass}`}>{value}</p>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface border border-border-default rounded-[16px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl font-inter overflow-hidden animate-slide-up">

                {/* Header */}
                <div className="bg-[#F8F7F4] border-b border-border-default px-6 py-4 flex items-center justify-between shrink-0">
                    <p className="text-[18px] font-bold text-text-primary tracking-[-0.01em]">
                        {product ? 'Edit Loan Product' : 'Create New Loan Product'}
                    </p>
                    <button
                        onClick={onClose}
                        className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-full hover:bg-black/5"
                        aria-label="Close modal"
                    >
                        <XCircle size={22} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="px-6 py-6 overflow-y-auto flex-1 custom-scrollbar flex flex-col gap-8 bg-surface">

                    {/* Lender */}
                    <div>
                        <SectionHeader title="Lender & Product Info" />
                        <div className="grid grid-cols-2 gap-5">
                            <Field label="Lender / Bank Name">
                                <input className={INPUT_CLASS} type="text" name="bankName"
                                    placeholder="e.g. HDFC Bank" value={form.bankName} onChange={change} />
                            </Field>
                            <Field label="Product Name">
                                <input className={INPUT_CLASS} type="text" name="productName"
                                    placeholder="e.g. Smart Home Loan" value={form.productName} onChange={change} />
                            </Field>
                            <div className="col-span-2">
                                <Field label="Lender Logo URL (Optional)">
                                    <input className={INPUT_CLASS} type="url" name="logoUrl"
                                        placeholder="https://example.com/logo.png" value={form.logoUrl} onChange={change} />
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
                                <Field label="Key Features (Comma-Separated)">
                                    <input className={INPUT_CLASS} type="text" name="features"
                                        placeholder="Zero processing fee, Doorstep service, Pre-approved offers"
                                        value={form.features} onChange={change} />
                                </Field>
                            </div>
                        </div>
                    </div>

                    {/* Loan type */}
                    <div>
                        <SectionHeader title="Loan Category" />
                        <Field label="Category / Type">
                            <select className={INPUT_CLASS} name="loanType" value={form.loanType} onChange={change}>
                                <option value="">Select loan type</option>
                                {LOAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </Field>
                    </div>

                    {/* Ranges */}
                    <div>
                        <SectionHeader title="Amount, Rate & Tenure constraints" />
                        <div className="grid grid-cols-2 gap-5">
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
                    <div>
                        <SectionHeader title="Minimum Eligibility Criteria" />
                        <div className="grid grid-cols-2 gap-5">
                            <Field label="Min Credit Score (CIBIL)">
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
                    <label className="flex items-center gap-3 cursor-pointer bg-[#F8F7F4] p-4 rounded-[10px] border border-border-default w-max">
                        <input
                            type="checkbox"
                            name="isActive"
                            checked={form.isActive}
                            onChange={change}
                            className="w-4 h-4 accent-primary rounded border-border-default"
                        />
                        <span className="text-[13px] font-bold text-text-primary">
                            Product is actively recommended to users
                        </span>
                    </label>

                    {error && (
                        <div className="flex gap-2 items-center bg-rose-light border border-[#FECDD3] rounded-[8px] px-4 py-3">
                            <div className="w-5 h-5 rounded-full bg-rose/20 flex items-center justify-center shrink-0">
                                <span className="text-rose font-black text-[10px]">!</span>
                            </div>
                            <p className="text-[13px] font-bold text-rose">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-[#F8F7F4] border-t border-border-default px-6 py-4 flex gap-3 justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="bg-white border border-border-default hover:bg-[#F5F5F4] transition-colors font-bold px-6 py-2.5 rounded-[9px] text-[13px] text-text-primary shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={submit}
                        disabled={loading}
                        className="bg-primary hover:bg-primary-hover transition-colors text-white font-bold px-6 py-2.5 rounded-[9px] text-[13px] shadow-button-primary disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div> : (product ? 'Save Changes' : 'Create Product')}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Delete Confirm ────────────────────────────────────────────────────────────

const DeleteConfirm = ({ onConfirm, onCancel, loading }) => (
    <div className="flex items-center gap-4 bg-rose-light border border-[#FECDD3] rounded-[10px] px-5 py-4 text-[13px] shadow-sm animate-fade-in mb-4">
        <div className="flex-1 flex flex-col">
            <p className="text-rose font-bold">Confirm Deletion</p>
            <p className="text-rose/80 font-medium mt-0.5">This action cannot be undone. Remove this product permanently?</p>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={onCancel}
                className="bg-white border border-[#FECDD3] hover:bg-rose/5 transition-colors font-bold px-4 py-2 rounded-[8px] text-[13px] text-rose"
            >
                Cancel
            </button>
            <button
                onClick={onConfirm}
                disabled={loading}
                className="bg-rose hover:bg-rose/90 transition-colors text-white font-bold px-4 py-2 rounded-[8px] text-[13px] shadow-sm disabled:opacity-50 min-w-[100px]"
            >
                {loading ? 'Deleting...' : 'Delete'}
            </button>
        </div>
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
        <div className="flex flex-col font-inter min-h-screen bg-slate-50">

            {/* Topbar */}
            <div className="fixed top-0 left-0 w-full h-[56px] bg-sidebar-bg border-b border-[#1E293B] shadow-sm flex items-center justify-between px-6 z-40 relative">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/30">
                        <LayoutDashboard size={18} className="text-primary-light" />
                    </div>
                    <p className="text-[16px] font-black text-white tracking-[-0.02em]">Admin Dashboard</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[11px] font-bold text-sidebar-text uppercase tracking-widest hidden sm:block bg-[#1E293B] px-3 py-1 rounded-full border border-[#334155]">
                        Restricted Area
                    </span>
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center bg-[#1E293B] border border-[#334155] w-9 h-9 rounded-full text-sidebar-text hover:text-white hover:border-rose hover:bg-rose/20 transition-colors"
                        title="Log out"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>

            {/* Page body */}
            <div className="max-w-[1400px] w-full mx-auto px-6 py-8 flex flex-col gap-8 flex-1 animate-fade-up">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-[40px] font-black text-sidebar-bg tracking-[-0.03em] leading-tight py-4">Loan Products Directory</h1>
                        <p className="text-[14px] font-medium text-text-muted mt-1">
                            Create, manage, and toggle products available for recommendation to users.
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="bg-primary hover:bg-primary-hover duration-200 text-white font-bold px-6 py-2.5 rounded-[9px] text-[13px] shadow-button-primary flex items-center justify-center gap-2 shrink-0"
                    >
                        <Plus size={16} /> Add New Product
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <StatCard label="Total Products" value={products.length} colorClass="text-text-primary" />
                    <StatCard label="Active Recommendations" value={activeCount} colorClass="text-emerald" />
                    <StatCard label="Inactive / Draft" value={inactiveCount} colorClass="text-amber-600" />
                </div>

                {/* Table Area Container */}
                <div className="bg-surface border border-border-default rounded-[14px] flex flex-col shadow-card">
                    
                    {/* Filters Banner */}
                    <div className="p-4 border-b border-border-default bg-[#F8F7F4]/50 rounded-t-[14px] flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="flex items-center gap-2 text-text-muted font-bold text-[13px] uppercase tracking-[0.05em]">
                            <Filter size={16} /> Filter Products
                        </div>
                        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                            <select
                                className="bg-white border border-border-default rounded-[8px] px-3.5 py-1.5 text-text-primary text-[13px] font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 appearance-none min-w-[160px] shadow-sm"
                                value={filterType}
                                onChange={e => setFilterType(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {LOAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>

                            <select
                                className="bg-white border border-border-default rounded-[8px] px-3.5 py-1.5 text-text-primary text-[13px] font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 appearance-none min-w-[160px] shadow-sm"
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>

                            {(filterType || filterStatus) && (
                                <button
                                    onClick={() => { setFilterType(''); setFilterStatus('') }}
                                    className="flex items-center justify-center bg-white text-text-muted hover:text-rose border border-border-default hover:border-rose rounded-[8px] px-3.5 py-1.5 text-[13px] font-bold transition-colors shrink-0 shadow-sm"
                                >
                                    <XCircle size={14} className="mr-1.5" /> Clear
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-4">
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
                            <div className="flex items-center justify-center py-24">
                                <div className="w-10 h-10 border-4 border-border-default border-t-primary rounded-full animate-spin"></div>
                            </div>
                        ) : visible.length === 0 ? (
                            <div className="py-20 text-center flex flex-col items-center">
                                <Search size={48} className="text-text-muted/30 mb-4" />
                                <p className="text-text-primary font-bold text-lg mb-1">
                                    {products.length === 0 ? 'No products created yet' : 'No products match filters'}
                                </p>
                                <p className="text-text-muted text-[13px] font-medium mb-6">
                                    {products.length === 0 ? 'Start adding loan products to recommend to your users.' : 'Try adjusting or clearing your filters.'}
                                </p>
                                {products.length === 0 && (
                                    <button
                                        onClick={openCreate}
                                        className="bg-primary hover:bg-primary-hover transition-colors text-white font-bold px-6 py-2.5 rounded-[9px] text-[13px] shadow-button-primary flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} /> Add First Product
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="border border-border-default rounded-[12px] overflow-hidden">
                                {/* Desktop header */}
                                <div className="hidden lg:grid grid-cols-[2fr_1fr_1.2fr_1fr_0.8fr_0.8fr_120px] gap-4 px-5 py-3.5 bg-[#F8F7F4] border-b border-border-default text-[11px] font-bold text-text-muted uppercase tracking-[0.05em] items-center">
                                    <p>Lender & Product</p>
                                    <p>Category</p>
                                    <p>Amount Range</p>
                                    <p>Interest Rate</p>
                                    <p>Min Score</p>
                                    <p>Status</p>
                                    <p className="text-right">Actions</p>
                                </div>

                                <div className="flex flex-col divide-y divide-border-default">
                                    {visible.map((p) => (
                                        <div key={p._id} className="group hover:bg-[#F8F7F4]/60 transition-colors">
                                            {/* Desktop row */}
                                            <div className="hidden lg:grid grid-cols-[2fr_1fr_1.2fr_1fr_0.8fr_0.8fr_120px] gap-4 px-5 py-4 text-[13px] items-center">
                                                <div className="flex items-center gap-3">
                                                    {p.logoUrl ? (
                                                        <img src={p.logoUrl} alt={p.bankName}
                                                            className="w-10 h-10 rounded-[8px] object-contain border border-border-default bg-white p-1 shrink-0" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-[8px] bg-white border border-border-default flex items-center justify-center shrink-0">
                                                            <span className="text-text-muted font-black text-[14px] uppercase">
                                                                {p.bankName.charAt(0)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-text-primary truncate">{p.productName}</p>
                                                        <p className="text-[12px] font-medium text-text-muted truncate mt-0.5">{p.bankName}</p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <span className="inline-block px-2.5 py-1 rounded-[6px] bg-white border border-border-default text-[11px] font-bold text-text-primary shadow-sm">
                                                        {p.loanType}
                                                    </span>
                                                </div>

                                                <div>
                                                    <p className="font-semibold text-text-primary text-[12px]">₹{fmt(p.minAmount)}</p>
                                                    <p className="font-semibold text-text-muted text-[12px] mt-0.5">to ₹{fmt(p.maxAmount)}</p>
                                                </div>

                                                <div>
                                                    <p className="font-bold text-text-primary">{p.minInterestRate}% - {p.maxInterestRate}%</p>
                                                </div>

                                                <div>
                                                    <p className="font-bold text-text-primary">{p.minCreditScore}</p>
                                                </div>

                                                <div>
                                                    <button
                                                        onClick={() => toggleActive(p)}
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-colors
                                                            ${p.isActive
                                                                ? 'bg-emerald-light text-emerald border-[#A7F3D0] hover:bg-emerald/20'
                                                                : 'bg-[#F5F5F4] text-text-muted border-border-default hover:bg-[#E5E5E5]'
                                                            }`}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${p.isActive ? 'bg-emerald' : 'bg-text-muted/40'}`}></span>
                                                        {p.isActive ? 'Active' : 'Inactive'}
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEdit(p)}
                                                        className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                                        title="Edit Product"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteId(p._id)}
                                                        className="p-1.5 text-text-muted hover:text-rose hover:bg-rose/10 rounded-md transition-colors"
                                                        title="Delete Product"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Mobile row */}
                                            <div className="lg:hidden px-4 py-4 flex flex-col gap-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        {p.logoUrl ? (
                                                            <img src={p.logoUrl} alt={p.bankName} className="w-10 h-10 rounded-[8px] object-contain border border-border-default bg-white p-1 shrink-0" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-[8px] bg-white border border-border-default flex items-center justify-center shrink-0">
                                                                <span className="text-text-muted font-black text-[14px]">
                                                                    {p.bankName.charAt(0)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-bold text-text-primary text-[14px] leading-tight">{p.productName}</p>
                                                            <p className="text-[12px] text-text-muted font-medium mt-0.5">{p.bankName} • {p.loanType}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button onClick={() => openEdit(p)} className="p-1.5 text-text-muted border border-transparent hover:bg-[#F5F5F4] hover:border-border-default rounded-md transition-all">
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button onClick={() => setDeleteId(p._id)} className="p-1.5 text-text-muted border border-transparent hover:bg-rose/5 hover:text-rose hover:border-[#FECDD3] rounded-md transition-all">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between bg-[#F8F7F4] p-2.5 rounded-[8px] border border-border-default">
                                                    <div className="flex flex-col gap-0.5 text-[12px]">
                                                        <p className="font-semibold text-text-primary">₹{fmt(p.minAmount)} - ₹{fmt(p.maxAmount)}</p>
                                                        <p className="font-medium text-text-muted">{p.minInterestRate}% - {p.maxInterestRate}% APR</p>
                                                    </div>
                                                    <button
                                                        onClick={() => toggleActive(p)}
                                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider transition-colors
                                                            ${p.isActive
                                                                ? 'bg-emerald-light text-emerald border-[#A7F3D0]'
                                                                : 'bg-white text-text-muted border-border-default'
                                                            }`}
                                                    >
                                                        {p.isActive ? 'Active' : 'Inactive'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
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
