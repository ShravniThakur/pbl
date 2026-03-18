import { createContext, useState } from "react";

export const AppContext = createContext()

const AppProvider = ({ children }) => {
    const backend_url = import.meta.env.VITE_BACKEND_URL
    const [token, setToken] = useState(localStorage.getItem('token') || '')

    const value = {
        backend_url,
        token,
        setToken,
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

export default AppProvider