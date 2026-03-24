import { useContext, useState } from "react"
import { AppContext } from "../context/AppContext"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"

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

    const inputClass = `bg-black/30 border border-borderColour rounded-lg px-4 py-2.5 text-bodyText text-sm focus:outline-none focus:border-button transition-colors duration-200 w-full`

    return (
        <div className="min-h-screen flex items-center justify-center px-4 font-sans text-bodyText">

            <div className="w-full max-w-md flex flex-col gap-8">

                {/* Logo */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-button mb-4 shadow-lg shadow-button/20">
                        <span className="text-white font-black text-xl">L</span>
                    </div>
                    <p className="text-3xl font-black text-heading">Welcome back</p>
                    <p className="text-sm text-bodyText/60 mt-1">Sign in to your Loan account</p>
                </div>

                {/* Card */}
                <div className="bg-card border border-borderColour rounded-2xl p-8">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                        <div className="flex flex-col gap-1">
                            <p className="text-xs font-semibold text-accentSoft uppercase tracking-wide">Email</p>
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

                        <div className="flex flex-col gap-1">
                            <p className="text-xs font-semibold text-accentSoft uppercase tracking-wide">Password</p>
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
                            className="bg-button hover:bg-buttonHover duration-300 text-white font-black text-base px-8 py-3 rounded-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>

                    </form>
                </div>

                <p className="text-center text-sm text-bodyText/60">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-accentSoft font-bold hover:text-buttonHover duration-200">
                        Create one
                    </Link>
                </p>

            </div>
        </div>
    )
}

export default Login
