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

                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '1rem' }}>
                    <p>Demo: <code>master@salesportal.com</code> / <code>password123</code></p>
                    <p style={{ marginTop: 4 }}>
                        Reps: <code>sarah@salesportal.com</code> • Managers: <code>kodi@salesportal.com</code>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
