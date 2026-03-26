import { useContext, useState } from "react"
import { AppContext } from "../context/AppContext"
import { Link, useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"
import logo from "../assets/L.png"

const Signup = () => {
    const { backend_url, setToken } = useContext(AppContext)
    const navigate = useNavigate()

    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const [loading, setLoading] = useState(false)

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const handleSubmit = async e => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await axios.post(backend_url + '/user/sign-up', form)
            if (res.data.success) {
                setToken(res.data.token)
                localStorage.setItem('token', res.data.token)
                toast.success('Account created successfully!')
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

    const inputClass = `bg-white border border-borderColour rounded-lg px-4 py-2.5 text-bodyText text-sm focus:outline-none focus:border-button transition-colors duration-200 w-full`

    return (
        <div className="min-h-screen flex items-center justify-center px-4 font-sans text-bodyText">

            <div className="w-full max-w-md flex flex-col gap-8">

                {/* Logo */}
                <div className="text-center">
                    <div className="flex justify-center">
                        <img className="w-20" src={logo}></img>
                    </div>
                    <p className="text-3xl font-black text-heading">Create account</p>
                    <p className="text-sm text-bodyText/60 mt-1">Start checking your loan eligibility for free</p>
                </div>

                {/* Card */}
                <div className="bg-card border border-borderColour rounded-xl p-8">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                        <div className="flex flex-col gap-1">
                            <p className="text-xs font-semibold text-accentSoft uppercase tracking-wide">Full Name</p>
                            <input
                                className={inputClass}
                                type="text"
                                name="name"
                                placeholder="Rahul Sharma"
                                value={form.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

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
                                placeholder="Min 8 chars, uppercase, number & symbol"
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
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>

                    </form>
                </div>

                <p className="text-center text-sm text-bodyText/60">
                    Already have an account?{' '}
                    <Link to="/login" className="text-accentSoft font-bold hover:text-buttonHover duration-200">
                        Sign in
                    </Link>
                </p>

            </div>
        </div>
    )
}

export default Signup
