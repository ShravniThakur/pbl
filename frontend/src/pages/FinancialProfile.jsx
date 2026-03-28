import { useCallback, useContext, useEffect, useState } from "react"
import { AppContext } from "../context/AppContext"
import axios from "axios"
import { toast } from "react-toastify"
import { X, CheckCircle, AlertCircle } from "lucide-react"
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

const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—'

const INPUT_CLASS = `bg-surface border border-border-default rounded-[9px] px-4 py-3 text-text-primary text-[15px]
    focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)] transition-shadow duration-200
    disabled:opacity-50 disabled:cursor-not-allowed w-full font-medium placeholder:text-text-muted`

// ─── Helpers ──────────────────────────────────────────────────────────────────

const profileToForm = (p) => ({
    ...p,
    age: String(p.age ?? ''),
    monthlyNetIncome: String(p.monthlyNetIncome ?? ''),
    employmentTenureMonths: String(p.employmentTenureMonths ?? ''),
    creditScore: String(p.creditScore ?? ''),
})

const withId = (obj) => ({ ...obj, _id: crypto.randomUUID() })

// ─── Sub-components ───────────────────────────────────────────────────────────

const LoadingScreen = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-border-default border-t-primary rounded-full animate-spin"></div>
    </div>
)

const SectionCard = ({ title, sub, accentColor, children }) => (
    <div className="bg-surface relative border border-border-default rounded-[14px] p-6 shadow-card overflow-hidden">
        <div className={`absolute top-0 bottom-0 left-0 w-1 ${accentColor}`} />
        <div className="mb-8">
            <h2 className="text-[20px] font-bold text-text-primary">{title}</h2>
            {sub && <p className="text-[15px] font-medium text-text-muted mt-1.5">{sub}</p>}
        </div>
        <div>{children}</div>
    </div>
)

const DisplayGrid = ({ children }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-10">{children}</div>
)

const Field = ({ label, children }) => (
    <div className="flex flex-col gap-2">
        <p className="text-[12px] font-bold text-text-muted uppercase tracking-[0.05em]">{label}</p>
        {children}
    </div>
)

const DisplayField = ({ label, value }) => (
    <Field label={label}>
        <div className="bg-slate-50 border border-border-default rounded-md px-3 py-2">
            <p className="text-[17px] font-bold text-text-primary tabular-nums break-words">{value || '—'}</p>
        </div>
    </Field>
)

const Input = ({ label, isReadonly, ...props }) => {
    if (isReadonly) return <DisplayField label={label} value={props.value} />
    return (
        <Field label={label}>
            <input className={INPUT_CLASS} disabled={props.disabled} {...props} />
        </Field>
    )
}

const Select = ({ label, options, placeholder, isReadonly, ...props }) => {
    if (isReadonly) return <DisplayField label={label} value={props.value} />
    return (
        <Field label={label}>
            <select className={INPUT_CLASS} disabled={props.disabled} {...props}>
                {placeholder && <option value="" disabled className="text-text-muted">{placeholder}</option>}
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </Field>
    )
}

const ListItem = ({ children, onRemove, isReadonly }) => (
    <div className="group flex items-center justify-between bg-surface border border-border-default rounded-[10px] px-5 py-3.5 text-[15px] font-medium text-text-primary transition-colors hover:border-border-hover overflow-hidden">
        <div className="flex gap-2 tabular-nums">
            {children}
        </div>
        {!isReadonly && (
            <button
                type="button"
                onClick={onRemove}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-text-muted hover:text-rose hover:bg-rose-light rounded-md"
            >
                <X size={16} />
            </button>
        )}
    </div>
)

// ─── FinancialProfile ─────────────────────────────────────────────────────────

const FinancialProfile = () => {
    const { token, backend_url } = useContext(AppContext)

    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [confirmDel, setConfirmDel] = useState(false)
    const [form, setForm] = useState(EMPTY)

    const [newEmi, setNewEmi] = useState({ monthlyAmount: '', remainingTenureMonths: '' })
    const [newCC, setNewCC] = useState({ outstandingBalance: '', minimumDue: '' })
    const [newLoan, setNewLoan] = useState({ principalOutstanding: '', monthlyEMI: '', remainingTenureMonths: '', interestRate: '' })
    const [newInquiry, setNewInquiry] = useState({ monthsAgo: '', status: '' })

    const [emiError, setEmiError] = useState('')
    const [ccError, setCcError] = useState('')
    const [loanError, setLoanError] = useState('')
    const [inquiryError, setInquiryError] = useState('')

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

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
    const isNonEarner = NON_EARNERS.includes(form.employmentType)
    const isReadonly = Boolean(profile && !editing)

    const handleCancel = () => {
        setEditing(false)
        setForm(profileToForm(profile))
        setConfirmDel(false)
        setNewEmi({ monthlyAmount: '', remainingTenureMonths: '' })
        setNewCC({ outstandingBalance: '', minimumDue: '' })
        setNewLoan({ principalOutstanding: '', monthlyEMI: '', remainingTenureMonths: '', interestRate: '' })
        setNewInquiry({ monthsAgo: '', status: '' })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const payload = {
                ...form,
                age: Number(form.age),
                monthlyNetIncome: Number(form.monthlyNetIncome),
                employmentTenureMonths: Number(form.employmentTenureMonths),
                creditScore: Number(form.creditScore),
                gender: form.gender || undefined,
            }

            const headers = { Authorization: token }

            if (profile) {
                const res = await axios.patch(`${backend_url}/financial-profile`, payload, { headers })
                if (res.data.success) {
                    toast.success('Financial profile updated successfully!')
                    setEditing(false)
                    await fetchProfile()
                } else {
                    toast.error(res.data.message)
                }
            } else {
                const res = await axios.post(`${backend_url}/financial-profile`, payload, { headers })
                if (res.data.success) {
                    toast.success('Financial profile created successfully!')
                    await fetchProfile()
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

    const handleAddEmi = () => {
        if (!newEmi.monthlyAmount || !newEmi.remainingTenureMonths) return setEmiError('Both fields required.')
        setEmiError('')
        set('existingEmis', [...form.existingEmis, withId({ monthlyAmount: Number(newEmi.monthlyAmount), remainingTenureMonths: Number(newEmi.remainingTenureMonths) })])
        setNewEmi({ monthlyAmount: '', remainingTenureMonths: '' })
    }

    const handleAddCC = () => {
        if (!newCC.outstandingBalance || !newCC.minimumDue) return setCcError('Both fields required.')
        setCcError('')
        set('creditCardDues', [...form.creditCardDues, withId({ outstandingBalance: Number(newCC.outstandingBalance), minimumDue: Number(newCC.minimumDue) })])
        setNewCC({ outstandingBalance: '', minimumDue: '' })
    }

    const handleAddLoan = () => {
        if (!newLoan.principalOutstanding || !newLoan.monthlyEMI || !newLoan.remainingTenureMonths || !newLoan.interestRate) return setLoanError('All fields required.')
        setLoanError('')
        set('otherLoans', [...form.otherLoans, withId({
            principalOutstanding: Number(newLoan.principalOutstanding), monthlyEMI: Number(newLoan.monthlyEMI),
            remainingTenureMonths: Number(newLoan.remainingTenureMonths), interestRate: Number(newLoan.interestRate),
        })])
        setNewLoan({ principalOutstanding: '', monthlyEMI: '', remainingTenureMonths: '', interestRate: '' })
    }

    const handleAddInquiry = () => {
        if (!newInquiry.monthsAgo || !newInquiry.status) return setInquiryError('Both fields required.')
        setInquiryError('')
        set('recentLoanInquiries', [...form.recentLoanInquiries, withId({ monthsAgo: Number(newInquiry.monthsAgo), status: newInquiry.status })])
        setNewInquiry({ monthsAgo: '', status: '' })
    }

    if (loading) return <LoadingScreen />

    return (
        <div className="max-w-6xl w-full mx-auto px-6 py-8 flex flex-col gap-8 font-inter animate-fade-up">

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[40px] font-black text-sidebar-bg tracking-[-0.03em] leading-tight py-4">Financial Profile</h1>
                    <p className="text-sm font-medium text-text-muted mt-1">Your financial foundation for eligibility checks.</p>
                </div>
                {profile && !editing && (
                    <div className="flex gap-3">
                        <button onClick={() => setConfirmDel(true)} className="px-4 py-2 rounded-[9px] border border-border-default text-rose text-sm font-semibold hover:bg-rose-light hover:border-rose-light transition-colors duration-200">
                            Delete
                        </button>
                        <button onClick={() => setEditing(true)} className="px-4 py-2 rounded-[9px] border border-border-default text-text-primary text-sm font-semibold hover:bg-[#F5F5F4] transition-colors duration-200">
                            Edit Profile
                        </button>
                    </div>
                )}
                {editing && profile && (
                    <button onClick={handleCancel} className="px-4 py-2 rounded-[9px] border border-border-default text-text-primary text-sm font-semibold hover:bg-[#F5F5F4] transition-colors duration-200">
                        Discard Changes
                    </button>
                )}
            </div>

            {confirmDel && (
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-rose-light border border-[#FECDD3] rounded-[14px] px-6 py-4 animate-fade-up">
                    <AlertCircle className="text-rose shrink-0" size={24} />
                    <p className="text-rose font-semibold text-sm flex-1">Delete your financial profile? This action cannot be undone.</p>
                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <button onClick={() => setConfirmDel(false)} className="flex-1 px-4 py-2 rounded-[9px] border border-[#FECDD3] text-rose bg-white text-sm font-semibold hover:bg-rose-light transition-colors">Cancel</button>
                        <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-[9px] bg-rose text-white text-sm font-semibold hover:bg-rose-600 transition-colors shadow-sm">Delete</button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">

                {/* Personal Details */}
                <SectionCard title="Personal Details" sub="Demographics and residence" accentColor="bg-primary">
                    <DisplayGrid>
                        <Input isReadonly={isReadonly} label="Age" type="number" min={18} max={100} value={form.age} onChange={e => set('age', e.target.value)} required />
                        <Select isReadonly={isReadonly} label="Gender" options={GENDER} placeholder="Select gender" value={form.gender || ''} onChange={e => set('gender', e.target.value)} />
                        <Select isReadonly={isReadonly} label="Marital Status" options={MARITAL_STATUS} placeholder="Select status" value={form.maritalStatus} onChange={e => set('maritalStatus', e.target.value)} required />
                        <Select isReadonly={isReadonly} label="City Tier" options={CITY_TIER} placeholder="Select tier" value={form.cityTier} onChange={e => set('cityTier', e.target.value)} required />
                        <Select isReadonly={isReadonly} label="Residential Status" options={RESIDENTIAL_STATUS} placeholder="Select status" value={form.residentialStatus} onChange={e => set('residentialStatus', e.target.value)} required />
                        <Select isReadonly={isReadonly} label="Resident Type" options={RESIDENT_TYPE} placeholder="Select type" value={form.residentType} onChange={e => set('residentType', e.target.value)} required />
                    </DisplayGrid>
                </SectionCard>

                {/* Employment */}
                <SectionCard title="Employment" sub="Status and income information" accentColor="bg-emerald">
                    <DisplayGrid>
                        <Select
                            isReadonly={isReadonly} label="Employment Type" options={EMPLOYMENT_TYPE} placeholder="Select type" value={form.employmentType} required
                            onChange={e => { set('employmentType', e.target.value); if (NON_EARNERS.includes(e.target.value)) set('employerType', 'Not Applicable'); }}
                        />
                        <Select isReadonly={isReadonly} label="Employer Type" options={EMPLOYER_TYPE} placeholder="Select type" value={form.employerType} onChange={e => set('employerType', e.target.value)} disabled={isReadonly || isNonEarner} required />
                        <Input isReadonly={isReadonly} label="Net Income (per month)" type="number" min={0} value={form.monthlyNetIncome} onChange={e => set('monthlyNetIncome', e.target.value)} disabled={isReadonly || isNonEarner} />
                        <Input isReadonly={isReadonly} label="Tenure (months)" type="number" min={0} value={form.employmentTenureMonths} onChange={e => set('employmentTenureMonths', e.target.value)} />
                    </DisplayGrid>
                </SectionCard>

                {/* Credit Profile */}
                <SectionCard title="Credit Profile" sub="Credit health indicators" accentColor="bg-amber-500">
                    <DisplayGrid>
                        <Input isReadonly={isReadonly} label="Credit Score (0–900)" type="number" min={0} max={900} value={form.creditScore} onChange={e => set('creditScore', e.target.value)} required />
                        <Select isReadonly={isReadonly} label="Payment History" options={PAYMENT_HISTORY_FLAG} placeholder="Select history" value={form.paymentHistoryFlag} onChange={e => set('paymentHistoryFlag', e.target.value)} required />
                    </DisplayGrid>
                </SectionCard>

                {/* Existing EMIs */}
                <SectionCard title="Existing EMIs" sub="Current monthly obligations" accentColor="bg-rose">
                    <div className="flex flex-col gap-3 mb-6">
                        {form.existingEmis.length === 0 && <p className="text-sm font-medium text-text-muted">No EMIs documented.</p>}
                        {form.existingEmis.map((e) => (
                            <ListItem key={e._id} onRemove={() => set('existingEmis', form.existingEmis.filter(x => x._id !== e._id))} isReadonly={isReadonly}>
                                <span className="font-bold">{fmt(e.monthlyAmount)}</span><span className="text-text-muted"> / mo · {e.remainingTenureMonths} months left</span>
                            </ListItem>
                        ))}
                    </div>
                    {!isReadonly && (
                        <div className="bg-[#F8F7F4] p-4 rounded-xl border border-border-default space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Field label="Amount (₹)">
                                    <input className={INPUT_CLASS} type="number" min={0} value={newEmi.monthlyAmount} onChange={e => setNewEmi(p => ({ ...p, monthlyAmount: e.target.value }))} placeholder="Amount" />
                                </Field>
                                <Field label="Months Left">
                                    <input className={INPUT_CLASS} type="number" min={0} value={newEmi.remainingTenureMonths} onChange={e => setNewEmi(p => ({ ...p, remainingTenureMonths: e.target.value }))} placeholder="Months" />
                                </Field>
                                <div className="flex items-end">
                                    <button type="button" onClick={handleAddEmi} className="bg-white border border-border-default hover:border-primary text-primary font-semibold px-4 py-2.5 rounded-[9px] shadow-sm text-sm w-full transition-colors">Add EMI</button>
                                </div>
                            </div>
                            {emiError && <p className="text-rose text-xs font-medium"><AlertCircle className="inline w-3 h-3 mr-1" />{emiError}</p>}
                        </div>
                    )}
                </SectionCard>

                {/* Credit Card Dues */}
                <SectionCard title="Credit Card Dues" sub="Current card balances" accentColor="bg-rose">
                    <div className="flex flex-col gap-3 mb-6">
                        {form.creditCardDues.length === 0 && <p className="text-sm font-medium text-text-muted">No credit card dues.</p>}
                        {form.creditCardDues.map((c) => (
                            <ListItem key={c._id} onRemove={() => set('creditCardDues', form.creditCardDues.filter(x => x._id !== c._id))} isReadonly={isReadonly}>
                                <span className="text-text-muted">Balance: </span><span className="font-bold">{fmt(c.outstandingBalance)}</span>
                                <span className="text-text-muted mx-2">|</span>
                                <span className="text-text-muted">Min Due: </span><span className="font-bold">{fmt(c.minimumDue)}</span>
                            </ListItem>
                        ))}
                    </div>
                    {!isReadonly && (
                        <div className="bg-[#F8F7F4] p-4 rounded-xl border border-border-default space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Field label="Total Balance (₹)">
                                    <input className={INPUT_CLASS} type="number" min={0} value={newCC.outstandingBalance} onChange={e => setNewCC(p => ({ ...p, outstandingBalance: e.target.value }))} placeholder="Balance" />
                                </Field>
                                <Field label="Minimum Due (₹)">
                                    <input className={INPUT_CLASS} type="number" min={0} value={newCC.minimumDue} onChange={e => setNewCC(p => ({ ...p, minimumDue: e.target.value }))} placeholder="Min Due" />
                                </Field>
                                <div className="flex items-end">
                                    <button type="button" onClick={handleAddCC} className="bg-white border border-border-default hover:border-primary text-primary font-semibold px-4 py-2.5 rounded-[9px] shadow-sm text-sm w-full transition-colors">Add Card</button>
                                </div>
                            </div>
                            {ccError && <p className="text-rose text-xs font-medium"><AlertCircle className="inline w-3 h-3 mr-1" />{ccError}</p>}
                        </div>
                    )}
                </SectionCard>

                {/* Other Loans */}
                <SectionCard title="Other Loans" sub="Active major loans" accentColor="bg-rose">
                    <div className="flex flex-col gap-3 mb-6">
                        {form.otherLoans.length === 0 && <p className="text-sm font-medium text-text-muted">No other loans.</p>}
                        {form.otherLoans.map((l) => (
                            <ListItem key={l._id} onRemove={() => set('otherLoans', form.otherLoans.filter(x => x._id !== l._id))} isReadonly={isReadonly}>
                                <span className="font-bold">{fmt(l.principalOutstanding)}</span><span className="text-text-muted"> left · </span>
                                <span className="font-bold">{fmt(l.monthlyEMI)}</span><span className="text-text-muted">/mo · {l.remainingTenureMonths}mo · {l.interestRate}%</span>
                            </ListItem>
                        ))}
                    </div>
                    {!isReadonly && (
                        <div className="bg-[#F8F7F4] p-4 rounded-xl border border-border-default space-y-4">
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="lg:col-span-2">
                                    <Field label="Principal (₹)">
                                        <input className={INPUT_CLASS} type="number" min={0} value={newLoan.principalOutstanding} onChange={e => setNewLoan(p => ({ ...p, principalOutstanding: e.target.value }))} placeholder="Principal" />
                                    </Field>
                                </div>
                                <Field label="EMI (₹)">
                                    <input className={INPUT_CLASS} type="number" min={0} value={newLoan.monthlyEMI} onChange={e => setNewLoan(p => ({ ...p, monthlyEMI: e.target.value }))} placeholder="EMI" />
                                </Field>
                                <Field label="Months">
                                    <input className={INPUT_CLASS} type="number" min={0} value={newLoan.remainingTenureMonths} onChange={e => setNewLoan(p => ({ ...p, remainingTenureMonths: e.target.value }))} placeholder="Months" />
                                </Field>
                                <Field label="Rate (%)">
                                    <input className={INPUT_CLASS} type="number" min={0} max={100} value={newLoan.interestRate} onChange={e => setNewLoan(p => ({ ...p, interestRate: e.target.value }))} placeholder="%" />
                                </Field>
                            </div>
                            <button type="button" onClick={handleAddLoan} className="block w-full sm:w-auto bg-white border border-border-default hover:border-primary text-primary font-semibold px-6 py-2.5 rounded-[9px] shadow-sm text-sm transition-colors mt-2">Add Loan</button>
                            {loanError && <p className="text-rose text-xs font-medium"><AlertCircle className="inline w-3 h-3 mr-1" />{loanError}</p>}
                        </div>
                    )}
                </SectionCard>

                {/* Inquiries */}
                <SectionCard title="Recent Inquiries" sub="Inquiries within last 12 months" accentColor="bg-amber-500">
                    <div className="flex flex-col gap-3 mb-6">
                        {form.recentLoanInquiries.length === 0 && <p className="text-sm font-medium text-text-muted">No recent inquiries.</p>}
                        {form.recentLoanInquiries.map((r) => (
                            <ListItem key={r._id} onRemove={() => set('recentLoanInquiries', form.recentLoanInquiries.filter(x => x._id !== r._id))} isReadonly={isReadonly}>
                                <span className="font-bold">{r.monthsAgo}</span><span className="text-text-muted"> months ago · </span>
                                <span className="font-bold">{r.status}</span>
                            </ListItem>
                        ))}
                    </div>
                    {!isReadonly && (
                        <div className="bg-[#F8F7F4] p-4 rounded-xl border border-border-default space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Field label="Months Ago">
                                    <input className={INPUT_CLASS} type="number" min={0} max={12} value={newInquiry.monthsAgo} onChange={e => setNewInquiry(p => ({ ...p, monthsAgo: e.target.value }))} placeholder="Months" />
                                </Field>
                                <Field label="Status">
                                    <select className={INPUT_CLASS} value={newInquiry.status} onChange={e => setNewInquiry(p => ({ ...p, status: e.target.value }))}>
                                        <option value="" disabled className="text-text-muted">Select status</option>
                                        {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </Field>
                                <div className="flex items-end">
                                    <button type="button" onClick={handleAddInquiry} className="bg-white border border-border-default hover:border-primary text-primary font-semibold px-4 py-2.5 rounded-[9px] shadow-sm text-sm w-full transition-colors">Add Inquiry</button>
                                </div>
                            </div>
                            {inquiryError && <p className="text-rose text-xs font-medium"><AlertCircle className="inline w-3 h-3 mr-1" />{inquiryError}</p>}
                        </div>
                    )}
                </SectionCard>

                {/* Submit Action */}
                {!isReadonly && (
                    <div className="pt-2 pb-10">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold text-base py-3.5 rounded-[9px] shadow-button-primary transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {submitting ? (
                                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving</>
                            ) : (
                                <><CheckCircle size={20} /> {profile ? 'Save Changes' : 'Create Profile'}</>
                            )}
                        </button>
                    </div>
                )}
            </form>
        </div>
    )
}

export default FinancialProfile
