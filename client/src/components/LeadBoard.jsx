import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { timeAgo } from '../pages/Dashboard';
import { getCountryFlag } from '../components/Sidebar';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { GoGitPullRequest, GoCheck, GoX, GoIssueClosed } from 'react-icons/go';

const LeadBoard = ({ leads, onUpdate }) => {
    const { user } = useAuth();
    const [draggingId, setDraggingId] = useState(null);

    const COLUMNS = [
        { id: 'open', label: 'Open', color: 'var(--color-text-mutest)' },
        { id: 'pending_review', label: 'Pending Review', color: 'var(--color-accent-yellow)' },
        { id: 'approved', label: 'Approved', color: 'var(--color-accent-green)' },
        { id: 'denied', label: 'Denied', color: 'var(--color-accent-red)' }
    ];

    const getColumnLeads = (status) => leads.filter(l => {
        if (status === 'denied') return l.status === 'denied';
        if (status === 'approved') return l.status === 'approved' || l.status === 'closed';
        return l.status === status;
    });

    const handleDragStart = (e, leadId) => {
        setDraggingId(leadId);
        e.dataTransfer.setData('leadId', leadId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, targetStatus) => {
        e.preventDefault();
        const leadId = e.dataTransfer.getData('leadId');
        if (!leadId) return;

        const lead = leads.find(l => l._id === leadId);
        if (!lead || lead.status === targetStatus) return;

        // Determine action based on transition
        try {
            if (targetStatus === 'pending_review' && lead.status === 'open') {
                // Submit
                if (user.role === 'rep' && lead.createdBy._id !== user._id) {
                    throw new Error('You can only submit your own leads');
                }
                await api.put(`/leads/${leadId}/submit`);
                toast.success('Lead submitted for review');
            } else if ((targetStatus === 'approved' || targetStatus === 'denied') && lead.status === 'pending_review') {
                // Review
                if (user.role === 'rep') throw new Error('Reps cannot review leads');
                await api.put(`/leads/${leadId}/review`, { action: targetStatus });
                toast.success(`Lead ${targetStatus}`);
            } else {
                throw new Error('Invalid status transition');
            }
            if (onUpdate) onUpdate();
        } catch (err) {
            toast.error(err.message || err.response?.data?.message || 'Action failed');
        } finally {
            setDraggingId(null);
        }
    };

    return (
        <div className="kanban-board">
            {COLUMNS.map(col => (
                <div
                    key={col.id}
                    className="kanban-column"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                >
                    <div className="kanban-header">
                        <span className="kanban-title">
                            <span style={{
                                display: 'inline-block',
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: col.color,
                                marginRight: 6
                            }} />
                            {col.label}
                        </span>
                        <span className="kanban-count">
                            {getColumnLeads(col.id).length}
                        </span>
                    </div>
                    <div className="kanban-cards">
                        {getColumnLeads(col.id).map(lead => (
                            <div
                                key={lead._id}
                                className="kanban-card"
                                draggable
                                onDragStart={(e) => handleDragStart(e, lead._id)}
                            >
                                <div className="kanban-card-title">{lead.title}</div>
                                <div className="kanban-card-meta">
                                    <span>{getCountryFlag(lead.countryCode)} {lead.countryCode}</span>
                                    {lead.estimatedValue > 0 && <span>${(lead.estimatedValue / 1000).toFixed(0)}k</span>}
                                </div>
                                <div className="kanban-card-footer">
                                    <div className="avatar avatar-xs" title={lead.createdBy?.name}>
                                        {lead.createdBy?.avatar || '?'}
                                    </div>
                                    <span style={{ fontSize: '10px' }}>{timeAgo(lead.createdAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LeadBoard;
