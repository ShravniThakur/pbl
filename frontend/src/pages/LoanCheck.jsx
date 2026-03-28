import { useContext, useEffect, useState } from "react"
import { AppContext } from "../context/AppContext"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"
import { CheckCircle, AlertCircle } from "lucide-react"
import {
    LOAN_TYPES, SALARY_MODE, PROPERTY_TYPE, CITY_TIER, COURSE_TYPE,
    COLLATERAL_TYPE, OWNERSHIP_TYPE, VEHICLE_TYPE, DEALER_TYPE,
    BUSINESS_TYPE, GST_FILING_HISTORY, EMPLOYMENT_TYPE, RELATIONSHIP,
    JOB_ROLE, INSTITUTION_TYPE
} from "../utils/enums"

// ─── Constants ────────────────────────────────────────────────────────────────

const INPUT_CLASS = `bg-surface border border-border-default rounded-[9px] px-3 py-2.5 text-text-primary text-sm
    focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)] transition-shadow duration-200
    disabled:opacity-50 disabled:cursor-not-allowed w-full font-medium placeholder:text-text-muted`

const EMPTY_CO_APPLICANT = {
    name: '', relationship: '', age: '', employmentType: '',
    monthlyNetIncome: '', creditScore: '', existingEmis: [],
    otherLoans: [], isPrimaryEarner: false,
}

const NUMERIC_LOAN_FIELDS = [
    'totalWorkExperienceMonths', 'propertyValue', 'downPaymentAmount',
    'courseDurationMonths', 'annualTuitionFee', 'totalCourseFee',
    'moratoriumMonths', 'expectedSalaryAfterCourse', 'vehiclePrice',
    'downPayment', 'vehicleAge', 'businessVintageMonths',
    'annualTurnover', 'profitMarginPercent',
]

// ─── Sub-components ───────────────────────────────────────────────────────────

const Field = ({ label, children }) => (
    <div className="flex flex-col gap-1.5 z-10 relative">
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.07em]">{label}</p>
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
            {placeholder && <option value="" disabled className="text-text-muted">{placeholder}</option>}
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    </Field>
)

const SectionCard = ({ step, title, sub, children }) => (
    <div className="bg-surface relative border border-border-default rounded-[14px] p-6 shadow-card overflow-hidden">
        {step && (
            <div className="absolute -top-10 -right-4 text-[150px] font-black text-[#F1F0EE] select-none pointer-events-none leading-none z-0">
                {step}
            </div>
        )}
        <div className="mb-6 relative z-10">
            <h2 className="text-[18px] font-semibold text-text-primary">{title}</h2>
            {sub && <p className="text-sm text-text-muted mt-1">{sub}</p>}
        </div>
        <div className="relative z-10">{children}</div>
    </div>
)

const DisplayGrid = ({ children }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">{children}</div>
)

// ─── LoanCheck ────────────────────────────────────────────────────────────────

const LoanCheck = () => {
    const { token, backend_url } = useContext(AppContext)
    const navigate = useNavigate()

    const [loanType,       setLoanType]       = useState('')
    const [amount,         setAmount]         = useState('')
    const [details,        setDetails]        = useState({})
    const [hasCoApplicant, setHasCoApplicant] = useState(false)
    const [coApplicant,    setCoApplicant]    = useState(EMPTY_CO_APPLICANT)
    const [submitting,     setSubmitting]     = useState(false)

    useEffect(() => {
        if (!token) navigate('/login')
    }, [token, navigate])

    const isEducationLoan = loanType === 'Education Loan'
    const showCoApplicant = isEducationLoan || hasCoApplicant

    const set = (k, v) => setDetails(d => ({ ...d, [k]: v }))
    const setCo = (k, v) => setCoApplicant(c => ({ ...c, [k]: v }))

    const setCollateral = (k, v) =>
        setDetails(d => ({
            ...d,
            collateralDetails: { ...d.collateralDetails, [k]: v },
        }))

    const handleLoanTypeChange = (e) => {
        setLoanType(e.target.value)
        setDetails({})
        setHasCoApplicant(false)
        setCoApplicant(EMPTY_CO_APPLICANT)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const loanDetails = { ...details }

            NUMERIC_LOAN_FIELDS.forEach(f => {
                if (loanDetails[f] !== undefined && loanDetails[f] !== '')
                    loanDetails[f] = Number(loanDetails[f])
            })

            if (loanDetails.collateralDetails?.assetValue !== undefined &&
                loanDetails.collateralDetails.assetValue !== '') {
                loanDetails.collateralDetails.assetValue =
                    Number(loanDetails.collateralDetails.assetValue)
            }

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

    return (
        <div className="max-w-6xl w-full mx-auto px-6 py-8 flex flex-col gap-8 font-inter animate-fade-up">

            {/* Header */}
            <div>
                <h1 className="text-[40px] font-black text-sidebar-bg tracking-[-0.03em] leading-tight py-4">Check Eligibility</h1>
                <p className="text-sm font-medium text-text-muted mt-1">Fill in the details to get an instant loan eligibility result.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">

                {/* Step 1: Base Details */}
                <SectionCard step="1" title="Loan Requirements" sub="What kind of loan are you applying for?">
                    <DisplayGrid>
                        <Field label="Loan Type">
                            <select className={INPUT_CLASS} value={loanType} onChange={handleLoanTypeChange} required>
                                <option value="" disabled className="text-text-muted">Select loan type</option>
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
                    </DisplayGrid>
                </SectionCard>

                {/* Step 2: Specific Details */}
                {loanType === 'Personal Loan' && (
                    <SectionCard step="2" title="Personal Loan Assessment" sub="Employment specific details">
                        <DisplayGrid>
                            <Input label="Employer Name" type="text" value={details.employerName ?? ''} onChange={e => set('employerName', e.target.value)} required placeholder="Company Name"/>
                            <Select label="Job Role" options={JOB_ROLE} placeholder="Select Role" value={details.jobRole ?? ''} onChange={e => set('jobRole', e.target.value)} required />
                            <Select label="Salary Mode" options={SALARY_MODE} placeholder="Select Mode" value={details.salaryMode ?? ''} onChange={e => set('salaryMode', e.target.value)} required />
                            <Input label="Work Experience (months)" type="number" min={0} value={details.totalWorkExperienceMonths ?? ''} onChange={e => set('totalWorkExperienceMonths', e.target.value)} required placeholder="Months" />
                        </DisplayGrid>
                    </SectionCard>
                )}

                {loanType === 'Home Loan' && (
                    <SectionCard step="2" title="Home Loan Properties" sub="Property and collateral information">
                        <DisplayGrid>
                            <Input label="Property Value (₹)" type="number" min={1} value={details.propertyValue ?? ''} onChange={e => set('propertyValue', e.target.value)} required placeholder="Total Value" />
                            <Select label="Property Type" options={PROPERTY_TYPE} placeholder="Select Type" value={details.propertyType ?? ''} onChange={e => set('propertyType', e.target.value)} required />
                            <Input label="Down Payment (₹)" type="number" min={0} value={details.downPaymentAmount ?? ''} onChange={e => set('downPaymentAmount', e.target.value)} required placeholder="Amount" />
                            <Select label="Location Tier" options={CITY_TIER} placeholder="Select Tier" value={details.propertyLocation ?? ''} onChange={e => set('propertyLocation', e.target.value)} required />
                        </DisplayGrid>
                        
                        <div className="mt-8 pt-6 border-t border-border-default">
                            <p className="text-[13px] font-bold text-text-primary mb-5">Collateral Details</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <Select label="Collateral Type" options={COLLATERAL_TYPE} placeholder="Select Type" value={details.collateralDetails?.collateralType ?? ''} onChange={e => setCollateral('collateralType', e.target.value)} required />
                                <Input label="Asset Value (₹)" type="number" min={1} value={details.collateralDetails?.assetValue ?? ''} onChange={e => setCollateral('assetValue', e.target.value)} required placeholder="Value" />
                                <Select label="Ownership" options={OWNERSHIP_TYPE} placeholder="Select Setup" value={details.collateralDetails?.ownershipType ?? ''} onChange={e => setCollateral('ownershipType', e.target.value)} required />
                            </div>
                        </div>
                    </SectionCard>
                )}

                {isEducationLoan && (
                    <SectionCard step="2" title="Education Loan Details" sub="Course details and projected earnings">
                        <DisplayGrid>
                            <Select label="Course Type" options={COURSE_TYPE} placeholder="Select Type" value={details.courseType ?? ''} onChange={e => set('courseType', e.target.value)} required />
                            <Input label="Institution Name" type="text" value={details.institutionName ?? ''} onChange={e => set('institutionName', e.target.value)} required placeholder="University/College" />
                            <Select label="Institution Type" options={INSTITUTION_TYPE} placeholder="Select Type" value={details.institutionType ?? ''} onChange={e => set('institutionType', e.target.value)} required />
                            <Select label="Institution Location" options={CITY_TIER} placeholder="Select Tier" value={details.institutionLocation ?? ''} onChange={e => set('institutionLocation', e.target.value)} required />
                            <Input label="Duration (months)" type="number" min={1} value={details.courseDurationMonths ?? ''} onChange={e => set('courseDurationMonths', e.target.value)} required placeholder="Total Months" />
                            <Input label="Annual Tuition Fee (₹)" type="number" min={1} value={details.annualTuitionFee ?? ''} onChange={e => set('annualTuitionFee', e.target.value)} required placeholder="Fee per year" />
                            <Input label="Total Course Fee (₹)" type="number" min={1} value={details.totalCourseFee ?? ''} onChange={e => set('totalCourseFee', e.target.value)} required placeholder="Total Fee" />
                            <Input label="Moratorium (months)" type="number" min={0} value={details.moratoriumMonths ?? ''} onChange={e => set('moratoriumMonths', e.target.value)} required placeholder="Grace period" />
                            <Input label="Expected Salary After (₹)" type="number" min={0} value={details.expectedSalaryAfterCourse ?? ''} onChange={e => set('expectedSalaryAfterCourse', e.target.value)} placeholder="Projected Salary" />
                            <div className="flex items-center gap-3 col-span-1 sm:col-span-2 mt-4 p-4 bg-[#F8F7F4] rounded-xl border border-border-default">
                                <input
                                    type="checkbox"
                                    id="abroad"
                                    checked={details.isAbroadCourse ?? false}
                                    onChange={e => set('isAbroadCourse', e.target.checked)}
                                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                                />
                                <label htmlFor="abroad" className="text-sm font-semibold text-text-primary cursor-pointer select-none">
                                    Course is located outside India
                                </label>
                            </div>
                        </DisplayGrid>
                    </SectionCard>
                )}

                {loanType === 'Vehicle Loan' && (
                    <SectionCard step="2" title="Vehicle Loan Assesment" sub="Asset valuation details">
                        <DisplayGrid>
                            <Input label="Vehicle Price (₹)" type="number" min={1} value={details.vehiclePrice ?? ''} onChange={e => set('vehiclePrice', e.target.value)} required placeholder="Total Price" />
                            <Select label="Vehicle Type" options={VEHICLE_TYPE} placeholder="Select Type" value={details.vehicleType ?? ''} onChange={e => set('vehicleType', e.target.value)} required />
                            <Input label="Down Payment (₹)" type="number" min={0} value={details.downPayment ?? ''} onChange={e => set('downPayment', e.target.value)} required placeholder="Amount" />
                            <Select label="Dealer Type" options={DEALER_TYPE} placeholder="Select Setup" value={details.dealerType ?? ''} onChange={e => set('dealerType', e.target.value)} required />
                            <Input label="Vehicle Age (years)" type="number" min={0} value={details.vehicleAge ?? ''} onChange={e => set('vehicleAge', e.target.value)} placeholder="0 if new" />
                        </DisplayGrid>
                    </SectionCard>
                )}

                {loanType === 'Business Loan' && (
                    <SectionCard step="2" title="Business Financials" sub="Company statistics and revenue">
                        <DisplayGrid>
                            <Select label="Business Type" options={BUSINESS_TYPE} placeholder="Select Type" value={details.businessType ?? ''} onChange={e => set('businessType', e.target.value)} required />
                            <Input label="Business Vintage (months)" type="number" min={0} value={details.businessVintageMonths ?? ''} onChange={e => set('businessVintageMonths', e.target.value)} required placeholder="Months active" />
                            <Input label="Annual Turnover (₹)" type="number" min={0} value={details.annualTurnover ?? ''} onChange={e => set('annualTurnover', e.target.value)} required placeholder="Annual Revenue" />
                            <Input label="Profit Margin (%)" type="number" min={0} max={100} value={details.profitMarginPercent ?? ''} onChange={e => set('profitMarginPercent', e.target.value)} required placeholder="Margin" />
                            <Select label="GST Filing History" options={GST_FILING_HISTORY} placeholder="Select Records" value={details.GSTFilingHistory ?? ''} onChange={e => set('GSTFilingHistory', e.target.value)} required />
                        </DisplayGrid>
                    </SectionCard>
                )}

                {/* Step 3: Co-Applicant */}
                {loanType && (
                    <SectionCard step="3" title="Co-Applicant Details" sub={isEducationLoan ? 'Mandatory for education loans' : 'Optional — can improve eligibility'}>
                        {(!isEducationLoan && !showCoApplicant) && (
                            <div className="py-6 flex justify-center border-b border-border-default mb-6">
                                <label className="flex items-center gap-2 px-4 py-2 border border-border-default rounded-[9px] cursor-pointer hover:bg-[#F8F7F4] transition-colors shadow-sm">
                                    <input
                                        type="checkbox"
                                        checked={hasCoApplicant}
                                        onChange={e => setHasCoApplicant(e.target.checked)}
                                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                                    />
                                    <span className="text-sm font-semibold text-text-primary">Include a Co-Applicant</span>
                                </label>
                            </div>
                        )}
                        {(!isEducationLoan && showCoApplicant) && (
                             <div className="mb-6 flex items-center justify-between border-b border-border-default pb-5">
                                <label className="flex items-center gap-3 text-sm font-semibold text-text-primary cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={hasCoApplicant}
                                        onChange={e => setHasCoApplicant(e.target.checked)}
                                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                                    />
                                    Include a Co-Applicant
                                </label>
                             </div>
                        )}

                        {showCoApplicant && (
                            <DisplayGrid>
                                <Input label="Full Name" type="text" value={coApplicant.name} onChange={e => setCo('name', e.target.value)} required placeholder="Legal Name" />
                                <Select label="Relationship" options={RELATIONSHIP} placeholder="Select Relation" value={coApplicant.relationship} onChange={e => setCo('relationship', e.target.value)} required />
                                <Input label="Age" type="number" min={18} max={100} value={coApplicant.age} onChange={e => setCo('age', e.target.value)} required placeholder="Years" />
                                <Select label="Employment Type" options={EMPLOYMENT_TYPE} placeholder="Select Type" value={coApplicant.employmentType} onChange={e => setCo('employmentType', e.target.value)} required />
                                <Input label="Net Income (per month)" type="number" min={0} value={coApplicant.monthlyNetIncome} onChange={e => setCo('monthlyNetIncome', e.target.value)} required placeholder="₹" />
                                <Input label="Credit Score (0–900)" type="number" min={0} max={900} value={coApplicant.creditScore} onChange={e => setCo('creditScore', e.target.value)} required placeholder="Score" />
                                
                                <div className="mt-4 p-4 bg-[#F8F7F4] rounded-xl border border-border-default flex items-center gap-3 col-span-1 sm:col-span-2">
                                    <input
                                        type="checkbox"
                                        id="primaryEarner"
                                        checked={coApplicant.isPrimaryEarner}
                                        onChange={e => setCo('isPrimaryEarner', e.target.checked)}
                                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                                    />
                                    <label htmlFor="primaryEarner" className="text-sm font-semibold text-text-primary cursor-pointer select-none flex items-center gap-2">
                                        Primary Earner Status <AlertCircle size={14} className="text-text-muted" />
                                    </label>
                                </div>
                            </DisplayGrid>
                        )}
                        {(!showCoApplicant && !isEducationLoan) && (
                            <div className="pb-4 pt-2 flex justify-center text-text-muted text-sm font-medium">
                                No co-applicant selected.
                            </div>
                        )}
                    </SectionCard>
                )}

                {/* Submit Action */}
                {loanType && (
                    <div className="pt-2 pb-10">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold text-base py-3.5 rounded-[9px] shadow-button-primary transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {submitting ? (
                                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Assessing</>
                            ) : (
                                <><CheckCircle size={20} /> Run Eligibility Check</>
                            )}
                        </button>
                    </div>
                )}
            </form>
        </div>
    )
}

export default LoanCheck
