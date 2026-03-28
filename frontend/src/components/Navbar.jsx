import { useNavigate } from "react-router-dom"
import { useContext } from "react"
import { AppContext } from "../context/AppContext"
import { LogOut } from "lucide-react"
import logo from "../assets/Logo.png"

const Navbar = () => {
    const navigate = useNavigate()
    const { token, setToken } = useContext(AppContext)

    const handleLogout = () => {
        localStorage.removeItem('token')
        setToken('')
        navigate('/login')
    }

    return (
        <div className="bg-sidebar-bg h-[56px] border-b border-[#1E293B] shadow-sm flex items-center justify-between z-10 relative">
            
            {/* Logo */}
            <div
                onClick={() => navigate('/')}
            >
                <img className="w-42" src={logo} alt="LoanSense Logo" />
            </div>

            {/* Logout */}
            {token && (
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-[9px] text-sidebar-text hover:text-white hover:bg-white/10 transition-colors duration-150 cursor-pointer font-medium text-[13px]"
                >
                    <LogOut className="w-4 h-4 text-rose opacity-90 group-hover:opacity-100" />
                    <span className="text-white font-semibold">Log out</span>
                </button>
            )}
        </div>
    )
}

export default Navbar