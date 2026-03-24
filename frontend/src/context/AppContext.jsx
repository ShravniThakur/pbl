import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export const AppContext = createContext();

const AppProvider = ({ children }) => {
    const backend_url = import.meta.env.VITE_BACKEND_URL;
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    
    // ✅ FIX: Initialize as an empty object. NEVER leave this empty or null.
    // This prevents "Cannot destructure property 'id' of 'undefined'"
    const [user, setUser] = useState({}); 

    useEffect(() => {
        if (token && token !== 'undefined' && token !== 'null') {
            try {
                const decoded = jwtDecode(token);
                // Map the token data to the 'user' object
                setUser({
                    id: decoded.id || decoded.userId || '',
                    name: decoded.name || 'User'
                });
            } catch (err) {
                console.error("JWT Decode Error:", err);
                setUser({}); 
            }
        } else {
            setUser({}); 
        }
    }, [token]);

    const value = {
        backend_url,
        token,
        setToken,
        user, // Now 'user' is always {}, so { id } = user won't crash
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export default AppProvider;