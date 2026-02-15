import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { GoGraph, GoPeople, GoIssueOpened, GoCheck, GoX } from 'react-icons/go';
import { timeAgo } from './Dashboard';

const Analytics = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/leads/analytics');
                setData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="loading"><div className="spinner"></div></div>;
    if (!data) return <div className="error-message">Failed to load analytics</div>;

    // Prepare chart data
    const statusData = data.leadsByStatus.map(s => ({
        name: s._id.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), // capitalize
        count: s.count,
        value: s.value
    }));

    const userData = data.leadsByUser.map(u => ({
        name: u.name,
        value: u.value,
        count: u.count
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <>
            <div className="page-header">
                <div>
                    <h2>Analytics Dashboard</h2>
                    <span className="page-header-sub">Overview of sales performance and pipeline</span>
                </div>
            </div>

            <div className="page-body fade-in">
                {/* KPI Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon blue"><GoIssueOpened /></div>
                        <div className="stat-info">
                            <h3>{data.totalLeads}</h3>
                            <p>Total Leads</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon green"><GoGraph /></div>
                        <div className="stat-info">
                            <h3>${(data.pipelineValue / 1000).toFixed(1)}k</h3>
                            <p>Pipeline Value</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon purple"><GoCheck /></div>
                        <div className="stat-info">
                            <h3>{data.winRate}%</h3>
                            <p>Win Rate</p>
                        </div>
                    </div>
                </div>

                <div className="dashboard-grid" style={{ marginTop: 'var(--space-4)' }}>
                    {/* Leads by Status Chart */}
                    <div className="card">
                        <div className="card-header">
                            <h3>Leads by Status</h3>
                        </div>
                        <div style={{ height: 300, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statusData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-muted)" />
                                    <XAxis dataKey="name" stroke="var(--color-text-secondary)" />
                                    <YAxis stroke="var(--color-text-secondary)" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--color-bg-overlay)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
                                        itemStyle={{ color: 'var(--color-text-primary)' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="count" fill="var(--color-accent-blue)" name="Count" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Users Chart */}
                    <div className="card">
                        <div className="card-header">
                            <h3>Top Performers (Value)</h3>
                        </div>
                        <div style={{ height: 300, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={userData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-muted)" />
                                    <XAxis type="number" stroke="var(--color-text-secondary)" />
                                    <YAxis dataKey="name" type="category" stroke="var(--color-text-secondary)" width={100} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--color-bg-overlay)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
                                        formatter={(value) => `$${value.toLocaleString()}`}
                                    />
                                    <Legend />
                                    <Bar dataKey="value" fill="var(--color-accent-green)" name="Value ($)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="card" style={{ marginTop: 'var(--space-4)' }}>
                    <div className="card-header">
                        <h3>Recent Activity</h3>
                    </div>
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Lead</th>
                                    <th>Status</th>
                                    <th>Value</th>
                                    <th>Created By</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentLeads.map(lead => (
                                    <tr key={lead._id}>
                                        <td>{lead.title}</td>
                                        <td><span className={`badge badge-${lead.status}`}>{lead.status}</span></td>
                                        <td>${lead.estimatedValue?.toLocaleString()}</td>
                                        <td>{lead.createdBy?.name}</td>
                                        <td>{timeAgo(lead.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Analytics;
