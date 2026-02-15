import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCountryFlag } from '../components/Sidebar';
import api from '../api/axios';
import { GoPeople, GoIssueOpened } from 'react-icons/go';

const Team = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchUsers();
    }, []);

    if (loading) {
        return (
            <>
                <div className="page-header"><h2>Team</h2></div>
                <div className="loading"><div className="spinner"></div></div>
            </>
        );
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <GoPeople />
                        Team
                    </h2>
                    <span className="page-header-sub">
                        {users.length} members {user.role === 'manager' ? `in ${user.countryCode}` : 'across all regions'}
                    </span>
                </div>
            </div>

            <div className="page-body fade-in">
                <div className="card">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Role</th>
                                <th>Region</th>
                                <th>Email</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="avatar">
                                                <img src={u.avatar} alt={u.name} />
                                            </div>
                                            <span style={{ fontWeight: 500 }}>{u.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge-role badge-${u.role}`}>{u.role}</span>
                                    </td>
                                    <td>{getCountryFlag(u.countryCode)} {u.countryCode}</td>
                                    <td style={{ color: 'var(--color-text-secondary)' }}>{u.email}</td>
                                    <td style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                                        {new Date(u.createdAt).toLocaleDateString()}
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

export default Team;
