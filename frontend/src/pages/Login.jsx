import { useContext, useState } from "react"
import { AppContext } from "../context/AppContext"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"
import logo from "../assets/L.png"
import { ArrowRight, Lock } from "lucide-react"

const Login = () => {
    const { backend_url, setToken } = useContext(AppContext)
    const navigate = useNavigate()

    const [form, setForm] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const handleSubmit = async e => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await axios.post(backend_url + '/user/login', form)
            if (res.data.success) {
                setToken(res.data.token)
                localStorage.setItem('token', res.data.token)
                toast.success('Logged in successfully!')
                navigate('/dashboard')
            } else {
                toast.error(res.data.message)
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    const inputClass = `bg-white border border-border-default rounded-[9px] px-4 py-2.5 text-text-primary text-[14px] font-medium focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)] transition-all duration-200 w-full placeholder:text-text-muted/60`

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 font-inter bg-slate-50 relative overflow-hidden">
            
            {/* Background effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-[420px] flex flex-col items-center gap-8 relative z-10 animate-fade-up">

                {/* Logo & Header */}
                <div className="w-full flex flex-col items-center text-center gap-3">
                    <div onClick={() => navigate('/')} className="bg-white p-3 rounded-2xl shadow-sm border border-border-default flex justify-center items-center mb-2 cursor-pointer hover:scale-105 hover:shadow-md transition-all duration-200">
                        <img className="w-10 h-10 object-contain" src={logo} alt="LoanSense" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <h1 className="text-[40px] font-black text-sidebar-bg tracking-[-0.03em] leading-none py-4">Welcome back</h1>
                        <p className="text-[14px] font-medium text-text-muted">Sign in to your account</p>
                    </div>
                </div>

                {/* Auth Card */}
                <div className="w-full bg-surface border border-border-default rounded-[16px] p-8 sm:p-10 shadow-card">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                        <div className="flex flex-col gap-2">
                            <label className="text-[12px] font-bold text-text-primary uppercase tracking-[0.05em]">Email Address</label>
                            <input
                                className={inputClass}
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[12px] font-bold text-text-primary uppercase tracking-[0.05em]">Password</label>
                                <a href="#" className="text-[12px] font-bold text-primary hover:text-primary-hover transition-colors">Forgot?</a>
                            </div>
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary hover:bg-primary-hover duration-200 text-white font-bold text-[14px] px-6 py-3.5 rounded-[9px] mt-2 shadow-button-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group w-full"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                </>
                            )}
                        </button>

                    </form>
                </div>

                {/* Footer */}
                <div className="flex flex-col items-center gap-6 w-full">
                    <p className="text-[14px] font-medium text-text-muted">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-primary font-bold hover:text-primary-hover transition-colors">
                            Create one
                        </Link>
                    </p>
                    
                    <div className="flex items-center gap-2 text-[11px] font-bold text-text-muted/60 uppercase tracking-widest">
                        <Lock size={12} /> Secure Login Area
                    </div>
                </div>

            </div>
        </div>
    )
}

export default Login
