/**
 * RecommendedProducts.jsx
 * Matches the exact design language of LoanDetail.jsx:
 *   bg-card, border-borderColour, text-bodyText, text-heading,
 *   text-accentSoft, text-success, text-danger, bg-slate-50, rounded-xl
 */

const fmtAmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`

// Fit score → colour tokens that already exist in the app
function FitPill({ score }) {
    const cfg =
        score >= 80 ? { text: 'text-success',     bg: 'bg-success/10   border-success/30',  label: 'Excellent Fit' } :
        score >= 60 ? { text: 'text-accentSoft',  bg: 'bg-button/10    border-button/30',   label: 'Good Fit'      } :
        score >= 40 ? { text: 'text-yellow-500',  bg: 'bg-yellow-50    border-yellow-200',  label: 'Fair Fit'      } :
                      { text: 'text-bodyText/50', bg: 'bg-slate-100    border-borderColour', label: 'Low Fit'       }

    return (
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide
                          px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text}`}>
            {cfg.label} · {score}/100
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
        <div className={`relative bg-card border rounded-xl overflow-hidden
                         ${isTop ? 'border-accentSoft/40 ring-1 ring-accentSoft/20' : 'border-borderColour'}`}>

            {/* Best match ribbon */}
            {isTop && (
                <div className="absolute top-0 right-0">
                    <div className="bg-accentSoft text-white text-[10px] font-black uppercase
                                    tracking-widest px-3 py-1 rounded-bl-xl">
                        Best Match
                    </div>
                </div>
            )}

            <div className="p-5 flex flex-col gap-4">

                {/* Lender header */}
                <div className="flex items-start gap-3">
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={bankName}
                            className="w-10 h-10 rounded-lg object-contain border border-borderColour
                                       bg-white p-1 flex-shrink-0"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-borderColour
                                        flex items-center justify-center flex-shrink-0">
                            <span className="text-accentSoft font-black text-base">
                                {bankName.charAt(0)}
                            </span>
                        </div>
                    )}
                    <div className="flex-1 min-w-0 pr-8">
                        <p className="text-heading font-black text-sm leading-snug truncate">{productName}</p>
                        <p className="text-bodyText/50 text-xs mt-0.5">{bankName}</p>
                    </div>
                </div>

                {/* Fit score */}
                <FitPill score={fitScore} />

                {/* Description */}
                {description && (
                    <p className="text-bodyText/60 text-xs leading-relaxed line-clamp-2">{description}</p>
                )}

                {/* Key stats */}
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { label: 'Interest',   value: `${minInterestRate}–${maxInterestRate}%` },
                        { label: 'Max Amount', value: fmtAmt(maxAmount) },
                        { label: 'Max Tenure', value: `${maxTenureMonths} mo` },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-slate-50 border border-borderColour rounded-xl px-3 py-2.5 text-center">
                            <p className="text-bodyText/40 text-[10px] uppercase tracking-wide mb-1">{label}</p>
                            <p className="text-accentSoft font-black text-xs leading-tight">{value}</p>
                        </div>
                    ))}
                </div>

                {/* Range note */}
                <p className="text-bodyText/40 text-[11px]">
                    {fmtAmt(minAmount)} – {fmtAmt(maxAmount)} &nbsp;·&nbsp; {minTenureMonths}–{maxTenureMonths} months
                </p>

                {/* Feature bullets */}
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
        </div>
    )
}

export default function RecommendedProducts({ products }) {
    if (!products?.length) return null

    return (
        <div className="bg-card border border-borderColour rounded-xl p-6">

            {/* Section heading — mirrors other sections in LoanDetail */}
            <div className="flex items-center gap-2 mb-1">
                <span className="text-accentSoft text-lg">★</span>
                <p className="text-lg font-black text-heading">Recommended Loan Products</p>
            </div>
            <p className="text-xs text-bodyText/50 mb-5">
                Matched to your approved amount, credit score &amp; income · Sorted by best fit
            </p>

            {/* Cards grid */}
            <div className={`grid gap-4 ${
                products.length === 1 ? 'grid-cols-1 max-w-xs' :
                products.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                                        'grid-cols-1 sm:grid-cols-3'
            }`}>
                {products.map((p, i) => (
                    <ProductCard key={p.productId || i} product={p} rank={i} />
                ))}
            </div>

            <p className="text-bodyText/30 text-[11px] mt-4">
                Indicative products matched at time of check. Final terms subject to lender approval.
            </p>
        </div>
    )
}
