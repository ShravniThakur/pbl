import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import FinancialProfile from './pages/FinancialProfile'
import LoanCheck from './pages/LoanCheck'
import LoanHistory from './pages/LoanHistory'
import LoanDetail from './pages/LoanDetail'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoutes from './components/ProtectedRoutes'
import PublicRoutes from './components/PublicRoutes'
import { ToastContainer } from 'react-toastify'
import { Route, Routes } from 'react-router-dom'

function App() {
    return (
        <>
            <ScrollToTop />
            <Routes>
                {/* Protected Routes */}
                <Route element={<ProtectedRoutes />}>
                    <Route path='/dashboard' element={<Dashboard />} />
                    <Route path='/financial-profile' element={<FinancialProfile />} />
                    <Route path='/loan-check' element={<LoanCheck />} />
                    <Route path='/loan-history' element={<LoanHistory />} />
                    <Route path='/loan-history/:id' element={<LoanDetail />} />
                    <Route path='/settings' element={<Settings />} />
                </Route>
                {/* Public Routes */}
                <Route element={<PublicRoutes />}>
                    <Route path='/' element={<Landing />} />
                    <Route path='/login' element={<Login />} />
                    <Route path='/signup' element={<Signup />} />
                </Route>
            </Routes>
            <ToastContainer />
        </>
    )
}

export default App
