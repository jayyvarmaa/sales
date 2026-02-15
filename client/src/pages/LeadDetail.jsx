import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCountryFlag } from '../components/Sidebar';
import { timeAgo, formatStatus } from './Dashboard';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
    GoIssueOpened, GoIssueClosed, GoGitPullRequest,
    GoArrowLeft, GoComment, GoCheck, GoX, GoTag, GoPeople,
    GoMail, GoGraph, GoGlobe, GoPerson, GoCalendar, GoPencil, GoTrash
} from 'react-icons/go';

const LeadDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [reviewComment, setReviewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchLead();
    }, [id]);

    const fetchLead = async () => {
        try {
            const res = await api.get(`/leads/${id}`);
            setLead(res.data);
        } catch (err) {
            toast.error('Lead not found');
            navigate('/leads');
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        setSubmitting(true);
        try {
            const res = await api.post(`/leads/${id}/comments`, { body: comment });
            setLead(res.data);
            setComment('');
            toast.success('Comment added');
        } catch (err) {
            toast.error('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitForReview = async () => {
        try {
            await api.put(`/leads/${id}/submit`);
            await fetchLead();
            toast.success('Lead submitted for review');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this lead?')) return;
        try {
            await api.delete(`/leads/${id}`);
            toast.success('Lead deleted');
            navigate('/leads');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed');
        }
    };

    const handleReview = async (action) => {
        setSubmitting(true);
        try {
            const res = await api.put(`/leads/${id}/review`, {
                action,
                comment: reviewComment
            });
            setLead(res.data);
            setReviewComment('');
            toast.success(`Lead ${action}!`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Review failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    if (!lead) return null;

    const isOwner = lead.createdBy?._id === user._id;
    const canReview = (user.role === 'manager' || user.role === 'master') &&
        (lead.status === 'pending_review' || lead.status === 'open');
    const canSubmit = isOwner && lead.status === 'open';

    const statusIcon = lead.status === 'approved' || lead.status === 'closed'
        ? <GoIssueClosed />
        : lead.status === 'pending_review'
            ? <GoGitPullRequest />
            : <GoIssueOpened />;

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="lead-detail-header">
                <div style={{ marginBottom: 'var(--space-4)' }}>
                    <Link to="/leads" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-3)' }}>
                        <GoArrowLeft /> Back to leads
                    </Link>
                </div>
                <h1>
                    {lead.title}
                    <span className="lead-number">#{lead._id.slice(-6)}</span>
                </h1>
                <div className="lead-detail-meta">
                    <span className={`badge badge-${lead.status}`} style={{ fontSize: 'var(--font-size-sm)' }}>
                        {statusIcon} {formatStatus(lead.status)}
                    </span>
                    <span>
                        <strong>{lead.createdBy?.name}</strong> opened this {timeAgo(lead.createdAt)}
                    </span>
                    <span>
                        {getCountryFlag(lead.countryCode)} {lead.countryCode}
                    </span>
                    <span>
                        {lead.comments?.length || 0} comments
                    </span>
                </div>
            </div>

            {/* Body: Main + Sidebar */}
            <div className="lead-detail-body">
                {/* Main Content */}
                <div className="lead-detail-main">
                    {/* Description */}
                    <div className="lead-description">
                        {lead.description}
                    </div>

                    {/* Actions for Owner (Open/Pending) */}
                    {isOwner && (lead.status === 'open' || lead.status === 'pending_review') && (
                        <div style={{ marginBottom: 'var(--space-5)', display: 'flex', gap: 'var(--space-3)' }}>
                            {lead.status === 'open' && (
                                <button className="btn btn-blue" onClick={handleSubmitForReview}>
                                    <GoGitPullRequest /> Submit for Review
                                </button>
                            )}
                            <Link to={`/leads/${lead._id}/edit`} className="btn">
                                <GoPencil /> Edit
                            </Link>
                            <button className="btn btn-danger" onClick={handleDelete}>
                                <GoTrash /> Delete
                            </button>
                        </div>
                    )}

                    {/* Comment Thread */}
                    {lead.comments?.length > 0 && (
                        <div className="comment-thread">
                            {lead.comments.map((c, i) => (
                                <div key={i} className="comment-item">
                                    <div className="avatar avatar-sm">{c.user?.avatar || '?'}</div>
                                    <div className="comment-body">
                                        <div className="comment-header">
                                            <span className="comment-author">{c.user?.name || 'Unknown'}</span>
                                            <span className={`badge-role badge-${c.user?.role}`}>
                                                {c.user?.role}
                                            </span>
                                            <span className="comment-date">
                                                commented {timeAgo(c.createdAt)}
                                            </span>
                                        </div>
                                        <div className="comment-content">{c.body}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Review Actions (Manager/Master) */}
                    {canReview && (
                        <div className="review-actions" style={{ flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <h4 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <GoGitPullRequest /> Review this lead
                            </h4>
                            <textarea
                                className="textarea"
                                placeholder="Leave a review comment (optional)..."
                                value={reviewComment}
                                onChange={e => setReviewComment(e.target.value)}
                                rows={3}
                            />
                            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleReview('approved')}
                                    disabled={submitting}
                                >
                                    <GoCheck /> Approve
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => handleReview('denied')}
                                    disabled={submitting}
                                >
                                    <GoX /> Deny
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Add Comment Form */}
                    <form className="comment-form" onSubmit={handleAddComment}>
                        <div className="avatar avatar-sm">{user.avatar}</div>
                        <div className="comment-form-body">
                            <textarea
                                className="textarea"
                                placeholder="Leave a comment..."
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                rows={3}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-sm"
                                    disabled={!comment.trim() || submitting}
                                >
                                    <GoComment /> Comment
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Sidebar */}
                <div className="lead-detail-sidebar">
                    <div>
                        <div className="sidebar-section-title">Status</div>
                        <span className={`badge badge-${lead.status}`}>
                            {statusIcon} {formatStatus(lead.status)}
                        </span>
                    </div>

                    {lead.reviewedBy && (
                        <div>
                            <div className="sidebar-section-title">Reviewer</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--font-size-md)' }}>
                                <div className="avatar avatar-sm">{lead.reviewedBy.avatar}</div>
                                {lead.reviewedBy.name}
                            </div>
                            {lead.reviewedAt && (
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 4 }}>
                                    Reviewed {timeAgo(lead.reviewedAt)}
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <div className="sidebar-section-title">Assignee</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--font-size-md)' }}>
                            <div className="avatar avatar-sm">{lead.createdBy?.avatar}</div>
                            {lead.createdBy?.name}
                        </div>
                    </div>

                    <div>
                        <div className="sidebar-section-title">Details</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--font-size-md)' }}>
                            {lead.companyName && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-secondary)' }}>
                                    <GoPeople /> {lead.companyName}
                                </div>
                            )}
                            {lead.contactEmail && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-secondary)' }}>
                                    <GoMail /> {lead.contactEmail}
                                </div>
                            )}
                            {lead.estimatedValue > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-secondary)' }}>
                                    <GoGraph /> ${lead.estimatedValue.toLocaleString()}
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-secondary)' }}>
                                <GoGlobe /> {getCountryFlag(lead.countryCode)} {lead.countryCode}
                            </div>
                        </div>
                    </div>

                    {lead.tags?.length > 0 && (
                        <div>
                            <div className="sidebar-section-title">Labels</div>
                            <div className="lead-tags" style={{ gap: 'var(--space-2)' }}>
                                {lead.tags.map(t => (
                                    <span key={t} className="lead-tag">{t}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeadDetail;
