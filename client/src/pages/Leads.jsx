import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCountryFlag } from '../components/Sidebar';
import { timeAgo, formatStatus } from './Dashboard';
import api from '../api/axios';
import {
    GoIssueOpened, GoIssueClosed, GoGitPullRequest,
    GoPlus, GoFilter, GoSearch, GoColumns, GoListUnordered, GoDownload,
    GoCheck, GoX, GoTrash
} from 'react-icons/go';
import LeadBoard from '../components/LeadBoard';

const Leads = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [filter, setFilter] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // 'list' | 'board'

    // Bulk Actions State
    const [selectedLeads, setSelectedLeads] = useState(new Set());
    const [bulkActionLoading, setBulkActionLoading] = useState(false);

    useEffect(() => {
        fetchLeads();
    }, [page, filter]);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 15 });
            if (filter) params.set('status', filter);
            const res = await api.get(`/leads?${params}`);
            setLeads(res.data.leads);
            setTotal(res.data.total);
            setPages(res.data.pages);
            setSelectedLeads(new Set()); // Reset selection on fetch
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleLead = (id) => {
        const newSelected = new Set(selectedLeads);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedLeads(newSelected);
    };

    const toggleAll = () => {
        if (selectedLeads.size === leads.length) {
            setSelectedLeads(new Set());
        } else {
            setSelectedLeads(new Set(leads.map(l => l._id)));
        }
    };

    const handleBulkAction = async (action) => {
        if (!window.confirm(`Are you sure you want to ${action} ${selectedLeads.size} leads?`)) return;

        setBulkActionLoading(true);
        try {
            await api.put('/leads/bulk-update', {
                ids: Array.from(selectedLeads),
                action
            });
            // Refresh
            fetchLeads();
            setSelectedLeads(new Set());
        } catch (err) {
            console.error(err);
            alert('Bulk action failed');
        } finally {
            setBulkActionLoading(false);
        }
    };

    const filteredLeads = search
        ? leads.filter(l =>
            l.title.toLowerCase().includes(search.toLowerCase()) ||
            l.companyName?.toLowerCase().includes(search.toLowerCase())
        )
        : leads;

    const handleExport = () => {
        if (!leads.length) return;

        // Simple CSV generation
        const headers = ['ID', 'Title', 'Company', 'Status', 'Value', 'Country', 'Created By', 'Date'];
        const rows = filteredLeads.map(l => [
            l._id,
            `"${l.title.replace(/"/g, '""')}"`,
            `"${(l.companyName || '').replace(/"/g, '""')}"`,
            l.status,
            l.estimatedValue,
            l.countryCode,
            l.createdBy?.name || '',
            new Date(l.createdAt).toLocaleDateString()
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(',') + "\n"
            + rows.map(r => r.join(',')).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "leads_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const statusFilters = [
        { key: '', label: 'All' },
        { key: 'open', label: 'Open' },
        { key: 'pending_review', label: 'Pending Review' },
        { key: 'approved', label: 'Approved' },
        { key: 'denied', label: 'Denied' },
        { key: 'closed', label: 'Closed' }
    ];

    const canApprove = user.role === 'manager' || user.role === 'master';
    // Reps can't bulk approve, but maybe bulk delete drafts? sticking to manager features for now.

    return (
        <>
            <div className="page-header">
                <div>
                    <h2>Leads</h2>
                    <span className="page-header-sub">{total} total leads</span>
                </div>
                {user.role === 'rep' && (
                    <Link to="/leads/new" className="btn btn-primary">
                        <GoPlus /> New Lead
                    </Link>
                )}
            </div>

            <div className="page-body fade-in">
                {/* Filters */}
                <div className="filter-bar">
                    {statusFilters.map(f => (
                        <button
                            key={f.key}
                            className={`filter-btn ${filter === f.key ? 'active' : ''}`}
                            onClick={() => { setFilter(f.key); setPage(1); }}
                        >
                            {f.label}
                        </button>
                    ))}

                    <div className="view-toggle" style={{ marginLeft: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
                        <button
                            className={`btn btn-sm ${view === 'list' ? 'btn-primary' : ''}`}
                            onClick={() => setView('list')}
                            title="List View"
                        >
                            <GoListUnordered />
                        </button>
                        <button
                            className={`btn btn-sm ${view === 'board' ? 'btn-primary' : ''}`}
                            onClick={() => setView('board')}
                            title="Kanban Board"
                        >
                            <GoColumns />
                        </button>
                        <button className="btn btn-sm" onClick={handleExport} title="Export to CSV">
                            <GoDownload />
                        </button>
                    </div>

                    <div style={{ marginLeft: 'auto', position: 'relative' }}>
                        <GoSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            className="input"
                            placeholder="Filter leads..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ paddingLeft: 32, width: 220 }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : view === 'board' ? (
                    <LeadBoard leads={filteredLeads} onUpdate={fetchLeads} />
                ) : (
                    <>
                        <div className="lead-list">
                            <div className="lead-list-header">
                                {canApprove && (
                                    <input
                                        type="checkbox"
                                        className="lead-checkbox"
                                        checked={leads.length > 0 && selectedLeads.size === leads.length}
                                        onChange={toggleAll}
                                        style={{ marginRight: 12 }}
                                    />
                                )}
                                <span>
                                    <GoIssueOpened style={{ marginRight: 6 }} />
                                    {total} leads
                                </span>
                            </div>
                            {filteredLeads.length > 0 ? filteredLeads.map(lead => (
                                <div
                                    key={lead._id}
                                    className={`lead-item ${selectedLeads.has(lead._id) ? 'selected' : ''}`}
                                    onClick={() => navigate(`/leads/${lead._id}`)}
                                >
                                    {canApprove && (
                                        <input
                                            type="checkbox"
                                            className="lead-checkbox"
                                            checked={selectedLeads.has(lead._id)}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={() => toggleLead(lead._id)}
                                        />
                                    )}
                                    <span className={`lead-icon ${lead.status}`}>
                                        {lead.status === 'approved' || lead.status === 'closed'
                                            ? <GoIssueClosed />
                                            : lead.status === 'pending_review'
                                                ? <GoGitPullRequest />
                                                : <GoIssueOpened />}
                                    </span>
                                    <div className="lead-info">
                                        <div className="lead-title">
                                            {lead.title}
                                            {lead.tags?.length > 0 && (
                                                <span className="lead-tags">
                                                    {lead.tags.map(t => (
                                                        <span key={t} className="lead-tag">{t}</span>
                                                    ))}
                                                </span>
                                            )}
                                        </div>
                                        <div className="lead-meta">
                                            <span>{getCountryFlag(lead.countryCode)} {lead.countryCode}</span>
                                            <span>•</span>
                                            <span>opened {timeAgo(lead.createdAt)} by {lead.createdBy?.name}</span>
                                            {lead.companyName && (
                                                <>
                                                    <span>•</span>
                                                    <span>🏢 {lead.companyName}</span>
                                                </>
                                            )}
                                            {lead.estimatedValue > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span>💰 ${(lead.estimatedValue / 1000).toFixed(0)}K</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`badge badge-${lead.status}`}>
                                        {formatStatus(lead.status)}
                                    </span>
                                </div>
                            )) : (
                                <div className="empty-state">
                                    <span className="empty-icon">🔍</span>
                                    <h3>No leads found</h3>
                                    <p>Try adjusting your filters.</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
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
                )}
            </div>

            {/* Bulk Action Floating Bar */}
            {selectedLeads.size > 0 && canApprove && (
                <div className="bulk-action-bar">
                    <span className="bulk-count">{selectedLeads.size} Selected</span>
                    <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleBulkAction('approved')}
                        disabled={bulkActionLoading}
                    >
                        <GoCheck /> Approve
                    </button>
                    <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleBulkAction('denied')}
                        disabled={bulkActionLoading}
                    >
                        <GoX /> Deny
                    </button>
                    {/* Add Archive if needed */}
                </div>
            )}
        </>
    );
};

export default Leads;
