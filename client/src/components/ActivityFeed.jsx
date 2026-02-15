import { useState, useEffect } from 'react';
import api from '../api/axios';
import { timeAgo } from '../pages/Dashboard';
import {
    GoCheck, GoX, GoPlusCircle, GoPencil, GoComment, GoTrash, GoRepoPush
} from 'react-icons/go';
import { useNavigate } from 'react-router-dom';

const ActivityFeed = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const res = await api.get('/api/audit/feed?limit=10');
                setActivities(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, []);

    const getIcon = (action) => {
        switch (action) {
            case 'lead_created': return <GoPlusCircle className="text-green-500" />;
            case 'lead_updated': return <GoPencil className="text-blue-500" />;
            case 'lead_submitted': return <GoRepoPush className="text-yellow-500" />;
            case 'lead_approved': return <GoCheck className="text-green-500" />;
            case 'lead_denied': return <GoX className="text-red-500" />;
            case 'comment_added': return <GoComment className="text-gray-500" />;
            case 'lead_deleted': return <GoTrash className="text-red-500" />;
            default: return <GoPencil />;
        }
    };

    const getMessage = (log) => {
        const title = log.details?.title || 'a lead';
        const user = log.userId?.name || 'Unknown User';

        switch (log.action) {
            case 'lead_created': return <span><b>{user}</b> created new lead <b>{title}</b></span>;
            case 'lead_updated': return <span><b>{user}</b> updated <b>{title}</b></span>;
            case 'lead_submitted': return <span><b>{user}</b> submitted <b>{title}</b> for review</span>;
            case 'lead_approved': return <span><b>{user}</b> approved <b>{title}</b></span>;
            case 'lead_denied': return <span><b>{user}</b> denied <b>{title}</b></span>;
            case 'comment_added': return <span><b>{user}</b> commented on <b>{title}</b></span>;
            case 'lead_deleted': return <span><b>{user}</b> deleted <b>{title}</b></span>;
            default: return <span><b>{user}</b> performed {log.action}</span>;
        }
    };

    if (loading) return <div className="p-4 text-center text-gray-500">Loading activity...</div>;

    if (activities.length === 0) {
        return (
            <div className="card">
                <div className="card-header">
                    <h3>Activity Feed</h3>
                </div>
                <div className="card-body empty-state" style={{ padding: 'var(--space-6) var(--space-5)' }}>
                    <span className="empty-icon" style={{ fontSize: 32, marginBottom: 'var(--space-2)' }}>⚡</span>
                    <h4 style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-secondary)', fontWeight: 500, marginBottom: 0 }}>No recent activity</h4>
                    <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 4, color: 'var(--color-text-muted)' }}>
                        Actions taken by your team will appear here.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3>Activity Feed</h3>
            </div>
            <div className="activity-list">
                {activities.map((log) => (
                    <div key={log._id} className="activity-item">
                        <div className="activity-icon">
                            {getIcon(log.action)}
                        </div>
                        <div className="activity-content">
                            <div className="activity-message">
                                {getMessage(log)}
                            </div>
                            <div className="activity-time">
                                {timeAgo(log.createdAt)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityFeed;
