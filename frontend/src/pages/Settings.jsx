import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { AppContext } from "../context/AppContext"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"
import { Camera, Shield, Trash2, User } from "lucide-react"

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

    const inputClass = `bg-white border border-border-default rounded-[9px] px-4 py-2.5 text-text-primary text-[14px] font-medium focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)] transition-all duration-200 w-full placeholder:text-text-muted/60`

    const Field = ({ label, children }) => (
        <div className="flex flex-col gap-2">
            <p className="text-[12px] font-bold text-text-primary uppercase tracking-[0.05em]">{label}</p>
            {children}
        </div>
    )

    const SectionHeader = ({ title, sub, icon: Icon }) => (
        <div className="border-b border-border-default pb-5 mb-6 flex items-start gap-4">
            {Icon && (
                <div className="w-10 h-10 rounded-full bg-[#F5F5F4] border border-border-default flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={20} className="text-primary" />
                </div>
            )}
            <div className="flex flex-col gap-1">
                <p className="text-[18px] font-bold text-text-primary tracking-[-0.01em]">{title}</p>
                {sub && <p className="text-[13px] font-medium text-text-muted">{sub}</p>}
            </div>
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
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-border-default border-t-primary rounded-full animate-spin"></div>
        </div>
    )

    return (
        <div className="max-w-6xl w-full mx-auto px-6 py-8 flex flex-col gap-8 font-inter animate-fade-up">

            {/* Header */}
            <div>
                <h1 className="text-[40px] font-black text-sidebar-bg tracking-[-0.03em] leading-tight py-4">Settings</h1>
                <p className="text-[14px] font-medium text-text-muted mt-1">Manage your account details and preferences.</p>
            </div>

            {/* Update Profile */}
            <div className="bg-surface border border-border-default rounded-[14px] p-6 sm:p-8 shadow-sm">
                <SectionHeader title="Profile Details" sub="Update your personal information and public avatar" icon={User} />
                <form onSubmit={handleProfileUpdate} className="flex flex-col gap-6 max-w-xl">

                    {/* Avatar */}
                    <div className="flex items-center gap-6">
                        {/* FIX 5: fallback to placeholder if no profilePic */}
                        <div className="relative group cursor-pointer" onClick={() => fileRef.current.click()}>
                            <img
                                src={profilePreview || user?.profilePic || AVATAR_PLACEHOLDER}
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover border border-border-default group-hover:opacity-80 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={20} className="text-white" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <button
                                type="button"
                                onClick={() => fileRef.current.click()}
                                className="text-[13px] font-bold text-primary hover:text-primary-hover transition-colors self-start bg-primary/10 px-3 py-1.5 rounded-[6px]"
                            >
                                Change photo
                            </button>
                            <p className="text-[12px] font-medium text-text-muted">JPG, PNG or WEBP (Max 5MB)</p>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        <Field label="Full Name">
                            <input
                                className={inputClass}
                                type="text"
                                value={profileForm.name}
                                onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                            />
                        </Field>

                        <Field label="Email Address">
                            <input
                                className={inputClass}
                                type="email"
                                value={profileForm.email}
                                onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                            />
                        </Field>
                    </div>

                    <button
                        type="submit"
                        disabled={profileLoading}
                        className="bg-primary hover:bg-primary-hover duration-200 text-white font-bold px-6 py-2.5 rounded-[9px] text-[13px] shadow-button-primary disabled:opacity-50 disabled:cursor-not-allowed self-start mt-2"
                    >
                        {profileLoading ? 'Saving Changes...' : 'Save Profile Changes'}
                    </button>
                </form>
            </div>

            {/* Change Password */}
            <div className="bg-surface border border-border-default rounded-[14px] p-6 sm:p-8 shadow-sm">
                <SectionHeader title="Security" sub="Update your password to ensure your account stays secure" icon={Shield} />
                <form onSubmit={handlePasswordChange} className="flex flex-col gap-6 max-w-xl">

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
                            className={`${inputClass} ${pwError ? 'border-rose focus:border-rose focus:shadow-[0_0_0_3px_rgba(244,63,94,0.15)]' : ''}`}
                            type="password"
                            placeholder="Min 8 chars, uppercase, number & symbol"
                            value={pwForm.newPassword}
                            onChange={e => { setPwError(''); setPwForm(f => ({ ...f, newPassword: e.target.value })) }}
                            required
                        />
                        {/* FIX 6: inline validation error */}
                        {pwError && <p className="text-[12px] font-semibold text-rose mt-1 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose inline-block" /> {pwError}</p>}
                    </Field>

                    <button
                        type="submit"
                        disabled={pwLoading}
                        className="bg-primary hover:bg-primary-hover duration-200 text-white font-bold px-6 py-2.5 rounded-[9px] text-[13px] shadow-button-primary disabled:opacity-50 disabled:cursor-not-allowed self-start mt-2"
                    >
                        {pwLoading ? 'Updating Password...' : 'Update Password'}
                    </button>
                </form>
            </div>

            {/* Danger Zone */}
            <div className="bg-surface border border-rose/30 rounded-[14px] p-6 sm:p-8 shadow-sm bg-gradient-to-br from-white to-rose/5">
                <SectionHeader title="Danger Zone" sub="Permanently delete your account and all associated data" icon={Trash2} />
                <form onSubmit={handleDeleteAccount} className="flex flex-col gap-6 max-w-xl">

                    <Field label="Enter password to confirm deletion">
                        <input
                            className={`${inputClass} border-rose/40 focus:border-rose focus:shadow-[0_0_0_3px_rgba(244,63,94,0.15)] bg-white`}
                            type="password"
                            placeholder="••••••••"
                            value={deletePassword}
                            onChange={e => { setDeleteConfirm(false); setDeletePassword(e.target.value) }}
                            required
                        />
                    </Field>

                    {/* FIX 8: inline confirmation prompt instead of window.confirm */}
                    {deleteConfirm && (
                        <div className="bg-rose/10 border border-[#FECDD3] rounded-[9px] p-4 flex gap-3 items-start">
                            <div className="w-6 h-6 rounded-full bg-rose/20 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-rose font-black text-[12px]">!</span>
                            </div>
                            <p className="text-[13px] font-semibold text-rose leading-relaxed">
                                This action is irreversible. All your loan checks, personal data, and history will be permanently deleted. Click the button below to confirm.
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={deleteLoading}
                        className="bg-rose text-white hover:bg-rose/90 duration-200 font-bold px-6 py-2.5 rounded-[9px] text-[13px] shadow-sm shadow-rose/20 disabled:opacity-50 disabled:cursor-not-allowed self-start mt-2"
                    >
                        {deleteLoading ? 'Deleting Account...' : deleteConfirm ? 'Yes, Permanently Delete My Account' : 'Delete Account'}
                    </button>
                </form>
            </div>

        </div>
    )
}

export default Settings
