import { Link } from 'react-router-dom';
import { GoShieldLock } from 'react-icons/go';

const Forbidden = () => {
    return (
        <div className="auth-page">
            <div className="auth-container" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '64px', color: 'var(--color-accent-red)' }}>
                    <GoShieldLock />
                </div>
                <h2 style={{ fontSize: 'var(--font-size-xl)' }}>Access Denied</h2>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    You don't have permission to access this resource.
                </p>
                <Link to="/dashboard" className="btn btn-primary">
                    Return Home
                </Link>
            </div>
        </div>
    );
};

export default Forbidden;
