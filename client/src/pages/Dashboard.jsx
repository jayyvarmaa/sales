import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCountryFlag } from '../components/Sidebar';
import api from '../api/axios';
import {
    GoIssueOpened, GoIssueClosed, GoGitPullRequest,
    GoGraph, GoGlobe, GoPeople, GoPlus, GoFlame
} from 'react-icons/go';
import ActivityFeed from '../components/ActivityFeed';

const Dashboard = () => {
    const { user } = useAuth();
    const [leads, setLeads] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [leadsRes] = await Promise.all([
                    api.get('/leads?limit=10')
                ]);
                setLeads(leadsRes.data.leads);

                if (user.role !== 'rep') {
                    const statsRes = await api.get('/leads/stats');
                    setStats(statsRes.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (loading) {
        return (
            <>
                <div className="page-header">
                    <div><h2>Dashboard</h2></div>
                </div>
                <div className="loading"><div className="spinner"></div></div>
            </>
        );
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <h2>Dashboard</h2>
                    <span className="page-header-sub">
                        Welcome back, {user.name} {getCountryFlag(user.countryCode)}
                    </span>
                </div>
                {user.role === 'rep' && (
                    <Link to="/leads/new" className="btn btn-primary">
                        <GoPlus /> New Lead
                    </Link>
                )}
            </div>

            <div className="page-body fade-in">
                {/* Stats Row */}
                {user.role === 'rep' ? (
                    <RepStats leads={leads} />
                ) : (
                    <ManagerMasterStats stats={stats} role={user.role} />
                )}

                <div className="dashboard-grid">
                    {/* Left Column: Recent Leads */}
                    <div className="card h-full">
                        <div className="card-header">
                            <h3>{user.role === 'rep' ? 'My Recent Leads' : 'Recent Leads'}</h3>
                            <Link to="/leads" className="btn btn-sm">View all</Link>
                        </div>
                        <div className="lead-list dashboard-card-no-border">
                            {leads.length > 0 ? leads.map(lead => (
                                <Link
                                    key={lead._id}
                                    to={`/leads/${lead._id}`}
                                    className="lead-item"
                                >
                                    <span className={`lead-icon ${lead.status}`}>
                                        {lead.status === 'approved' ? <GoIssueClosed /> :
                                            lead.status === 'pending_review' ? <GoGitPullRequest /> :
                                                <GoIssueOpened />}
                                    </span>
                                    <div className="lead-info">
                                        <div className="lead-title">{lead.title}</div>
                                        <div className="lead-meta">
                                            <span>{getCountryFlag(lead.countryCode)} {lead.countryCode}</span>
                                            <span>•</span>
                                            <span>by {lead.createdBy?.name}</span>
                                            <span>•</span>
                                            <span>{timeAgo(lead.createdAt)}</span>
                                            <span className={`badge badge-${lead.status}`}>
                                                {formatStatus(lead.status)}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            )) : (
                                <div className="empty-state">
                                    <span className="empty-icon">📋</span>
                                    <h3>No leads yet</h3>
                                    <p>Get started by creating your first lead.</p>
                                    {user.role === 'rep' && (
                                        <Link to="/leads/new" className="btn btn-primary mt-4">
                                            <GoPlus /> Create Lead
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Activity & Feed */}
                    <div className="dashboard-sidebar">
                        <ContributionGraph data={stats?.activity || []} />
                        <ActivityFeed />
                    </div>
                </div>
            </div>
        </>
    );
};

const RepStats = ({ leads }) => {
    const counts = useMemo(() => {
        const c = { total: leads.length, approved: 0, pending: 0, denied: 0 };
        leads.forEach(l => {
            if (l.status === 'approved') c.approved++;
            else if (l.status === 'pending_review') c.pending++;
            else if (l.status === 'denied') c.denied++;
        });
        return c;
    }, [leads]);

    return (
        <div className="stats-row">
            <div className="stat-card" style={{ '--stat-color-start': '#4a4a4a', '--stat-color-end': '#717171' }}>
                <span className="stat-icon"><GoIssueOpened /></span>
                <span className="stat-value">{counts.total}</span>
                <span className="stat-label">My Leads</span>
            </div>
            <div className="stat-card" style={{ '--stat-color-start': '#545454', '--stat-color-end': '#858585' }}>
                <span className="stat-icon"><GoIssueClosed /></span>
                <span className="stat-value">{counts.approved}</span>
                <span className="stat-label">Approved</span>
            </div>
            <div className="stat-card" style={{ '--stat-color-start': '#d29922', '--stat-color-end': '#e3b341' }}>
                <span className="stat-icon"><GoGitPullRequest /></span>
                <span className="stat-value">{counts.pending}</span>
                <span className="stat-label">Pending Review</span>
            </div>
            <div className="stat-card" style={{ '--stat-color-start': '#da3633', '--stat-color-end': '#f85149' }}>
                <span className="stat-icon"><GoFlame /></span>
                <span className="stat-value">{counts.denied}</span>
                <span className="stat-label">Denied</span>
            </div>
        </div>
    );
};

const ManagerMasterStats = ({ stats, role }) => {
    if (!stats) return null;
    return (
        <div className="stats-row">
            <div className="stat-card" style={{ '--stat-color-start': '#4a4a4a', '--stat-color-end': '#717171' }}>
                <span className="stat-icon"><GoIssueOpened /></span>
                <span className="stat-value">{stats.totalLeads}</span>
                <span className="stat-label">{role === 'master' ? 'Global Leads' : 'Region Leads'}</span>
            </div>
            <div className="stat-card" style={{ '--stat-color-start': '#545454', '--stat-color-end': '#858585' }}>
                <span className="stat-icon"><GoGraph /></span>
                <span className="stat-value">${(stats.totalValue / 1000).toFixed(0)}K</span>
                <span className="stat-label">Pipeline Value</span>
            </div>
            <div className="stat-card" style={{ '--stat-color-start': '#8957e5', '--stat-color-end': '#bc8cff' }}>
                <span className="stat-icon"><GoIssueClosed /></span>
                <span className="stat-value">{stats.byStatus?.approved?.count || 0}</span>
                <span className="stat-label">Approved</span>
            </div>
            <div className="stat-card" style={{ '--stat-color-start': '#d29922', '--stat-color-end': '#e3b341' }}>
                <span className="stat-icon"><GoGitPullRequest /></span>
                <span className="stat-value">{stats.byStatus?.pending_review?.count || 0}</span>
                <span className="stat-label">Pending Review</span>
            </div>
            {role === 'master' && stats.byCountry && (
                <div className="stat-card" style={{ '--stat-color-start': '#da3633', '--stat-color-end': '#f85149' }}>
                    <span className="stat-icon"><GoGlobe /></span>
                    <span className="stat-value">{stats.byCountry.length}</span>
                    <span className="stat-label">Active Regions</span>
                </div>
            )}
        </div>
    );
};

const ContributionGraph = ({ data }) => {
    // Generate 12 weeks x 7 days grid
    const weeks = 12;
    const grid = useMemo(() => {
        const map = {};
        data.forEach(d => { map[d._id] = d.count; });

        const cols = [];
        const today = new Date();
        const startDay = today.getDay();

        for (let w = weeks - 1; w >= 0; w--) {
            const col = [];
            for (let d = 0; d < 7; d++) {
                const date = new Date(today);
                date.setDate(date.getDate() - (w * 7 + (startDay - d)));
                const key = date.toISOString().split('T')[0];
                const count = map[key] || 0;
                const level = count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4;
                col.push({ date: key, count, level });
            }
            cols.push(col);
        }
        return cols;
    }, [data]);

    return (
        <div className="contribution-graph">
            <h3><GoGraph /> Lead Activity</h3>
            <div className="card" style={{ padding: 'var(--space-5)', display: 'inline-block', width: '100%' }}>
                <div className="contribution-grid">
                    {grid.map((col, ci) => (
                        <div className="contribution-column" key={ci}>
                            {col.map((cell, di) => (
                                <div
                                    key={di}
                                    className="contribution-cell"
                                    data-level={cell.level}
                                    title={`${cell.date}: ${cell.count} leads`}
                                />
                            ))}
                        </div>
                    ))}
                </div>
                <div className="contribution-legend">
                    <span>Less</span>
                    <div className="contribution-cell" data-level="0" />
                    <div className="contribution-cell" data-level="1" />
                    <div className="contribution-cell" data-level="2" />
                    <div className="contribution-cell" data-level="3" />
                    <div className="contribution-cell" data-level="4" />
                    <span>More</span>
                </div>
            </div>
        </div>
    );
};

// Utilities
export const timeAgo = (dateStr) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'week', seconds: 604800 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 }
    ];
    for (const i of intervals) {
        const count = Math.floor(seconds / i.seconds);
        if (count >= 1) return `${count} ${i.label}${count > 1 ? 's' : ''} ago`;
    }
    return 'just now';
};

export const formatStatus = (status) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

export default Dashboard;
