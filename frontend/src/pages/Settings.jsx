import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { AppContext } from "../context/AppContext"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"

const AVATAR_PLACEHOLDER = "https://ui-avatars.com/api/?background=random&name=User"
const PW_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/

const Settings = () => {
    const { token, backend_url, setToken } = useContext(AppContext)
    const navigate = useNavigate()
    const fileRef = useRef()

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // profile form
    const [profileForm, setProfileForm] = useState({ name: '', email: '' })
    const [profilePic, setProfilePic] = useState(null)
    const [profilePreview, setProfilePreview] = useState(null)
    const [profileLoading, setProfileLoading] = useState(false)

    // password form
    const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '' })
    const [pwError, setPwError] = useState('')
    const [pwLoading, setPwLoading] = useState(false)

    // delete form
    const [deletePassword, setDeletePassword] = useState('')
    const [deleteLoading, setDeleteLoading] = useState(false)
    // FIX 8: replace window.confirm with inline confirmation state
    const [deleteConfirm, setDeleteConfirm] = useState(false)

    // FIX 4: revoke blob URL when preview changes or component unmounts
    useEffect(() => {
        return () => {
            if (profilePreview) URL.revokeObjectURL(profilePreview)
        }
    }, [profilePreview])

    // FIX 9: wrap in useCallback so useEffect dependency is stable
    const fetchUser = useCallback(async () => {
        // FIX 1 & 2: guard against missing token
        if (!token) {
            navigate('/login')
            return
        }
        try {
            const res = await axios.get(backend_url + '/user/profile', {
                headers: { Authorization: token }
            })
            if (res.data.success) {
                setUser(res.data.user)
                setProfileForm({ name: res.data.user.name, email: res.data.user.email })
            } else {
                toast.error(res.data.message)
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }, [token, backend_url, navigate])

    useEffect(() => { fetchUser() }, [fetchUser])

    const inputClass = `bg-white border border-borderColour rounded-lg px-4 py-2.5 text-bodyText text-sm focus:outline-none focus:border-button transition-colors duration-200 w-full`

    const Field = ({ label, children }) => (
        <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-accentSoft uppercase tracking-wide">{label}</p>
            {children}
        </div>
    )

    const SectionHeader = ({ title, sub }) => (
        <div className="border-b border-borderColour pb-3 mb-5">
            <p className="text-lg font-black text-heading">{title}</p>
            {sub && <p className="text-xs text-bodyText/50 mt-0.5">{sub}</p>}
        </div>
    )

    const handleFileChange = e => {
        const f = e.target.files[0]
        if (f) {
            // FIX 4: previous blob URL will be revoked by the useEffect cleanup
            setProfilePic(f)
            setProfilePreview(URL.createObjectURL(f))
        }
    }

    const handleProfileUpdate = async e => {
        e.preventDefault()
        const fd = new FormData()
        if (profileForm.name !== user?.name) fd.append('name', profileForm.name)
        if (profileForm.email !== user?.email) fd.append('email', profileForm.email)
        if (profilePic) fd.append('profilePic', profilePic)

        // FIX 3: skip request if nothing actually changed
        if ([...fd.entries()].length === 0) {
            toast.info('No changes to save.')
            return
        }

        setProfileLoading(true)
        try {
            const res = await axios.patch(backend_url + '/user/profile', fd, {
                headers: { Authorization: token, 'Content-Type': 'multipart/form-data' }
            })
            if (res.data.success) {
                toast.success('Profile updated successfully!')
                setUser(res.data.updatedUser)
                setProfilePic(null)
                setProfilePreview(null)
            } else {
                toast.error(res.data.message)
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong')
        } finally {
            setProfileLoading(false)
        }
    }

    const handlePasswordChange = async e => {
        e.preventDefault()

        // FIX 6: validate new password client-side before sending
        if (!PW_REGEX.test(pwForm.newPassword)) {
            setPwError('Password must be at least 8 chars and include an uppercase letter, a number, and a symbol.')
            return
        }
        setPwError('')
        setPwLoading(true)
        try {
            const res = await axios.patch(backend_url + '/user/change-password', pwForm, {
                headers: { Authorization: token }
            })
            if (res.data.success) {
                toast.success('Password changed successfully!')
                setPwForm({ oldPassword: '', newPassword: '' })
            } else {
                toast.error(res.data.message)
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong')
        } finally {
            setPwLoading(false)
        }
    }

    const handleDeleteAccount = async e => {
        e.preventDefault()
        // FIX 8: use inline confirmation state instead of window.confirm
        if (!deleteConfirm) {
            setDeleteConfirm(true)
            return
        }
        setDeleteLoading(true)
        try {
            const res = await axios.delete(backend_url + '/user/account', {
                headers: { Authorization: token },
                data: { password: deletePassword }
            })
            if (res.data.success) {
                toast.success('Account deleted.')
                localStorage.removeItem('token')
                setToken('')
                navigate('/login')
            } else {
                toast.error(res.data.message)
                // FIX 7: clear password on failure
                setDeletePassword('')
                setDeleteConfirm(false)
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong')
            // FIX 7: clear password on failure
            setDeletePassword('')
            setDeleteConfirm(false)
        } finally {
            setDeleteLoading(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen text-accentSoft text-xl font-bold">
            Loading...
        </div>
    )

    return (
        <div className="flex flex-col gap-8 text-bodyText font-sans m-5 max-w-2xl">

            {/* Header */}
            <div>
                <p className="text-3xl font-black text-heading">Settings ⚙</p>
                <p className="text-sm text-bodyText/60 mt-1">Manage your account details and preferences.</p>
            </div>

            {/* Update Profile */}
            <div className="bg-card border border-borderColour rounded-xl p-6">
                <SectionHeader title="Profile" sub="Update your name, email or profile picture" />
                <form onSubmit={handleProfileUpdate} className="flex flex-col gap-5">

                    {/* Avatar */}
                    <div className="flex items-center gap-5">
                        {/* FIX 5: fallback to placeholder if no profilePic */}
                        <img
                            src={profilePreview || user?.profilePic || AVATAR_PLACEHOLDER}
                            alt="Profile"
                            className="w-16 h-16 rounded-full object-cover border-2 border-borderColour"
                        />
                        <div>
                            <button
                                type="button"
                                onClick={() => fileRef.current.click()}
                                className="text-sm text-accentSoft hover:text-buttonHover font-semibold duration-200"
                            >
                                Change photo
                            </button>
                            <p className="text-xs text-bodyText/40 mt-0.5">JPG, PNG or WEBP</p>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    <Field label="Name">
                        <input
                            className={inputClass}
                            type="text"
                            value={profileForm.name}
                            onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                        />
                    </Field>

                    <Field label="Email">
                        <input
                            className={inputClass}
                            type="email"
                            value={profileForm.email}
                            onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                        />
                    </Field>

                    <button
                        type="submit"
                        disabled={profileLoading}
                        className="bg-button hover:bg-buttonHover duration-300 text-white font-black px-6 py-2.5 rounded-full text-sm disabled:opacity-50 disabled:cursor-not-allowed self-start"
                    >
                        {profileLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>

            {/* Change Password */}
            <div className="bg-card border border-borderColour rounded-xl p-6">
                <SectionHeader title="Change Password" sub="Choose a strong password to keep your account secure" />
                <form onSubmit={handlePasswordChange} className="flex flex-col gap-5">

                    <Field label="Current Password">
                        <input
                            className={inputClass}
                            type="password"
                            placeholder="••••••••"
                            value={pwForm.oldPassword}
                            onChange={e => { setPwError(''); setPwForm(f => ({ ...f, oldPassword: e.target.value })) }}
                            required
                        />
                    </Field>

                    <Field label="New Password">
                        <input
                            className={`${inputClass} ${pwError ? 'border-danger' : ''}`}
                            type="password"
                            placeholder="Min 8 chars, uppercase, number & symbol"
                            value={pwForm.newPassword}
                            onChange={e => { setPwError(''); setPwForm(f => ({ ...f, newPassword: e.target.value })) }}
                            required
                        />
                        {/* FIX 6: inline validation error */}
                        {pwError && <p className="text-xs text-danger mt-1">{pwError}</p>}
                    </Field>

                    <button
                        type="submit"
                        disabled={pwLoading}
                        className="bg-button hover:bg-buttonHover duration-300 text-white font-black px-6 py-2.5 rounded-full text-sm disabled:opacity-50 disabled:cursor-not-allowed self-start"
                    >
                        {pwLoading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>

            {/* Danger Zone */}
            <div className="bg-card border border-danger/20 rounded-xl p-6">
                <SectionHeader title="Danger Zone" sub="Permanently delete your account and all associated data" />
                <form onSubmit={handleDeleteAccount} className="flex flex-col gap-5">

                    <Field label="Enter password to confirm">
                        <input
                            className={`${inputClass} border-danger/30 focus:border-danger`}
                            type="password"
                            placeholder="••••••••"
                            value={deletePassword}
                            onChange={e => { setDeleteConfirm(false); setDeletePassword(e.target.value) }}
                            required
                        />
                    </Field>

                    {/* FIX 8: inline confirmation prompt instead of window.confirm */}
                    {deleteConfirm && (
                        <p className="text-xs text-danger font-semibold">
                            This will permanently delete your account and all data. Click the button again to confirm.
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={deleteLoading}
                        className="border border-danger/40 hover:bg-danger/10 duration-300 text-danger font-black px-6 py-2.5 rounded-full text-sm disabled:opacity-50 disabled:cursor-not-allowed self-start"
                    >
                        {deleteLoading ? 'Deleting...' : deleteConfirm ? 'Yes, delete my account' : 'Delete Account'}
                    </button>
                </form>
            </div>

        </div>
    )
}

export default Settings
