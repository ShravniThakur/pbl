import { useContext } from "react"
import { NavLink } from "react-router-dom"
import { AppContext } from "../context/AppContext"

const NAV_ITEMS = [
    { to: '/dashboard',         icon: '⬡',  label: 'Dashboard'        },
    { to: '/financial-profile', icon: '◈',  label: 'Financial Profile' },
    { to: '/loan-check',        icon: '◎',  label: 'Loan Eligibility'  },
    { to: '/loan-products',     icon: '★',  label: 'Loan Products'     },
    { to: '/loan-history',      icon: '▤',  label: 'History'           },
    { to: '/settings',          icon: '⚙',  label: 'Settings'          },
]

const Sidebar = () => {
    const { setToken } = useContext(AppContext)

    const logout = () => {
        localStorage.removeItem('token')
        setToken('')
    }

    const linkClass = ({ isActive }) =>
        `flex gap-2 items-center py-2 px-3 border-b border-borderColour transition-colors duration-200
        ${isActive ? 'bg-card text-accentSoft' : 'hover:bg-card text-bodyText hover:text-accentSoft'}`

    return (
        <div className="font-sans text-heading font-bold border-r border-borderColour h-full flex flex-col">
            <div className="flex-1">
                {NAV_ITEMS.map(({ to, icon, label }) => (
                    <NavLink key={to} to={to} className={linkClass}>
                        <span className="w-7 h-7 flex items-center justify-center text-xl flex-shrink-0">{icon}</span>
                        <p className="hidden sm:block">{label}</p>
                    </NavLink>
                ))}
            </div>
            <div
                onClick={logout}
                className="flex gap-2 items-center py-2 px-3 border-t border-borderColour hover:bg-card text-danger cursor-pointer transition-colors duration-200"
            >
                <span className="w-7 h-7 flex items-center justify-center text-xl flex-shrink-0">⏻</span>
                <p className="hidden sm:block">Log Out</p>
            </div>
        </div>
    )
}

export default Sidebar
