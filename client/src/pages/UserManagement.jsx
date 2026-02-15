import { useState, useEffect } from 'react';
import { getCountryFlag } from '../components/Sidebar';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { GoShieldCheck, GoArrowSwitch } from 'react-icons/go';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.put(`/users/${userId}/role`, { role: newRole });
            toast.success('Role updated');
            setUsers(prev =>
                prev.map(u => u._id === userId ? { ...u, role: newRole } : u)
            );
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update role');
        }
    };

    const filteredUsers = filter
        ? users.filter(u => u.role === filter)
        : users;

    if (loading) {
        return (
            <>
                <div className="page-header"><h2>User Management</h2></div>
                <div className="loading"><div className="spinner"></div></div>
            </>
        );
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <GoShieldCheck style={{ color: 'var(--color-accent-purple)' }} />
                        User Management
                    </h2>
                    <span className="page-header-sub">{users.length} registered users</span>
                </div>
            </div>

            <div className="page-body fade-in">
                {/* Role Filter */}
                <div className="filter-bar">
                    {['', 'rep', 'manager', 'master'].map(r => (
                        <button
                            key={r}
                            className={`filter-btn ${filter === r ? 'active' : ''}`}
                            onClick={() => setFilter(r)}
                        >
                            {r || 'All'} {r && `(${users.filter(u => u.role === r).length})`}
                        </button>
                    ))}
                </div>

                <div className="card">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Current Role</th>
                                <th>Region</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(u => (
                                <tr key={u._id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="avatar">
                                                <img src={u.avatar} alt={u.name} />
                                            </div>
                                            <span style={{ fontWeight: 500 }}>{u.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--color-text-secondary)' }}>{u.email}</td>
                                    <td>
                                        <span className={`badge-role badge-${u.role}`}>{u.role}</span>
                                    </td>
                                    <td>{getCountryFlag(u.countryCode)} {u.countryCode}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                            {u.role !== 'rep' && (
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={() => handleRoleChange(u._id, 'rep')}
                                                    title="Demote to Rep"
                                                >
                                                    → Rep
                                                </button>
                                            )}
                                            {u.role !== 'manager' && (
                                                <button
                                                    className="btn btn-sm btn-blue"
                                                    onClick={() => handleRoleChange(u._id, 'manager')}
                                                    title="Set as Manager"
                                                    style={{ fontSize: 'var(--font-size-xs)' }}
                                                >
                                                    → Manager
                                                </button>
                                            )}
                                            {u.role !== 'master' && (
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={() => handleRoleChange(u._id, 'master')}
                                                    title="Promote to Master"
                                                    style={{
                                                        fontSize: 'var(--font-size-xs)',
                                                        borderColor: 'var(--color-accent-purple)',
                                                        color: 'var(--color-accent-purple)'
                                                    }}
                                                >
                                                    → Master
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default UserManagement;
