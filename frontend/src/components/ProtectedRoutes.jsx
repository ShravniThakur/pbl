import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";

const ProtectedRoutes = () => {
    const { token } = useContext(AppContext)

    if (!token) return <Navigate to='/login' replace></Navigate>
    return (
        <>
            <div className='fixed z-50 h-18 w-full bg-black'>
                <Navbar></Navbar>
            </div>
            <div className='flex'>
                <div className='bg-black h-full fixed z-50 left-0 top-18 w-13 sm:w-43'>
                    <Sidebar></Sidebar>
                </div>
                <div className='flex-1 min-w-0 mt-18 ml-13 sm:ml-43'>
                    <Outlet></Outlet>
                </div>
            </div>
        </>
    )
}
export default ProtectedRoutes
