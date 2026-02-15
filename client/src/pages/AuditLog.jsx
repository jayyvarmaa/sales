import { useState, useEffect } from 'react';
import api from '../api/axios';
import { timeAgo } from './Dashboard';
import {
    GoLog, GoIssueOpened, GoIssueClosed, GoGitPullRequest,
    GoPerson, GoShieldCheck, GoSignIn, GoComment
} from 'react-icons/go';

const ACTION_CONFIG = {
    lead_created: { icon: <GoIssueOpened />, color: 'var(--color-accent-green)', label: 'created a lead' },
    lead_submitted_for_review: { icon: <GoGitPullRequest />, color: 'var(--color-accent-yellow)', label: 'submitted a lead for review' },
    lead_approved: { icon: <GoIssueClosed />, color: 'var(--color-accent-green)', label: 'approved a lead' },
    lead_denied: { icon: <GoIssueClosed />, color: 'var(--color-accent-red)', label: 'denied a lead' },
    lead_updated: { icon: <GoIssueOpened />, color: 'var(--color-accent-blue)', label: 'updated a lead' },
    comment_added: { icon: <GoComment />, color: 'var(--color-accent-blue)', label: 'commented on a lead' },
    user_registered: { icon: <GoPerson />, color: 'var(--color-accent-green)', label: 'registered' },
    user_login: { icon: <GoSignIn />, color: 'var(--color-text-muted)', label: 'signed in' },
    role_changed: { icon: <GoShieldCheck />, color: 'var(--color-accent-purple)', label: 'changed a user role' }
};

const AuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/audit?page=${page}&limit=25`);
            setLogs(res.data.logs);
            setTotal(res.data.total);
            setPages(res.data.pages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <GoLog style={{ color: 'var(--color-text-muted)' }} />
                        Audit Log
                    </h2>
                    <span className="page-header-sub">{total} recorded actions</span>
                </div>
            </div>

            <div className="page-body fade-in">
                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : logs.length > 0 ? (
                    <>
                        <div className="timeline">
                            {logs.map((log, i) => {
                                const config = ACTION_CONFIG[log.action] || {
                                    icon: <GoLog />,
                                    color: 'var(--color-text-muted)',
                                    label: log.action
                                };

                                return (
                                    <div key={log._id || i} className="timeline-item">
                                        <div className="timeline-dot" style={{ borderColor: config.color, color: config.color }}>
                                            {config.icon}
                                        </div>
                                        <div className="timeline-content">
                                            <div className="timeline-action">
                                                <strong>{log.userId?.name || 'Unknown'}</strong>{' '}
                                                {config.label}
                                                {log.details?.title && (
                                                    <span style={{ color: 'var(--color-text-link)' }}>
                                                        {' '}{log.details.title}
                                                    </span>
                                                )}
                                                {log.details?.from && log.details?.to && (
                                                    <span style={{ color: 'var(--color-text-secondary)' }}>
                                                        {' '}({log.details.from} → {log.details.to})
                                                    </span>
                                                )}
                                            </div>
                                            <div className="timeline-time">
                                                {timeAgo(log.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {pages > 1 && (
                            <div className="pagination">
                                <button
                                    className="btn btn-sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    Previous
                                </button>
                                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                    Page {page} of {pages}
                                </span>
                                <button
                                    className="btn btn-sm"
                                    disabled={page >= pages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="empty-state">
                        <span className="empty-icon">📋</span>
                        <h3>No audit logs yet</h3>
                        <p>Actions will appear here as users interact with the system.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default AuditLog;
