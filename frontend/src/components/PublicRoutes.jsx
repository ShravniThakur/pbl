import { Navigate, Outlet } from 'react-router-dom'
import { useContext } from 'react'
import { AppContext } from '../context/AppContext'

const PublicRoutes = () => {
    const {token} = useContext(AppContext)
    if(token) return <Navigate to='/dashboard' replace></Navigate>

    return(
        <Outlet></Outlet>
    )
}
export default PublicRoutes
