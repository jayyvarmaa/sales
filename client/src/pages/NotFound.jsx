import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="auth-page">
            <div className="auth-container" style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '64px', fontWeight: 700, backgroundImage: 'linear-gradient(135deg, var(--color-accent-purple), var(--color-accent-blue))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>404</h1>
                <h2 style={{ fontSize: 'var(--font-size-xl)' }}>Page Not Found</h2>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    The page you are looking for does not exist or has been moved.
                </p>
                <Link to="/dashboard" className="btn btn-primary">
                    Return Home
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
