import { useContext, useEffect, useState } from "react"
import { AppContext } from "../context/AppContext"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"
import {
    LOAN_TYPES, SALARY_MODE, PROPERTY_TYPE, CITY_TIER, COURSE_TYPE,
    COLLATERAL_TYPE, OWNERSHIP_TYPE, VEHICLE_TYPE, DEALER_TYPE,
    BUSINESS_TYPE, GST_FILING_HISTORY, EMPLOYMENT_TYPE, RELATIONSHIP,
    JOB_ROLE, INSTITUTION_TYPE
} from "../utils/enums"

// ─── Constants ────────────────────────────────────────────────────────────────

const INPUT_CLASS = `bg-white border border-borderColour rounded-lg px-3 py-2 text-bodyText text-sm
    focus:outline-none focus:border-button transition-colors duration-200 w-full`

const EMPTY_CO_APPLICANT = {
    name: '', relationship: '', age: '', employmentType: '',
    monthlyNetIncome: '', creditScore: '', existingEmis: [],
    otherLoans: [], isPrimaryEarner: false,
}

/**
 * Fields in loanDetails that must be cast to Number before submission.
 * Kept at module scope — static data, no need to rebuild on every submit.
 */
const NUMERIC_LOAN_FIELDS = [
    'totalWorkExperienceMonths', 'propertyValue', 'downPaymentAmount',
    'courseDurationMonths', 'annualTuitionFee', 'totalCourseFee',
    'moratoriumMonths', 'expectedSalaryAfterCourse', 'vehiclePrice',
    'downPayment', 'vehicleAge', 'businessVintageMonths',
    'annualTurnover', 'profitMarginPercent',
]

// ─── Sub-components (module scope — stable identity across renders) ───────────

const Field = ({ label, children }) => (
    <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-accentSoft uppercase tracking-wide">{label}</p>
        {children}
    </div>
)

const Input = ({ label, ...props }) => (
    <Field label={label}>
        <input className={INPUT_CLASS} {...props} />
    </Field>
)

const Select = ({ label, options, placeholder, ...props }) => (
    <Field label={label}>
        <select className={INPUT_CLASS} {...props}>
            {placeholder && <option value="">{placeholder}</option>}
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    </Field>
)

const SectionHeader = ({ title, sub }) => (
    <div className="border-b border-borderColour pb-3 mb-4">
        <p className="text-lg font-black text-heading">{title}</p>
        {sub && <p className="text-xs text-bodyText/50 mt-0.5">{sub}</p>}
    </div>
)

// ─── LoanCheck ────────────────────────────────────────────────────────────────

const LoanCheck = () => {
    const { token, backend_url } = useContext(AppContext)
    const navigate = useNavigate()

    const [loanType,       setLoanType]       = useState('')
    // amount is intentionally NOT reset on loan type change — it is loan-type agnostic
    const [amount,         setAmount]         = useState('')
    const [details,        setDetails]        = useState({})
    const [hasCoApplicant, setHasCoApplicant] = useState(false)
    const [coApplicant,    setCoApplicant]    = useState(EMPTY_CO_APPLICANT)
    const [submitting,     setSubmitting]     = useState(false)

    // ── Auth guard ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!token) navigate('/login')
    }, [token, navigate])

    // ── Derived ─────────────────────────────────────────────────────────────
    // Centralise the repeated condition so it only needs updating in one place
    const isEducationLoan = loanType === 'Education Loan'
    const showCoApplicant = isEducationLoan || hasCoApplicant

    // ── Helpers ─────────────────────────────────────────────────────────────
    const set = (k, v) => setDetails(d => ({ ...d, [k]: v }))
    const setCo = (k, v) => setCoApplicant(c => ({ ...c, [k]: v }))

    /**
     * Safely update a nested collateralDetails key using the functional updater
     * to avoid stale-closure issues when two rapid changes occur.
     */
    const setCollateral = (k, v) =>
        setDetails(d => ({
            ...d,
            collateralDetails: { ...d.collateralDetails, [k]: v },
        }))

    const handleLoanTypeChange = (e) => {
        setLoanType(e.target.value)
        setDetails({})
        setHasCoApplicant(false)
        setCoApplicant(EMPTY_CO_APPLICANT) // single source of truth
    }

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const loanDetails = { ...details }

            // Cast known numeric fields
            NUMERIC_LOAN_FIELDS.forEach(f => {
                if (loanDetails[f] !== undefined && loanDetails[f] !== '')
                    loanDetails[f] = Number(loanDetails[f])
            })

            // Cast nested collateral numeric field
            if (loanDetails.collateralDetails?.assetValue !== undefined &&
                loanDetails.collateralDetails.assetValue !== '') {
                loanDetails.collateralDetails.assetValue =
                    Number(loanDetails.collateralDetails.assetValue)
            }

            // Attach co-applicant when required
            if (showCoApplicant) {
                loanDetails.coApplicant = {
                    ...coApplicant,
                    age:              Number(coApplicant.age),
                    monthlyNetIncome: Number(coApplicant.monthlyNetIncome),
                    creditScore:      Number(coApplicant.creditScore),
                }
            }

            const payload = {
                loanType,
                requestedLoanAmount: Number(amount),
                loanDetails,
            }

            const res = await axios.post(`${backend_url}/loan-eligibility`, payload, {
                headers: { Authorization: token },
            })

            if (res.data.success) {
                toast.success('Eligibility check completed!')
                // Keep submitting=true — component will unmount on navigate,
                // preventing a brief re-enable flash before the transition
                navigate(`/loan-history/${res.data.check._id}`)
            } else {
                toast.error(res.data.message)
                setSubmitting(false)
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong')
            setSubmitting(false)
        }
    }

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-8 text-bodyText font-sans m-5 max-w-3xl">

            {/* Header */}
            <div>
                <p className="text-3xl font-black text-heading">Check Eligibility ◎</p>
                <p className="text-sm text-bodyText/60 mt-1">Fill in the details and get an instant loan eligibility result.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">

                {/* Loan Type + Amount */}
                <div className="bg-card border border-borderColour rounded-xl p-6">
                    <SectionHeader title="Loan Details" sub="What kind of loan are you applying for?" />
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Loan Type">
                            <select className={INPUT_CLASS} value={loanType} onChange={handleLoanTypeChange} required>
                                <option value="">Select loan type</option>
                                {LOAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </Field>
                        <Input
                            label="Requested Amount (₹)"
                            type="number"
                            min={1}
                            placeholder="e.g. 500000"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* ── Personal Loan ── */}
                {loanType === 'Personal Loan' && (
                    <div className="bg-card border border-borderColour rounded-xl p-6">
                        <SectionHeader title="Personal Loan Details" sub="Employment details for personal loan assessment" />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Employer Name" type="text" value={details.employerName ?? ''} onChange={e => set('employerName', e.target.value)} required />
                            <Select label="Job Role" options={JOB_ROLE} placeholder="Select" value={details.jobRole ?? ''} onChange={e => set('jobRole', e.target.value)} required />
                            <Select label="Salary Mode" options={SALARY_MODE} placeholder="Select" value={details.salaryMode ?? ''} onChange={e => set('salaryMode', e.target.value)} required />
                            <Input label="Total Work Experience (months)" type="number" min={0} value={details.totalWorkExperienceMonths ?? ''} onChange={e => set('totalWorkExperienceMonths', e.target.value)} required />
                        </div>
                    </div>
                )}

                {/* ── Home Loan ── */}
                {loanType === 'Home Loan' && (
                    <div className="bg-card border border-borderColour rounded-xl p-6">
                        <SectionHeader title="Home Loan Details" sub="Property and collateral details" />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Property Value (₹)" type="number" min={1} value={details.propertyValue ?? ''} onChange={e => set('propertyValue', e.target.value)} required />
                            <Select label="Property Type" options={PROPERTY_TYPE} placeholder="Select" value={details.propertyType ?? ''} onChange={e => set('propertyType', e.target.value)} required />
                            <Input label="Down Payment (₹)" type="number" min={0} value={details.downPaymentAmount ?? ''} onChange={e => set('downPaymentAmount', e.target.value)} required />
                            <Select label="Property Location" options={CITY_TIER} placeholder="Select tier" value={details.propertyLocation ?? ''} onChange={e => set('propertyLocation', e.target.value)} required />
                        </div>
                        <div className="border-t border-borderColour mt-5 pt-5">
                            <p className="text-xs font-semibold text-accentSoft uppercase tracking-wide mb-4">Collateral Details</p>
                            <div className="grid grid-cols-3 gap-4">
                                <Select label="Collateral Type" options={COLLATERAL_TYPE} placeholder="Select" value={details.collateralDetails?.collateralType ?? ''} onChange={e => setCollateral('collateralType', e.target.value)} required />
                                <Input label="Asset Value (₹)" type="number" min={1} value={details.collateralDetails?.assetValue ?? ''} onChange={e => setCollateral('assetValue', e.target.value)} required />
                                <Select label="Ownership Type" options={OWNERSHIP_TYPE} placeholder="Select" value={details.collateralDetails?.ownershipType ?? ''} onChange={e => setCollateral('ownershipType', e.target.value)} required />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Education Loan ── */}
                {isEducationLoan && (
                    <div className="bg-card border border-borderColour rounded-xl p-6">
                        <SectionHeader title="Education Loan Details" sub="Course and institution details" />
                        <div className="grid grid-cols-2 gap-4">
                            <Select label="Course Type" options={COURSE_TYPE} placeholder="Select" value={details.courseType ?? ''} onChange={e => set('courseType', e.target.value)} required />
                            <Input label="Institution Name" type="text" value={details.institutionName ?? ''} onChange={e => set('institutionName', e.target.value)} required />
                            <Select label="Institution Type" options={INSTITUTION_TYPE} placeholder="Select" value={details.institutionType ?? ''} onChange={e => set('institutionType', e.target.value)} required />
                            <Select label="Institution Location" options={CITY_TIER} placeholder="Select tier" value={details.institutionLocation ?? ''} onChange={e => set('institutionLocation', e.target.value)} required />
                            <Input label="Course Duration (months)" type="number" min={1} value={details.courseDurationMonths ?? ''} onChange={e => set('courseDurationMonths', e.target.value)} required />
                            <Input label="Annual Tuition Fee (₹)" type="number" min={1} value={details.annualTuitionFee ?? ''} onChange={e => set('annualTuitionFee', e.target.value)} required />
                            <Input label="Total Course Fee (₹)" type="number" min={1} value={details.totalCourseFee ?? ''} onChange={e => set('totalCourseFee', e.target.value)} required />
                            <Input label="Moratorium Period (months)" type="number" min={0} value={details.moratoriumMonths ?? ''} onChange={e => set('moratoriumMonths', e.target.value)} required />
                            <Input label="Expected Salary After Course (₹)" type="number" min={0} value={details.expectedSalaryAfterCourse ?? ''} onChange={e => set('expectedSalaryAfterCourse', e.target.value)} />
                            <div className="flex items-center gap-3 col-span-2 mt-1">
                                <input
                                    type="checkbox"
                                    id="abroad"
                                    checked={details.isAbroadCourse ?? false}
                                    onChange={e => set('isAbroadCourse', e.target.checked)}
                                    className="w-4 h-4 accent-button"
                                />
                                <label htmlFor="abroad" className="text-sm text-bodyText cursor-pointer">This is an abroad course</label>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Vehicle Loan ── */}
                {loanType === 'Vehicle Loan' && (
                    <div className="bg-card border border-borderColour rounded-xl p-6">
                        <SectionHeader title="Vehicle Loan Details" sub="Vehicle purchase details" />
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Vehicle Price (₹)" type="number" min={1} value={details.vehiclePrice ?? ''} onChange={e => set('vehiclePrice', e.target.value)} required />
                            <Select label="Vehicle Type" options={VEHICLE_TYPE} placeholder="Select" value={details.vehicleType ?? ''} onChange={e => set('vehicleType', e.target.value)} required />
                            <Input label="Down Payment (₹)" type="number" min={0} value={details.downPayment ?? ''} onChange={e => set('downPayment', e.target.value)} required />
                            <Select label="Dealer Type" options={DEALER_TYPE} placeholder="Select" value={details.dealerType ?? ''} onChange={e => set('dealerType', e.target.value)} required />
                            <Input label="Vehicle Age (years, 0 if new)" type="number" min={0} value={details.vehicleAge ?? ''} onChange={e => set('vehicleAge', e.target.value)} />
                        </div>
                    </div>
                )}

                {/* ── Business Loan ── */}
                {loanType === 'Business Loan' && (
                    <div className="bg-card border border-borderColour rounded-xl p-6">
                        <SectionHeader title="Business Loan Details" sub="Your business financials" />
                        <div className="grid grid-cols-2 gap-4">
                            <Select label="Business Type" options={BUSINESS_TYPE} placeholder="Select" value={details.businessType ?? ''} onChange={e => set('businessType', e.target.value)} required />
                            <Input label="Business Vintage (months)" type="number" min={0} value={details.businessVintageMonths ?? ''} onChange={e => set('businessVintageMonths', e.target.value)} required />
                            <Input label="Annual Turnover (₹)" type="number" min={0} value={details.annualTurnover ?? ''} onChange={e => set('annualTurnover', e.target.value)} required />
                            <Input label="Profit Margin (%)" type="number" min={0} max={100} value={details.profitMarginPercent ?? ''} onChange={e => set('profitMarginPercent', e.target.value)} required />
                            <Select label="GST Filing History" options={GST_FILING_HISTORY} placeholder="Select" value={details.GSTFilingHistory ?? ''} onChange={e => set('GSTFilingHistory', e.target.value)} required />
                        </div>
                    </div>
                )}

                {/* ── Co-Applicant ── */}
                {loanType && (
                    <div className="bg-card border border-borderColour rounded-xl p-6">
                        <div className="flex items-center justify-between border-b border-borderColour pb-3 mb-4">
                            <div>
                                <p className="text-lg font-black text-heading">
                                    Co-Applicant
                                    {isEducationLoan && <span className="text-danger ml-1 text-sm">* Required</span>}
                                </p>
                                <p className="text-xs text-bodyText/50 mt-0.5">
                                    {isEducationLoan
                                        ? 'A co-applicant is mandatory for education loans'
                                        : 'Optional — adding one can improve your eligibility'}
                                </p>
                            </div>
                            {!isEducationLoan && (
                                <label className="flex items-center gap-2 text-sm text-bodyText cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hasCoApplicant}
                                        onChange={e => setHasCoApplicant(e.target.checked)}
                                        className="w-4 h-4 accent-button"
                                    />
                                    Add co-applicant
                                </label>
                            )}
                        </div>

                        {showCoApplicant && (
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Full Name" type="text" value={coApplicant.name} onChange={e => setCo('name', e.target.value)} required />
                                <Select label="Relationship" options={RELATIONSHIP} placeholder="Select" value={coApplicant.relationship} onChange={e => setCo('relationship', e.target.value)} required />
                                <Input label="Age" type="number" min={18} max={100} value={coApplicant.age} onChange={e => setCo('age', e.target.value)} required />
                                <Select label="Employment Type" options={EMPLOYMENT_TYPE} placeholder="Select" value={coApplicant.employmentType} onChange={e => setCo('employmentType', e.target.value)} required />
                                <Input label="Monthly Net Income (₹)" type="number" min={0} value={coApplicant.monthlyNetIncome} onChange={e => setCo('monthlyNetIncome', e.target.value)} required />
                                <Input label="Credit Score (0–900)" type="number" min={0} max={900} value={coApplicant.creditScore} onChange={e => setCo('creditScore', e.target.value)} required />
                                <div className="flex items-center gap-3 col-span-2">
                                    <input
                                        type="checkbox"
                                        id="primaryEarner"
                                        checked={coApplicant.isPrimaryEarner}
                                        onChange={e => setCo('isPrimaryEarner', e.target.checked)}
                                        className="w-4 h-4 accent-button"
                                    />
                                    <label htmlFor="primaryEarner" className="text-sm text-bodyText cursor-pointer">
                                        This co-applicant is the primary earner
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Submit */}
                {loanType && (
                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-button hover:bg-buttonHover duration-300 text-white font-black text-lg px-8 py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Checking...' : 'Run Eligibility Check →'}
                    </button>
                )}

            </form>
        </div>
    )
}

export default LoanCheck
