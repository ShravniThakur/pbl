import { useContext } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { AppContext } from "../context/AppContext"
import { LayoutDashboard, UserCircle, Calculator, Building2, History, Settings2, LogOut } from "lucide-react"

const NAV_ITEMS = [
    { to: '/dashboard',         icon: LayoutDashboard,  label: 'Dashboard' },
    { to: '/financial-profile', icon: UserCircle,       label: 'Financial Profile' },
    { to: '/loan-check',        icon: Calculator,       label: 'Loan Eligibility' },
    { to: '/loan-products',     icon: Building2,        label: 'Loan Products' },
    { to: '/loan-history',      icon: History,          label: 'History' },
    { to: '/settings',          icon: Settings2,        label: 'Settings' },
]

const Sidebar = () => {
    const { setToken } = useContext(AppContext)
    const navigate = useNavigate()

    const logout = () => {
        localStorage.removeItem('token')
        setToken('')
        navigate('/login')
    }

    const linkClass = ({ isActive }) => {
        const baseClass = "flex items-center md:gap-3 py-3 px-3 relative transition-colors duration-200 group overflow-hidden "
        const activeClass = "bg-primary text-white"
        const defaultClass = "text-sidebar-text hover:bg-white/10 hover:text-white"
        
        return baseClass + (isActive ? activeClass : defaultClass)
    }

    return (
        <div className="bg-sidebar-bg w-[48px] md:w-[220px] shrink-0 border-r border-[#1E293B] h-full flex flex-col font-inter font-medium">
            <div className="flex-1 py-4">
                {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                    <NavLink key={to} to={to} className={linkClass}>
                        {({ isActive }) => (
                            <>
                                {isActive && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary-light rounded-r-full shadow-[0_0_8px_var(--color-primary-light)]" />}
                                <div className="w-6 shrink-0 flex items-center justify-center relative z-10">
                                    <Icon className={isActive ? "text-white" : "text-sidebar-text group-hover:text-white"} size={20} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className={`hidden md:block whitespace-nowrap text-sm relative z-10 ${isActive ? 'font-bold' : ''}`}>{label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
            
            <div className="px-3 pb-4">
                <div className="border-t border-[#1E293B] pt-2" />
                <div 
                    onClick={logout}
                    className="flex items-center md:gap-3 py-3 px-3 cursor-pointer text-sidebar-text hover:bg-white/10 hover:text-white transition-colors duration-200 group rounded-md"
                >
                    <div className="w-6 shrink-0 flex items-center justify-center">
                        <LogOut className="text-rose opacity-80 group-hover:opacity-100 group-hover:text-rose-light" size={20} />
                    </div>
                    <span className="hidden md:block whitespace-nowrap text-sm text-rose font-medium group-hover:text-rose-light">Log out</span>
                </div>
            </div>
        </div>
    )
}

export default Sidebar
