import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container fade-in">
                <div className="auth-logo">
                    <div className="logo-icon">⚡</div>
                    <h1>SalesHub</h1>
                </div>

                <div className="auth-card">
                    <h2>Sign in to SalesHub</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Email address</label>
                            <input
                                id="email"
                                type="email"
                                className="input"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                required
                                autoFocus
                            />
                        </div>
                        <div className="form-group mt-4">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                className="input"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••"
                                required
                                minLength={6}
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full mt-4 justify-center"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>
                </div>

                <div className="auth-footer">
                    New to SalesHub? <Link to="/register">Create an account</Link>
                </div>

                <div className="demo-credentials fade-in-delay-2">
                    <h3>Demo Credentials</h3>
                    <div className="credentials-grid">
                        <div className="credential-item">
                            <span className="role">Master Admin</span>
                            <code>master@salesportal.com</code>
                        </div>
                        <div className="credential-item">
                            <span className="role">Manager (US)</span>
                            <code>kodi@salesportal.com</code>
                        </div>
                        <div className="credential-item">
                            <span className="role">Rep (US)</span>
                            <code>sarah@salesportal.com</code>
                        </div>
                        <div className="credential-item">
                            <span className="role">Manager (CN)</span>
                            <code>wei@salesportal.com</code>
                        </div>
                        <div className="credential-item">
                            <span className="role">Manager (IN)</span>
                            <code>priya@salesportal.com</code>
                        </div>
                    </div>
                    <p className="password-hint">Password for all accounts: <strong>password123</strong></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
