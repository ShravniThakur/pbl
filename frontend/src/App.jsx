import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import FinancialProfile from './pages/FinancialProfile'
import LoanCheck from './pages/LoanCheck'
import LoanProducts from './pages/LoanProducts'
import LoanHistory from './pages/LoanHistory'
import LoanDetail from './pages/LoanDetail'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoutes from './components/ProtectedRoutes'
import PublicRoutes from './components/PublicRoutes'
import { ToastContainer } from 'react-toastify'
import { Navigate, Route, Routes } from 'react-router-dom'

// ─── Admin Route Guard ────────────────────────────────────────────────────────
// Reads the JWT set by AdminLogin. No dependency on AppContext so admin
// sessions are fully isolated from user sessions.
const AdminRoute = ({ children }) => {
    const token = localStorage.getItem('adminToken')
    return token ? children : <Navigate to="/admin/login" replace />
}

function App() {
    return (
        <>
            <ScrollToTop />
            <Routes>
                {/* Protected User Routes */}
                <Route element={<ProtectedRoutes />}>
                    <Route path='/dashboard'          element={<Dashboard />} />
                    <Route path='/financial-profile'  element={<FinancialProfile />} />
                    <Route path='/loan-check'         element={<LoanCheck />} />
                    <Route path='/loan-products'      element={<LoanProducts />} />
                    <Route path='/loan-history'       element={<LoanHistory />} />
                    <Route path='/loan-history/:id'   element={<LoanDetail />} />
                    <Route path='/settings'           element={<Settings />} />
                </Route>

                {/* Public User Routes */}
                <Route element={<PublicRoutes />}>
                    <Route path='/'        element={<Landing />} />
                    <Route path='/login'   element={<Login />} />
                    <Route path='/signup'  element={<Signup />} />
                </Route>

                {/* Admin Routes (isolated from user auth) */}
                <Route path='/admin/login'     element={<AdminLogin />} />
                <Route path='/admin/dashboard' element={
                    <AdminRoute>
                        <AdminDashboard />
                    </AdminRoute>
                } />
            </Routes>
            <ToastContainer
                position="top-right"
                autoClose={4000}
                hideProgressBar
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                toastClassName={(context) =>
                    "relative flex p-3 min-h-14 rounded-md justify-between overflow-hidden cursor-pointer bg-white text-gray-800 text-sm font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)] ring-1 ring-[#0000000a] mb-3 " +
                    (context?.type === "error" ? "border-l-4 border-[#E11D48]" :
                     context?.type === "success" ? "border-l-4 border-[#059669]" :
                     context?.type === "warning" ? "border-l-4 border-[#D97706]" :
                     "border-l-4 border-[#4F46E5]")
                }
                bodyClassName={() => "flex items-center gap-3 font-inter"}
            />
        </>
    )
}

export default App
