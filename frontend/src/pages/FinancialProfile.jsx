import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { AppContext } from "../context/AppContext"
import axios from "axios"
import { toast } from "react-toastify"
import {
    GENDER, MARITAL_STATUS, CITY_TIER, RESIDENTIAL_STATUS, RESIDENT_TYPE,
    EMPLOYMENT_TYPE, EMPLOYER_TYPE, PAYMENT_HISTORY_FLAG, STATUS, NON_EARNERS
} from "../utils/enums"

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY = {
    age: '', gender: '', maritalStatus: '', cityTier: '', residentialStatus: '',
    residentType: '', employmentType: '', monthlyNetIncome: '', employmentTenureMonths: '',
    employerType: 'Not Applicable', existingEmis: [], creditCardDues: [], otherLoans: [],
    creditScore: '', recentLoanInquiries: [], paymentHistoryFlag: 'Clean'
}

const INPUT_CLASS = `bg-black/30 border border-borderColour rounded-lg px-3 py-2 text-bodyText text-sm
    focus:outline-none focus:border-button transition-colors duration-200
    disabled:opacity-50 disabled:cursor-not-allowed w-full`

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a saved profile object into controlled-input-friendly form state */
const profileToForm = (p) => ({
    ...p,
    age:                    String(p.age                    ?? ''),
    monthlyNetIncome:       String(p.monthlyNetIncome       ?? ''),
    employmentTenureMonths: String(p.employmentTenureMonths ?? ''),
    creditScore:            String(p.creditScore            ?? ''),
})

/** Attach a stable `_id` to list items when they are added */
const withId = (obj) => ({ ...obj, _id: crypto.randomUUID() })

// ─── Sub-components (outside component to keep identity stable) ───────────────

const LoadingScreen = () => (
    <div
        role="status"
        aria-busy="true"
        aria-label="Loading financial profile"
        className="flex items-center justify-center min-h-screen text-accentSoft text-xl font-bold"
    >
        <span className="animate-pulse">Loading...</span>
    </div>
)

const SectionHeader = ({ title, sub }) => (
    <div className="border-b border-borderColour pb-3 mb-4">
        <p className="text-lg font-black text-heading">{title}</p>
        {sub && <p className="text-xs text-bodyText/50 mt-0.5">{sub}</p>}
    </div>
)

const Field = ({ label, children }) => (
    <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-accentSoft uppercase tracking-wide">{label}</p>
        {children}
    </div>
)

const Input = ({ label, isReadonly, ...props }) => (
    <Field label={label}>
        <input
            className={INPUT_CLASS}
            disabled={props.disabled ?? isReadonly}
            {...props}
        />
    </Field>
)

const Select = ({ label, options, placeholder, isReadonly, ...props }) => (
    <Field label={label}>
        <select
            className={INPUT_CLASS}
            disabled={props.disabled ?? isReadonly}
            {...props}
        >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    </Field>
)

// ─── Inline delete confirmation ───────────────────────────────────────────────

const DeleteConfirm = ({ onConfirm, onCancel }) => (
    <div className="flex items-center gap-3 bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 text-sm">
        <p className="text-danger font-semibold flex-1">Delete your financial profile? This cannot be undone.</p>
        <button
            type="button"
            onClick={onConfirm}
            className="bg-danger hover:bg-danger/80 duration-200 text-white font-bold px-4 py-1.5 rounded-lg text-xs"
        >
            Yes, delete
        </button>
        <button
            type="button"
            onClick={onCancel}
            className="border border-borderColour hover:bg-card duration-200 font-bold px-4 py-1.5 rounded-lg text-xs text-bodyText"
        >
            Cancel
        </button>
    </div>
)

// ─── FinancialProfile ─────────────────────────────────────────────────────────

const FinancialProfile = () => {
    const { token, backend_url } = useContext(AppContext)

    const [profile,    setProfile]    = useState(null)
    const [loading,    setLoading]    = useState(true)
    const [editing,    setEditing]    = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [confirmDel, setConfirmDel] = useState(false)
    const [form,       setForm]       = useState(EMPTY)

    const [newEmi,     setNewEmi]     = useState({ monthlyAmount: '', remainingTenureMonths: '' })
    const [newCC,      setNewCC]      = useState({ outstandingBalance: '', minimumDue: '' })
    const [newLoan,    setNewLoan]    = useState({ principalOutstanding: '', monthlyEMI: '', remainingTenureMonths: '', interestRate: '' })
    const [newInquiry, setNewInquiry] = useState({ monthsAgo: '', status: '' })

    // ── Add-item validation errors ──────────────────────────────────────────
    const [emiError,     setEmiError]     = useState('')
    const [ccError,      setCcError]      = useState('')
    const [loanError,    setLoanError]    = useState('')
    const [inquiryError, setInquiryError] = useState('')

    // ── Fetch ───────────────────────────────────────────────────────────────
    const fetchProfile = useCallback(async (signal) => {
        try {
            const res = await axios.get(`${backend_url}/financial-profile`, {
                headers: { Authorization: token },
                signal,
            })
            if (res.data.success) {
                setProfile(res.data.profile)
                setForm(profileToForm(res.data.profile))
            }
        } catch (err) {
            if (axios.isCancel(err)) return
            setProfile(null)
        } finally {
            setLoading(false)
        }
    }, [token, backend_url])

    useEffect(() => {
        const controller = new AbortController()
        fetchProfile(controller.signal)
        return () => controller.abort()
    }, [fetchProfile])

    // ── Helpers ─────────────────────────────────────────────────────────────
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
    const isNonEarner = NON_EARNERS.includes(form.employmentType)
    const isReadonly  = profile && !editing

    const handleCancel = () => {
        setEditing(false)
        setForm(profileToForm(profile)) // single source of truth for reset
    }

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const payload = {
                ...form,
                age:                    Number(form.age),
                monthlyNetIncome:       Number(form.monthlyNetIncome),
                employmentTenureMonths: Number(form.employmentTenureMonths),
                creditScore:            Number(form.creditScore),
                gender:                 form.gender || undefined,
            }

            const headers = { Authorization: token }

            if (profile) {
                const res = await axios.patch(`${backend_url}/financial-profile`, payload, { headers })
                if (res.data.success) {
                    toast.success('Financial profile updated successfully!')
                    setEditing(false)
                    const controller = new AbortController()
                    await fetchProfile(controller.signal)
                } else {
                    toast.error(res.data.message)
                }
            } else {
                const res = await axios.post(`${backend_url}/financial-profile`, payload, { headers })
                if (res.data.success) {
                    toast.success('Financial profile created successfully!')
                    const controller = new AbortController()
                    await fetchProfile(controller.signal)
                } else {
                    toast.error(res.data.message)
                }
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong')
        } finally {
            setSubmitting(false)
        }
    }

    // ── Delete ───────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        try {
            const res = await axios.delete(`${backend_url}/financial-profile`, {
                headers: { Authorization: token },
            })
            if (res.data.success) {
                toast.success('Financial profile deleted!')
                setProfile(null)
                setForm(EMPTY)
                setEditing(false)
                setConfirmDel(false)
            } else {
                toast.error(res.data.message)
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong')
        }
    }

    // ── Add-item handlers ────────────────────────────────────────────────────
    const handleAddEmi = () => {
        if (newEmi.monthlyAmount === '' || newEmi.remainingTenureMonths === '') {
            setEmiError('Both fields are required.')
            return
        }
        setEmiError('')
        set('existingEmis', [...form.existingEmis, withId({
            monthlyAmount:         Number(newEmi.monthlyAmount),
            remainingTenureMonths: Number(newEmi.remainingTenureMonths),
        })])
        setNewEmi({ monthlyAmount: '', remainingTenureMonths: '' })
    }

    const handleAddCC = () => {
        if (newCC.outstandingBalance === '' || newCC.minimumDue === '') {
            setCcError('Both fields are required.')
            return
        }
        setCcError('')
        set('creditCardDues', [...form.creditCardDues, withId({
            outstandingBalance: Number(newCC.outstandingBalance),
            minimumDue:         Number(newCC.minimumDue),
        })])
        setNewCC({ outstandingBalance: '', minimumDue: '' })
    }

    const handleAddLoan = () => {
        const { principalOutstanding, monthlyEMI, remainingTenureMonths, interestRate } = newLoan
        if (!principalOutstanding || !monthlyEMI || !remainingTenureMonths || !interestRate) {
            setLoanError('All fields are required.')
            return
        }
        setLoanError('')
        set('otherLoans', [...form.otherLoans, withId({
            principalOutstanding:  Number(principalOutstanding),
            monthlyEMI:            Number(monthlyEMI),
            remainingTenureMonths: Number(remainingTenureMonths),
            interestRate:          Number(interestRate),
        })])
        setNewLoan({ principalOutstanding: '', monthlyEMI: '', remainingTenureMonths: '', interestRate: '' })
    }

    const handleAddInquiry = () => {
        if (newInquiry.monthsAgo === '' || !newInquiry.status) {
            setInquiryError('Both fields are required.')
            return
        }
        setInquiryError('')
        set('recentLoanInquiries', [...form.recentLoanInquiries, withId({
            monthsAgo: Number(newInquiry.monthsAgo),
            status:    newInquiry.status,
        })])
        setNewInquiry({ monthsAgo: '', status: '' })
    }

    // ── Render ───────────────────────────────────────────────────────────────
    if (loading) return <LoadingScreen />

    return (
        <div className="flex flex-col gap-8 text-bodyText font-sans m-5 max-w-3xl">

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-3xl font-black text-heading">Financial Profile 📋</p>
                    <p className="text-sm text-bodyText/60 mt-1">Your financial data powers every loan eligibility check.</p>
                </div>
                {profile && !editing && (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setEditing(true)}
                            className="border border-borderColour hover:bg-card duration-300 font-bold px-4 py-2 rounded-full text-sm text-bodyText"
                        >
                            Edit
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirmDel(true)}
                            className="border border-danger/40 hover:bg-danger/10 duration-300 font-bold px-4 py-2 rounded-full text-sm text-danger"
                        >
                            Delete
                        </button>
                    </div>
                )}
                {editing && (
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="border border-borderColour hover:bg-card duration-300 font-bold px-4 py-2 rounded-full text-sm text-bodyText"
                    >
                        Cancel
                    </button>
                )}
            </div>

            {/* Inline delete confirmation */}
            {confirmDel && (
                <DeleteConfirm
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDel(false)}
                />
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">

                {/* Personal Details */}
                <div className="bg-card border border-borderColour rounded-2xl p-6">
                    <SectionHeader title="Personal Details" sub="Basic demographic information" />
                    <div className="grid grid-cols-2 gap-4">
                        <Input isReadonly={isReadonly} label="Age" type="number" min={18} max={100} value={form.age} onChange={e => set('age', e.target.value)} required />
                        <Select isReadonly={isReadonly} label="Gender (optional)" options={GENDER} placeholder="Select gender" value={form.gender || ''} onChange={e => set('gender', e.target.value)} />
                        <Select isReadonly={isReadonly} label="Marital Status" options={MARITAL_STATUS} placeholder="Select" value={form.maritalStatus} onChange={e => set('maritalStatus', e.target.value)} required />
                        <Select isReadonly={isReadonly} label="City Tier" options={CITY_TIER} placeholder="Select" value={form.cityTier} onChange={e => set('cityTier', e.target.value)} required />
                        <Select isReadonly={isReadonly} label="Residential Status" options={RESIDENTIAL_STATUS} placeholder="Select" value={form.residentialStatus} onChange={e => set('residentialStatus', e.target.value)} required />
                        <Select isReadonly={isReadonly} label="Resident Type" options={RESIDENT_TYPE} placeholder="Select" value={form.residentType} onChange={e => set('residentType', e.target.value)} required />
                    </div>
                </div>

                {/* Employment */}
                <div className="bg-card border border-borderColour rounded-2xl p-6">
                    <SectionHeader title="Employment" sub="Your current employment situation" />
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            isReadonly={isReadonly}
                            label="Employment Type"
                            options={EMPLOYMENT_TYPE}
                            placeholder="Select"
                            value={form.employmentType}
                            onChange={e => {
                                set('employmentType', e.target.value)
                                if (NON_EARNERS.includes(e.target.value)) set('employerType', 'Not Applicable')
                            }}
                            required
                        />
                        <Select
                            isReadonly={isReadonly}
                            label="Employer Type"
                            options={EMPLOYER_TYPE}
                            placeholder="Select"
                            value={form.employerType}
                            onChange={e => set('employerType', e.target.value)}
                            disabled={isReadonly || isNonEarner}
                            required
                        />
                        <Input
                            isReadonly={isReadonly}
                            label="Monthly Net Income (₹)"
                            type="number"
                            min={0}
                            value={form.monthlyNetIncome}
                            onChange={e => set('monthlyNetIncome', e.target.value)}
                            disabled={isReadonly || isNonEarner}
                        />
                        <Input
                            isReadonly={isReadonly}
                            label="Employment Tenure (months)"
                            type="number"
                            min={0}
                            value={form.employmentTenureMonths}
                            onChange={e => set('employmentTenureMonths', e.target.value)}
                        />
                    </div>
                </div>

                {/* Credit Profile */}
                <div className="bg-card border border-borderColour rounded-2xl p-6">
                    <SectionHeader title="Credit Profile" sub="Credit health indicators" />
                    <div className="grid grid-cols-2 gap-4">
                        <Input isReadonly={isReadonly} label="Credit Score (0–900)" type="number" min={0} max={900} value={form.creditScore} onChange={e => set('creditScore', e.target.value)} required />
                        <Select isReadonly={isReadonly} label="Payment History" options={PAYMENT_HISTORY_FLAG} placeholder="Select" value={form.paymentHistoryFlag} onChange={e => set('paymentHistoryFlag', e.target.value)} required />
                    </div>
                </div>

                {/* Existing EMIs */}
                <div className="bg-card border border-borderColour rounded-2xl p-6">
                    <SectionHeader title="Existing EMIs" sub="Current EMI obligations" />
                    <div className="flex flex-col gap-2 mb-4">
                        {form.existingEmis.length === 0 && <p className="text-sm text-bodyText/40 italic">No EMIs added.</p>}
                        {form.existingEmis.map((e) => (
                            <div key={e._id} className="flex items-center justify-between bg-black/30 border border-borderColour rounded-lg px-4 py-2 text-sm">
                                <p>₹{e.monthlyAmount}/mo · {e.remainingTenureMonths} months left</p>
                                {!isReadonly && (
                                    <button type="button" onClick={() => set('existingEmis', form.existingEmis.filter(x => x._id !== e._id))} className="text-danger text-xs font-bold">Remove</button>
                                )}
                            </div>
                        ))}
                    </div>
                    {!isReadonly && (
                        <>
                            <div className="grid grid-cols-3 gap-3">
                                <Field label="Monthly Amount (₹)">
                                    <input className={INPUT_CLASS} type="number" min={0} value={newEmi.monthlyAmount} onChange={e => setNewEmi(p => ({ ...p, monthlyAmount: e.target.value }))} />
                                </Field>
                                <Field label="Remaining Months">
                                    <input className={INPUT_CLASS} type="number" min={0} value={newEmi.remainingTenureMonths} onChange={e => setNewEmi(p => ({ ...p, remainingTenureMonths: e.target.value }))} />
                                </Field>
                                <div className="flex items-end">
                                    <button type="button" onClick={handleAddEmi} className="bg-button hover:bg-buttonHover duration-300 text-white font-bold px-4 py-2 rounded-lg text-sm w-full">Add</button>
                                </div>
                            </div>
                            {emiError && <p className="text-danger text-xs mt-2">{emiError}</p>}
                        </>
                    )}
                </div>

                {/* Credit Card Dues */}
                <div className="bg-card border border-borderColour rounded-2xl p-6">
                    <SectionHeader title="Credit Card Dues" sub="Outstanding credit card balances" />
                    <div className="flex flex-col gap-2 mb-4">
                        {form.creditCardDues.length === 0 && <p className="text-sm text-bodyText/40 italic">No credit card dues added.</p>}
                        {form.creditCardDues.map((c) => (
                            <div key={c._id} className="flex items-center justify-between bg-black/30 border border-borderColour rounded-lg px-4 py-2 text-sm">
                                <p>Balance: ₹{c.outstandingBalance} · Min Due: ₹{c.minimumDue}</p>
                                {!isReadonly && (
                                    <button type="button" onClick={() => set('creditCardDues', form.creditCardDues.filter(x => x._id !== c._id))} className="text-danger text-xs font-bold">Remove</button>
                                )}
                            </div>
                        ))}
                    </div>
                    {!isReadonly && (
                        <>
                            <div className="grid grid-cols-3 gap-3">
                                <Field label="Outstanding Balance (₹)">
                                    <input className={INPUT_CLASS} type="number" min={0} value={newCC.outstandingBalance} onChange={e => setNewCC(p => ({ ...p, outstandingBalance: e.target.value }))} />
                                </Field>
                                <Field label="Minimum Due (₹)">
                                    <input className={INPUT_CLASS} type="number" min={0} value={newCC.minimumDue} onChange={e => setNewCC(p => ({ ...p, minimumDue: e.target.value }))} />
                                </Field>
                                <div className="flex items-end">
                                    <button type="button" onClick={handleAddCC} className="bg-button hover:bg-buttonHover duration-300 text-white font-bold px-4 py-2 rounded-lg text-sm w-full">Add</button>
                                </div>
                            </div>
                            {ccError && <p className="text-danger text-xs mt-2">{ccError}</p>}
                        </>
                    )}
                </div>

                {/* Other Loans */}
                <div className="bg-card border border-borderColour rounded-2xl p-6">
                    <SectionHeader title="Other Loans" sub="Any other active loans" />
                    <div className="flex flex-col gap-2 mb-4">
                        {form.otherLoans.length === 0 && <p className="text-sm text-bodyText/40 italic">No other loans added.</p>}
                        {form.otherLoans.map((l) => (
                            <div key={l._id} className="flex items-center justify-between bg-black/30 border border-borderColour rounded-lg px-4 py-2 text-sm">
                                <p>₹{l.principalOutstanding} outstanding · ₹{l.monthlyEMI}/mo · {l.remainingTenureMonths}mo · {l.interestRate}%</p>
                                {!isReadonly && (
                                    <button type="button" onClick={() => set('otherLoans', form.otherLoans.filter(x => x._id !== l._id))} className="text-danger text-xs font-bold">Remove</button>
                                )}
                            </div>
                        ))}
                    </div>
                    {!isReadonly && (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Principal Outstanding (₹)">
                                    <input className={INPUT_CLASS} type="number" min={0} value={newLoan.principalOutstanding} onChange={e => setNewLoan(p => ({ ...p, principalOutstanding: e.target.value }))} />
                                </Field>
                                <Field label="Monthly EMI (₹)">
                                    <input className={INPUT_CLASS} type="number" min={0} value={newLoan.monthlyEMI} onChange={e => setNewLoan(p => ({ ...p, monthlyEMI: e.target.value }))} />
                                </Field>
                                <Field label="Remaining Months">
                                    <input className={INPUT_CLASS} type="number" min={0} value={newLoan.remainingTenureMonths} onChange={e => setNewLoan(p => ({ ...p, remainingTenureMonths: e.target.value }))} />
                                </Field>
                                <Field label="Interest Rate (%)">
                                    <input className={INPUT_CLASS} type="number" min={0} max={100} value={newLoan.interestRate} onChange={e => setNewLoan(p => ({ ...p, interestRate: e.target.value }))} />
                                </Field>
                                <div className="col-span-2">
                                    <button type="button" onClick={handleAddLoan} className="bg-button hover:bg-buttonHover duration-300 text-white font-bold px-4 py-2 rounded-lg text-sm">Add Loan</button>
                                </div>
                            </div>
                            {loanError && <p className="text-danger text-xs mt-2">{loanError}</p>}
                        </>
                    )}
                </div>

                {/* Recent Loan Inquiries */}
                <div className="bg-card border border-borderColour rounded-2xl p-6">
                    <SectionHeader title="Recent Loan Inquiries" sub="Loan applications in the last 12 months" />
                    <div className="flex flex-col gap-2 mb-4">
                        {form.recentLoanInquiries.length === 0 && <p className="text-sm text-bodyText/40 italic">No recent inquiries added.</p>}
                        {form.recentLoanInquiries.map((r) => (
                            <div key={r._id} className="flex items-center justify-between bg-black/30 border border-borderColour rounded-lg px-4 py-2 text-sm">
                                <p>{r.monthsAgo} months ago · {r.status}</p>
                                {!isReadonly && (
                                    <button type="button" onClick={() => set('recentLoanInquiries', form.recentLoanInquiries.filter(x => x._id !== r._id))} className="text-danger text-xs font-bold">Remove</button>
                                )}
                            </div>
                        ))}
                    </div>
                    {!isReadonly && (
                        <>
                            <div className="grid grid-cols-3 gap-3">
                                <Field label="Months Ago">
                                    <input className={INPUT_CLASS} type="number" min={0} value={newInquiry.monthsAgo} onChange={e => setNewInquiry(p => ({ ...p, monthsAgo: e.target.value }))} />
                                </Field>
                                <Field label="Status">
                                    <select className={INPUT_CLASS} value={newInquiry.status} onChange={e => setNewInquiry(p => ({ ...p, status: e.target.value }))}>
                                        <option value="">Select</option>
                                        {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </Field>
                                <div className="flex items-end">
                                    <button type="button" onClick={handleAddInquiry} className="bg-button hover:bg-buttonHover duration-300 text-white font-bold px-4 py-2 rounded-lg text-sm w-full">Add</button>
                                </div>
                            </div>
                            {inquiryError && <p className="text-danger text-xs mt-2">{inquiryError}</p>}
                        </>
                    )}
                </div>

                {/* Submit */}
                {!isReadonly && (
                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-button hover:bg-buttonHover duration-300 text-white font-black text-lg px-8 py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Saving...' : profile ? 'Update Profile' : 'Save Profile'}
                    </button>
                )}

            </form>
        </div>
    )
}

export default FinancialProfile
