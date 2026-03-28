import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";

const ProtectedRoutes = () => {
    const { token } = useContext(AppContext)

    if (!token) return <Navigate to='/login' replace></Navigate>
    
    // Navbar is h-[56px], Sidebar is w-[48px] md:w-[220px]
    return (
        <div className="flex flex-col min-h-screen bg-page">
            <div className="fixed top-0 left-0 right-0 z-50 h-[56px]">
                <Navbar />
            </div>
            
            <div className="flex flex-1 pt-[56px]">
                <div className="fixed left-0 top-[56px] bottom-0 z-40">
                    <Sidebar />
                </div>
                
                <div className="flex-1 ml-[48px] md:ml-[220px] min-w-0 flex flex-col">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default ProtectedRoutes
