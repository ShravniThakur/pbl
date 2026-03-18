import { useNavigate } from "react-router"

const Landing = () => {
    const navigate = useNavigate()

    return (
        <div className="text-bodyText font-sans min-h-screen">
            <div className="flex flex-col gap-20 mx-6 md:mx-16 py-16">

                {/* Hero */}
                <div className="lg:flex gap-16 items-center">
                    <div className="mb-10 lg:mb-0 lg:w-[60%]">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-button flex items-center justify-center text-white font-black text-lg">L</div>
                            <span className="text-heading font-black text-2xl tracking-tight">LOAN</span>
                        </div>
                        <p className="text-4xl md:text-5xl font-black text-heading leading-tight mb-6">
                            Know your loan <span className="text-accent">eligibility</span> before you apply.
                        </p>
                        <p className="text-xl font-semibold mb-4">
                            Get a <span className="text-accentSoft">personalized offer</span> based on your financial profile —
                            approved amount, interest rate, tenure, and EMI. Instantly.
                        </p>
                        <p className="text-base text-accentSoft font-semibold mb-10">
                            Supporting Personal, Home, Education, Vehicle & Business loans.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button onClick={() => navigate('/signup')} className="bg-button px-8 py-3 rounded-full hover:bg-buttonHover duration-300 font-bold text-lg text-white">
                                GET STARTED →
                            </button>
                            <button onClick={() => navigate('/login')} className="border border-borderColour px-8 py-3 rounded-full hover:bg-card duration-300 font-bold text-lg text-accentSoft">
                                SIGN IN
                            </button>
                        </div>
                    </div>
                    {/* Stats panel */}
                    <div className="lg:w-[40%] grid grid-cols-2 gap-4">
                        {[
                            { value: '5', label: 'Loan Types', icon: '📋' },
                            { value: 'Instant', label: 'Results', icon: '⚡' },
                            { value: '100%', label: 'Data Driven', icon: '📊' },
                            { value: 'Free', label: 'To Use', icon: '✅' },
                        ].map(({ value, label, icon }) => (
                            <div key={label} className="bg-card border border-borderColour rounded-2xl p-6 hover:bg-cardHover duration-300 text-center">
                                <p className="text-3xl mb-2">{icon}</p>
                                <p className="text-2xl font-black text-heading">{value}</p>
                                <p className="text-sm text-accentSoft font-semibold">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Features */}
                <div>
                    <p className="text-center font-black text-4xl text-heading mb-3">FEATURES</p>
                    <p className="text-center mb-10">Everything you need to make an informed loan decision.</p>
                    <div className="flex flex-col gap-5 md:grid grid-cols-2 lg:grid-cols-3">
                        {[
                            { icon: '🏦', title: 'Personal Loan', desc: 'Check eligibility based on your employment, income, and credit score. Get the best rate for your profile.' },
                            { icon: '🏠', title: 'Home Loan', desc: 'LTV checks, property valuation, collateral assessment — get a home loan offer tailored to your property.' },
                            { icon: '🎓', title: 'Education Loan', desc: 'Course type, institution, co-applicant support. Fund your future with a loan matched to your study plan.' },
                            { icon: '🚗', title: 'Vehicle Loan', desc: 'New or used vehicle financing with smart LTV checks, vehicle age validation, and dealer type scoring.' },
                            { icon: '💼', title: 'Business Loan', desc: 'Turnover, GST filing, business vintage — get a business loan offer based on your actual financials.' },
                            { icon: '📈', title: 'Risk & Eligibility Score', desc: 'Every check produces an eligibility score and risk category so you know exactly where you stand.' },
                        ].map(({ icon, title, desc }) => (
                            <div key={title} className="flex flex-col gap-4 bg-card rounded-2xl p-7 hover:bg-cardHover border border-borderColour duration-300">
                                <div className="flex gap-3 items-center">
                                    <span className="text-3xl">{icon}</span>
                                    <p className="font-bold text-xl text-accentSoft">{title}</p>
                                </div>
                                <p>{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* How It Works */}
                <div>
                    <p className="text-center font-black text-4xl text-heading mb-3">HOW IT WORKS</p>
                    <p className="text-center mb-10">Four simple steps to your loan offer.</p>
                    <div className="flex flex-col gap-5 sm:grid grid-cols-2 lg:grid-cols-4">
                        {[
                            { step: '01', icon: '👤', title: 'Create Account', desc: 'Sign up in seconds. No bank details required.' },
                            { step: '02', icon: '📋', title: 'Build Your Profile', desc: 'Enter your income, credit score, and financial obligations.' },
                            { step: '03', icon: '🔍', title: 'Run a Check', desc: 'Choose your loan type and fill in the loan-specific details.' },
                            { step: '04', icon: '✅', title: 'Get Your Offer', desc: 'Instantly see your approved amount, rate, tenure and EMI.' },
                        ].map(({ step, icon, title, desc }) => (
                            <div key={step} className="flex flex-col gap-4 bg-card rounded-2xl p-7 hover:bg-cardHover border border-borderColour duration-300">
                                <div className="flex gap-3 items-center">
                                    <span className="text-xs font-black text-button bg-button/10 px-2 py-1 rounded-lg">{step}</span>
                                    <span className="text-2xl">{icon}</span>
                                </div>
                                <p className="font-bold text-lg text-accentSoft">{title}</p>
                                <p className="text-sm">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rule Engine */}
                <div className="bg-card border border-borderColour rounded-2xl p-10">
                    <p className="text-center font-black text-4xl text-heading mb-3">SMART RULE ENGINE</p>
                    <p className="text-center mb-10">Our system checks every application against real-world lending rules.</p>
                    <div className="flex flex-col gap-4 md:grid grid-cols-2 lg:grid-cols-3">
                        {[
                            { icon: '📉', rule: 'Credit Score Check', desc: 'Minimum 600 required. Thin-file applicants supported for education loans.' },
                            { icon: '⚖️', rule: 'FOIR Limit', desc: 'Total obligations after new EMI must not exceed 50% of your monthly income.' },
                            { icon: '🏷️', rule: 'LTV Ratio', desc: 'Loan amount validated against property or vehicle value — 80% for home, 85% for vehicle.' },
                            { icon: '📅', rule: 'Business Vintage', desc: 'Business must be at least 12 months old with minimum ₹12L annual turnover.' },
                            { icon: '🔎', rule: 'Inquiry Check', desc: 'Too many recent loan inquiries (3+ in 6 months) signals risk and affects eligibility.' },
                            { icon: '💳', rule: 'Payment History', desc: 'Serious defaults result in automatic rejection. Clean history improves your offer.' },
                        ].map(({ icon, rule, desc }) => (
                            <div key={rule} className="flex gap-4 items-start bg-black/20 rounded-xl p-5 border border-borderColour">
                                <span className="text-2xl mt-1">{icon}</span>
                                <div>
                                    <p className="font-bold text-accentSoft mb-1">{rule}</p>
                                    <p className="text-sm">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQs */}
                <div>
                    <p className="text-center font-black text-4xl text-heading mb-3">FAQs</p>
                    <p className="text-center mb-10">Everything you need to know, explained simply.</p>
                    <div className="flex flex-col gap-5 md:grid grid-cols-2 lg:grid-cols-3">
                        {[
                            { q: 'What is Loan?', a: 'Loan is a loan eligibility checker that analyses your financial profile and tells you — before you apply — whether you qualify, how much you can get, and at what rate.' },
                            { q: 'Is my data secure?', a: 'Yes. Your financial data is protected with industry-standard JWT authentication and is never shared with third parties.' },
                            { q: 'Do I need a credit score?', a: 'For most loan types, yes — a minimum score of 600 is required. Education loans support thin-file (zero score) applicants with a co-applicant.' },
                            { q: 'What is a Financial Profile?', a: 'Your financial profile captures your income, employment, existing EMIs, credit score, and payment history. It powers every eligibility check you run.' },
                            { q: 'Can I add a co-applicant?', a: 'Yes. Co-applicants are mandatory for Education loans and optional for all other loan types. Adding one can improve your eligibility.' },
                            { q: 'Is it free to use?', a: 'Yes. All eligibility checks are completely free. Run as many checks as you need for any loan type.' },
                        ].map(({ q, a }) => (
                            <div key={q} className="flex flex-col gap-4 bg-card rounded-2xl p-7 hover:bg-cardHover border border-borderColour duration-300">
                                <div className="flex gap-3 items-start">
                                    <span className="text-xl mt-0.5">❓</span>
                                    <p className="font-bold text-lg text-accentSoft">{q}</p>
                                </div>
                                <p className="text-sm">{a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="bg-card border border-borderColour rounded-2xl p-10 flex flex-col md:flex-row gap-10 items-center justify-between">
                    <p className="md:w-[65%] text-xl font-semibold">
                        Get started with <span className="text-accentSoft font-black">Loan</span> and know your
                        eligibility before you walk into any bank. Whether it's a home, a car, your education,
                        or your business — make every application count.
                    </p>
                    <button onClick={() => navigate('/signup')} className="bg-button px-8 py-3 rounded-full hover:bg-buttonHover duration-300 font-bold text-lg text-white whitespace-nowrap">
                        GET STARTED →
                    </button>
                </div>

                {/* Testimonials */}
                <div>
                    <p className="text-center font-black text-4xl text-heading mb-3">Testimonials</p>
                    <div className="flex flex-col gap-5 md:grid grid-cols-2 lg:grid-cols-3 mt-10">
                        {[
                            { name: 'Arjun Mehta, Mumbai', text: '"I had no idea what loan amount I could get. Loan gave me a full breakdown in under a minute — approved amount, EMI, interest rate. Incredibly useful before meeting the bank."' },
                            { name: 'Sneha Rao, Bengaluru', text: '"Applying for an education loan abroad was stressful. This platform told me exactly what I needed — co-applicant details, course fee limits, everything. Saved me hours of research."' },
                            { name: 'Vikram Singh, Delhi', text: '"I was rejected by two banks before I found out my FOIR was too high. Loan flagged this immediately. I cleared some dues and re-checked — eligible this time."' },
                        ].map(({ name, text }) => (
                            <div key={name} className="flex flex-col gap-4 bg-card rounded-2xl p-7 hover:bg-cardHover border border-borderColour duration-300">
                                <div className="flex gap-3 items-center">
                                    <div className="w-9 h-9 rounded-full bg-button/20 border border-button flex items-center justify-center text-accentSoft font-bold">
                                        {name.charAt(0)}
                                    </div>
                                    <p className="font-bold text-accentSoft">{name}</p>
                                </div>
                                <p className="text-sm italic">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-borderColour pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-bodyText/50">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-button flex items-center justify-center text-white font-black text-sm">L</div>
                        <span className="font-black text-heading">LOAN</span>
                    </div>
                    <p>© 2025 Loan. All rights reserved.</p>
                    <div className="flex gap-6">
                        <button onClick={() => navigate('/login')} className="hover:text-accentSoft duration-200">Sign In</button>
                        <button onClick={() => navigate('/signup')} className="hover:text-accentSoft duration-200">Get Started</button>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default Landing
