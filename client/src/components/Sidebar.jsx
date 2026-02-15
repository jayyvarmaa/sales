import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    GoHome, GoIssueOpened, GoPlusCircle, GoPeople,
    GoShieldCheck, GoLog, GoSignOut, GoGitPullRequest,
    GoGear, GoSun, GoMoon, GoCheck, GoGraph
} from 'react-icons/go';

const Sidebar = ({ pendingCount = 0, isOpen, onClose }) => {
    const { user, logout, theme, toggleTheme } = useAuth();
    const location = useLocation();

    const navItems = [
        { to: '/dashboard', icon: <GoHome />, label: 'Dashboard', roles: ['rep', 'manager', 'master'] },
        { to: '/leads', icon: <GoIssueOpened />, label: 'All Leads', roles: ['rep', 'manager', 'master'] },
        { to: '/leads/new', icon: <GoPlusCircle />, label: 'New Lead', roles: ['rep'] },
        {
            to: '/approvals',
            icon: <GoGitPullRequest />,
            label: 'Pending Reviews',
            roles: ['manager', 'master'],
            count: pendingCount
        },
        { to: '/team', icon: <GoPeople />, label: 'Team', roles: ['manager', 'master'] },
        { to: '/users', icon: <GoShieldCheck />, label: 'User Management', roles: ['master'] },
        { to: '/audit', icon: <GoLog />, label: 'Audit Log', roles: ['master'] }
    ];

    const filteredItems = navItems.filter(item => item.roles.includes(user?.role));

    const handleNavClick = () => {
        if (onClose) onClose();
    };

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose} />
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">⚡</div>
                    <div>
                        <h1>SalesHub by</h1>

                        <a
                            href="https://instagram.com/jayyvarmaa"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sidebar-brand-subtext"
                        >
                            @jayyvarmaa
                        </a>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section">Navigation</div>
                    {filteredItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={handleNavClick}
                        >
                            <span className="icon">{item.icon}</span>
                            {item.label}
                            {item.count > 0 && (
                                <span className="badge-count">{item.count}</span>
                            )}
                        </NavLink>
                    ))}

                    {/* Manager / Master Links */}
                    {(user.role === 'manager' || user.role === 'master') && (
                        <>
                            <div className="sidebar-section">Management</div>
                            <NavLink to="/approvals" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
                                <span className="icon"><GoCheck /></span>
                                Approvals
                            </NavLink>
                            <NavLink to="/analytics" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
                                <span className="icon"><GoGraph /></span>
                                Analytics
                            </NavLink>
                            <NavLink to="/team" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
                                <span className="icon"><GoPeople /></span>
                                Team
                            </NavLink>
                        </>
                    )}
                    <div className="sidebar-section" style={{ marginTop: 'auto' }}>Account</div>
                    <NavLink
                        to="/profile"
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        onClick={handleNavClick}
                    >
                        <span className="icon"><GoGear /></span>
                        Settings
                    </NavLink>
                    <button className="sidebar-link" onClick={toggleTheme}>
                        <span className="icon">{theme === 'dark' ? <GoSun /> : <GoMoon />}</span>
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <button className="sidebar-link" onClick={logout}>
                        <span className="icon"><GoSignOut /></span>
                        Sign out
                    </button>
                </nav>

                <div className="sidebar-user">
                    <div className="avatar">{user?.avatar}</div>
                    <div className="sidebar-user-info">
                        <div className="name">{user?.name}</div>
                        <div className="role">
                            {user?.role} • {getCountryFlag(user?.countryCode)} {user?.countryCode}
                        </div>
                    </div>
                    <span className={`badge-role badge-${user?.role}`}>{user?.role}</span>
                </div>
            </aside>
        </>
    );
};

export const getCountryFlag = (code) => {
    const flags = {
        US: '🇺🇸', CN: '🇨🇳', IN: '🇮🇳', UK: '🇬🇧', DE: '🇩🇪',
        FR: '🇫🇷', JP: '🇯🇵', BR: '🇧🇷', AU: '🇦🇺', CA: '🇨🇦',
        KR: '🇰🇷', SG: '🇸🇬', AE: '🇦🇪', MX: '🇲🇽', NG: '🇳🇬'
    };
    return flags[code] || '🌍';
};

export default Sidebar;
