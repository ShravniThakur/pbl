import { useNavigate } from "react-router-dom"
import { useContext } from "react"
import { AppContext } from "../context/AppContext"

const Navbar = () => {
    const navigate = useNavigate()
    const { token, setToken } = useContext(AppContext)

    const handleLogout = () => {
        // ✅ remove correct key
        localStorage.removeItem('token')

        // ✅ clear global state
        setToken('')

        // ✅ redirect
        navigate('/login')
    }

    return (
        <div className="border-b border-borderColour p-3 h-full flex items-center justify-between">
            
            {/* Logo */}
            <div
                onClick={() => navigate('/')}
                className="flex items-center gap-3 cursor-pointer"
            >
                <div className="w-9 h-9 rounded-xl bg-button flex items-center justify-center text-white font-black text-base">
                    L
                </div>
                <span className="text-heading font-black text-xl tracking-tight">
                    LOAN
                </span>
            </div>

            {/* Logout */}
            {token && (
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-borderColour text-heading font-semibold text-sm hover:bg-button hover:text-white hover:border-button transition-colors duration-200 cursor-pointer"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
                        />
                    </svg>
                    Log out
                </button>
            )}
        </div>
    )
}

export default Navbar