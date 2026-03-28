import { Award, CheckCircle2 } from "lucide-react"

const fmtAmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`

function FitPill({ score }) {
    const cfg =
        score >= 80 ? { text: 'text-emerald',     bg: 'bg-emerald-light border-[#A7F3D0]',  label: 'Excellent Fit' } :
        score >= 60 ? { text: 'text-primary',     bg: 'bg-primary/10    border-primary/20',     label: 'Good Fit'      } :
        score >= 40 ? { text: 'text-amber-600',   bg: 'bg-amber-100     border-amber-200',      label: 'Fair Fit'      } :
                      { text: 'text-text-muted',  bg: 'bg-[#F5F5F4]     border-border-default', label: 'Low Fit'       }

    return (
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.05em]
                          px-2.5 py-1 rounded-[6px] border ${cfg.bg} ${cfg.text}`}>
            {cfg.label} <span className="opacity-60 font-semibold px-0.5">•</span> {score}/100
        </span>
    )
}

function ProductCard({ product, rank }) {
    const {
        bankName, productName, logoUrl, description, features,
        minAmount, maxAmount, minInterestRate, maxInterestRate,
        minTenureMonths, maxTenureMonths, fitScore,
    } = product

    const isTop = rank === 0

    return (
        <div className={`relative bg-surface border rounded-[14px] overflow-hidden flex flex-col transition-shadow hover:shadow-card
                         ${isTop ? 'border-primary/40 ring-1 ring-primary/20 shadow-sm' : 'border-border-default'}`}>

            {/* Best match ribbon */}
            {isTop && (
                <div className="absolute top-0 right-0 z-10">
                    <div className="bg-primary text-white text-[10px] font-bold uppercase tracking-[0.1em]
                                    px-3.5 py-1.5 rounded-bl-[14px] flex items-center gap-1.5 shadow-sm">
                        <Award size={12} /> Best Match
                    </div>
                </div>
            )}

            <div className="p-5 sm:p-6 flex flex-col gap-5 flex-1 relative z-0">
                {/* Lender header */}
                <div className="flex items-start gap-3.5 pr-16 sm:pr-24">
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

                {/* Score & Config */}
                <div>
                    <FitPill score={fitScore} />
                </div>

                {/* Description */}
                {description && (
                    <p className="text-[13px] font-medium text-text-muted leading-relaxed line-clamp-2">{description}</p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mt-auto">
                    {[
                        { label: 'Interest',   value: `${minInterestRate}–${maxInterestRate}%` },
                        { label: 'Max Amt',    value: fmtAmt(maxAmount) },
                        { label: 'Max Term',   value: `${maxTenureMonths} mo` },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-[#F8F7F4] border border-border-default rounded-[9px] px-2 py-2.5 text-center flex flex-col justify-center">
                            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-[0.05em] mb-1">{label}</p>
                            <p className="text-[13px] font-bold text-primary leading-none">{value}</p>
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
            
            <div className="bg-[#F8F7F4] border-t border-border-default px-5 sm:px-6 py-3">
                <p className="text-[11px] font-semibold text-text-muted text-center cursor-default">
                    Limits: {fmtAmt(minAmount)} TO {fmtAmt(maxAmount)} • {minTenureMonths}–{maxTenureMonths} MO
                </p>
            </div>
        </div>
    )
}

export default function RecommendedProducts({ products }) {
    if (!products?.length) return null

    return (
        <div className="bg-surface border border-border-default rounded-[14px] p-6 sm:p-8 shadow-card">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <Award className="text-primary shrink-0" size={24} />
                <h2 className="text-[20px] font-bold text-text-primary">Recommended Loan Products</h2>
            </div>
            <p className="text-[13px] font-medium text-text-muted mb-6">
                Products customized for your profile based on amount, score, and eligibility.
            </p>

            {/* Grid */}
            <div className={`grid gap-5 ${
                products.length === 1 ? 'grid-cols-1 max-w-sm' :
                products.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                                        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}>
                {products.map((p, i) => (
                    <ProductCard key={p.productId || i} product={p} rank={i} />
                ))}
            </div>

            <p className="text-[11px] font-medium text-text-muted mt-5 text-center px-4">
                Indicative products matched at the time of your check. Final terms are subject to formal lender approval.
            </p>
        </div>
    )
}
