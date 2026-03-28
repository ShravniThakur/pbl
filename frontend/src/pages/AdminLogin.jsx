import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/L.png'
import { ArrowRight, Lock, ShieldAlert } from "lucide-react"

// Reads the same env var every other page uses for API calls
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const AdminLogin = () => {
    const [form,    setForm]    = useState({ email: '', password: '' })
    const [error,   setError]   = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const res  = await fetch(`${BACKEND_URL}/api/admin/login`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(form),
            })
            const json = await res.json()
            if (!json.success) throw new Error(json.message)
            localStorage.setItem('adminToken', json.data.token)
            navigate('/admin/dashboard')
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const inputClass = `bg-white border border-border-default rounded-[9px] px-4 py-2.5 text-text-primary text-[14px] font-medium focus:outline-none focus:border-rose focus:shadow-[0_0_0_3px_rgba(244,63,94,0.15)] transition-all duration-200 w-full placeholder:text-text-muted/60`

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 font-inter bg-slate-50 relative overflow-hidden">
            
            {/* Background effects - Admin specific (Rose hue) */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-rose/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-rose/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-[420px] flex flex-col items-center gap-8 relative z-10 animate-fade-up">

                {/* Logo & Header */}
                <div className="w-full flex flex-col items-center text-center gap-3">
                    <div onClick={() => navigate('/')} className="bg-white p-3 rounded-2xl shadow-sm border border-border-default flex justify-center items-center mb-2 cursor-pointer hover:scale-105 hover:shadow-md transition-all duration-200">
                        <img className="w-10 h-10 object-contain" src={logo} alt="LoanSense" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <h1 className="text-[40px] font-black text-sidebar-bg tracking-[-0.03em] leading-none py-4">Admin Portal</h1>
                        <p className="text-[14px] font-medium text-text-muted">Sign in with administrator credentials</p>
                    </div>
                </div>

                {/* Badge */}
                <div className="flex justify-center -mt-4">
                    <span className="flex items-center gap-2 bg-rose-light border border-[#FECDD3] text-[11px] font-bold text-rose uppercase tracking-[0.05em] px-4 py-1.5 rounded-[8px]">
                        <ShieldAlert size={14} />
                        Restricted access
                    </span>
                </div>

                {/* Auth Card */}
                <div className="w-full bg-surface border border-border-default rounded-[16px] p-8 sm:p-10 shadow-card">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                        <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-bold text-text-primary uppercase tracking-[0.05em]">Admin Email</label>
                            <input
                                className={inputClass}
                                type="email"
                                name="email"
                                placeholder="admin@loansense.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-bold text-text-primary uppercase tracking-[0.05em]">Password</label>
                            <input
                                className={inputClass}
                                type="password"
                                name="password"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2.5 bg-rose-light border border-[#FECDD3] rounded-[9px] px-4 py-3">
                                <div className="w-5 h-5 rounded-full bg-rose/20 flex items-center justify-center shrink-0">
                                    <span className="text-rose font-black text-[10px]">!</span>
                                </div>
                                <p className="text-[13px] font-bold text-rose">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-text-primary hover:bg-black duration-200 text-white font-bold text-[14px] px-6 py-3.5 rounded-[9px] mt-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group w-full"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Secure Sign In
                                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                </>
                            )}
                        </button>

                    </form>
                </div>

                {/* Footer */}
                <div className="flex flex-col items-center gap-6 w-full">
                    <p className="text-[14px] font-medium text-text-muted">
                        Not an admin?{' '}
                        <a href="/login" className="text-text-primary font-bold hover:text-black transition-colors">
                            Back to user login
                        </a>
                    </p>
                    
                    <div className="flex items-center gap-2 text-[11px] font-bold text-text-muted/60 uppercase tracking-widest">
                        <Lock size={12} /> System Admin Verification Required
                    </div>
                </div>

            </div>
        </div>
    )
}

export default AdminLogin
