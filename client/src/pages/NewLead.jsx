import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { GoIssueOpened, GoArrowLeft, GoPencil } from 'react-icons/go';

const SUGGESTED_TAGS = ['enterprise', 'smb', 'saas', 'cloud', 'ai', 'security', 'mobile', 'analytics', 'iot', 'fintech'];

const NewLead = () => {
    const { id } = useParams(); // If present, we are editing
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(!!id);
    const [form, setForm] = useState({
        title: '',
        description: '',
        companyName: '',
        contactEmail: '',
        estimatedValue: '',
        tags: []
    });

    useEffect(() => {
        if (id) {
            const fetchLead = async () => {
                try {
                    const res = await api.get(`/leads/${id}`);
                    const l = res.data;
                    setForm({
                        title: l.title,
                        description: l.description,
                        companyName: l.companyName || '',
                        contactEmail: l.contactEmail || '',
                        estimatedValue: l.estimatedValue || '',
                        tags: l.tags || []
                    });
                } catch (err) {
                    toast.error('Failed to load lead');
                    navigate('/leads');
                } finally {
                    setFetching(false);
                }
            };
            fetchLead();
        }
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const toggleTag = (tag) => {
        setForm(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...form,
                estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : 0
            };

            let res;
            if (id) {
                res = await api.put(`/leads/${id}`, payload);
                toast.success('Lead updated successfully!');
            } else {
                res = await api.post('/leads', payload);
                toast.success('Lead created successfully!');
            }
            navigate(`/leads/${res.data._id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save lead');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <>
            <div className="page-header">
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {id ? <GoPencil style={{ color: 'var(--color-accent-blue)' }} /> : <GoIssueOpened style={{ color: 'var(--color-accent-green)' }} />}
                        {id ? 'Edit Lead' : 'New Lead'}
                    </h2>
                    <span className="page-header-sub">
                        {id ? `Update details for lead #${id.slice(-6)}` : 'Create a new lead for your region'}
                    </span>
                </div>
            </div>

            <div className="page-body fade-in">
                <div style={{ maxWidth: 800 }}>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(-1)}
                        style={{ marginBottom: 'var(--space-4)' }}
                    >
                        <GoArrowLeft /> Back
                    </button>

                    <form onSubmit={handleSubmit}>
                        <div className="card">
                            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                                {/* Title */}
                                <div className="form-group">
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        className="input"
                                        placeholder="e.g., Enterprise SaaS Migration — TechCorp"
                                        value={form.title}
                                        onChange={handleChange}
                                        required
                                        autoFocus
                                    />
                                    <span className="form-hint">A concise title for this lead opportunity</span>
                                </div>

                                {/* Description */}
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        name="description"
                                        className="textarea"
                                        rows={8}
                                        placeholder="Describe the opportunity, key contacts, timeline, and next steps..."
                                        value={form.description}
                                        onChange={handleChange}
                                        required
                                    />
                                    <span className="form-hint">Include details about the prospect, their needs, and proposed approach</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
                                    {/* Company */}
                                    <div className="form-group">
                                        <label>Company Name</label>
                                        <input
                                            type="text"
                                            name="companyName"
                                            className="input"
                                            placeholder="e.g., TechCorp Global"
                                            value={form.companyName}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    {/* Contact Email */}
                                    <div className="form-group">
                                        <label>Contact Email</label>
                                        <input
                                            type="email"
                                            name="contactEmail"
                                            className="input"
                                            placeholder="contact@company.com"
                                            value={form.contactEmail}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {/* Estimated Value */}
                                <div className="form-group">
                                    <label>Estimated Deal Value ($)</label>
                                    <input
                                        type="number"
                                        name="estimatedValue"
                                        className="input"
                                        placeholder="e.g., 150000"
                                        value={form.estimatedValue}
                                        onChange={handleChange}
                                        min={0}
                                        style={{ maxWidth: 300 }}
                                    />
                                </div>

                                {/* Tags */}
                                <div className="form-group">
                                    <label>Labels</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                                        {SUGGESTED_TAGS.map(tag => (
                                            <button
                                                key={tag}
                                                type="button"
                                                className={`lead-tag ${form.tags.includes(tag) ? '' : ''}`}
                                                onClick={() => toggleTag(tag)}
                                                style={{
                                                    cursor: 'pointer',
                                                    opacity: form.tags.includes(tag) ? 1 : 0.4,
                                                    transform: form.tags.includes(tag) ? 'scale(1.05)' : 'scale(1)',
                                                    transition: 'all var(--transition-fast)'
                                                }}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Region info */}
                                <div style={{
                                    padding: 'var(--space-4)',
                                    background: 'var(--color-bg-subtle)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border-muted)',
                                    fontSize: 'var(--font-size-sm)',
                                    color: 'var(--color-text-secondary)'
                                }}>
                                    📍 This lead will be tagged to your region: <strong>{user.countryCode}</strong>
                                    {' '}and routed to your country manager for approval.
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn" onClick={() => navigate(-1)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                                {loading ? 'Saving...' : (id ? 'Update Lead' : 'Create Lead')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default NewLead;
