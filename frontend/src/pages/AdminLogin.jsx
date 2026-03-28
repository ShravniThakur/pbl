import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/L.png'

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

    const inputClass = `bg-white border border-borderColour rounded-lg px-4 py-2.5 text-bodyText text-sm
        focus:outline-none focus:border-button transition-colors duration-200 w-full`

    return (
        <div className="min-h-screen flex items-center justify-center px-4 font-sans text-bodyText">
            <div className="w-full max-w-md flex flex-col gap-8">

                {/* Logo + heading */}
                <div className="text-center">
                    <div className="flex justify-center mb-3">
                        <img className="w-20" src={logo} alt="Logo" />
                    </div>
                    <p className="text-3xl font-black text-heading">Admin Portal</p>
                    <p className="text-sm text-bodyText/60 mt-1">Sign in with your administrator credentials</p>
                </div>

                {/* Badge */}
                <div className="flex justify-center">
                    <span className="flex items-center gap-2 bg-card border border-borderColour
                                     text-xs font-semibold text-bodyText/60 px-4 py-1.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-button inline-block" />
                        Restricted access · admin only
                    </span>
                </div>

                {/* Card */}
                <div className="bg-card border border-borderColour rounded-xl p-8">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                        <div className="flex flex-col gap-1">
                            <p className="text-xs font-semibold text-accentSoft uppercase tracking-wide">
                                Admin Email
                            </p>
                            <input
                                className={inputClass}
                                type="email"
                                name="email"
                                placeholder="admin@loanapp.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <p className="text-xs font-semibold text-accentSoft uppercase tracking-wide">
                                Password
                            </p>
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
                            <div className="flex items-center gap-2 bg-danger/5 border border-danger/20
                                            rounded-lg px-4 py-3">
                                <span className="text-danger font-bold flex-shrink-0">✗</span>
                                <p className="text-danger text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-button hover:bg-buttonHover duration-300 text-white font-black
                                       text-base px-8 py-3 rounded-full mt-2 disabled:opacity-50
                                       disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign In →'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-bodyText/60">
                    Not an admin?{' '}
                    <a href="/login" className="text-accentSoft font-bold hover:text-buttonHover duration-200">
                        Back to user login
                    </a>
                </p>

            </div>
        </div>
    )
}

export default AdminLogin
