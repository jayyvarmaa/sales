import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCountryFlag } from '../components/Sidebar';
import { timeAgo, formatStatus } from './Dashboard';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
    GoGitPullRequest, GoCheck, GoX, GoIssueOpened
} from 'react-icons/go';

const Approvals = () => {
    const { user } = useAuth();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        try {
            const res = await api.get('/leads?status=pending_review&limit=50');
            setLeads(res.data.leads);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickReview = async (leadId, action) => {
        try {
            await api.put(`/leads/${leadId}/review`, { action, comment: '' });
            toast.success(`Lead ${action}!`);
            setLeads(prev => prev.filter(l => l._id !== leadId));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Review failed');
        }
    };

    if (loading) {
        return (
            <>
                <div className="page-header"><h2>Pending Reviews</h2></div>
                <div className="loading"><div className="spinner"></div></div>
            </>
        );
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <GoGitPullRequest style={{ color: 'var(--color-accent-yellow)' }} />
                        Pending Reviews
                    </h2>
                    <span className="page-header-sub">{leads.length} leads awaiting your review</span>
                </div>
            </div>

            <div className="page-body fade-in">
                {leads.length > 0 ? (
                    <div className="lead-list">
                        <div className="lead-list-header">
                            <span>
                                <GoGitPullRequest style={{ marginRight: 6 }} />
                                {leads.length} pending
                            </span>
                        </div>
                        {leads.map(lead => (
                            <div key={lead._id} className="lead-item" style={{ cursor: 'default' }}>
                                <span className="lead-icon pending_review">
                                    <GoGitPullRequest />
                                </span>
                                <div className="lead-info">
                                    <Link
                                        to={`/leads/${lead._id}`}
                                        className="lead-title"
                                        style={{ textDecoration: 'none' }}
                                    >
                                        {lead.title}
                                    </Link>
                                    <div className="lead-meta">
                                        <span>{getCountryFlag(lead.countryCode)} {lead.countryCode}</span>
                                        <span>•</span>
                                        <span>by {lead.createdBy?.name}</span>
                                        <span>•</span>
                                        <span>{timeAgo(lead.createdAt)}</span>
                                        {lead.estimatedValue > 0 && (
                                            <>
                                                <span>•</span>
                                                <span>💰 ${(lead.estimatedValue / 1000).toFixed(0)}K</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleQuickReview(lead._id, 'approved')}
                                        title="Approve"
                                    >
                                        <GoCheck /> Approve
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleQuickReview(lead._id, 'denied')}
                                        title="Deny"
                                    >
                                        <GoX /> Deny
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <span className="empty-icon">✅</span>
                        <h3>All caught up!</h3>
                        <p>No leads are waiting for your review.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default Approvals;
