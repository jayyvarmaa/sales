import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCountryFlag } from '../components/Sidebar';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { GoPerson, GoMail, GoLock, GoGlobe, GoShield } from 'react-icons/go';

const Profile = () => {
    const { user, login } = useAuth(); // We might need to update the user in context after save
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password && formData.password !== formData.confirmPassword) {
            return toast.error('Passwords do not match');
        }

        setLoading(true);
        try {
            const updateData = {
                name: formData.name,
                email: formData.email
            };
            if (formData.password) updateData.password = formData.password;

            const res = await api.put(`/users/${user._id}`, updateData);

            // If password changed, re-login might be safer or just update context. 
            // For MVP, let's just update local user data if possible, but AuthContext mainly reads from token/API.
            // We should probably reload the page or re-fetch "me" to update context, but a full reload is simplest to ensure consistency.
            toast.success('Profile updated successfully! Please log in again if you changed your password.');

            if (formData.password) {
                // Logout or redirect? Let's just clear password fields
                setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            }

            // To update the UI name immediately without reload (hacky but works for MVP):
            // In a real app we'd have a setUser method exposed from context
            window.location.reload();

        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="page-header">
                <h2>Profile Settings</h2>
            </div>

            <div className="page-body fade-in" style={{ maxWidth: '800px' }}>
                <div className="card">
                    <div className="card-header">
                        <h3>Public Profile</h3>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
                            <div className="avatar avatar-xl">
                                <img src={user.avatar} alt={user.name} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600 }}>{user.name}</h2>
                                <div style={{ display: 'flex', gap: 'var(--space-3)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                        <GoShield /> {user.role}
                                    </span>
                                    <span>•</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                        <GoGlobe /> {getCountryFlag(user.countryCode)} {user.countryCode}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <div className="input-group">
                                    <span className="input-icon"><GoPerson /></span>
                                    <input
                                        type="text"
                                        name="name"
                                        className="input"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <div className="input-group">
                                    <span className="input-icon"><GoMail /></span>
                                    <input
                                        type="email"
                                        name="email"
                                        className="input"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--color-border-subtle)', margin: 'var(--space-2) 0' }} />

                            <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-text-primary)' }}>Change Password</h4>

                            <div className="form-group">
                                <label className="form-label">New Password (leave blank to keep current)</label>
                                <div className="input-group">
                                    <span className="input-icon"><GoLock /></span>
                                    <input
                                        type="password"
                                        name="password"
                                        className="input"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="New password"
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Confirm New Password</label>
                                <div className="input-group">
                                    <span className="input-icon"><GoLock /></span>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        className="input"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Saving...' : 'Update Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Profile;
