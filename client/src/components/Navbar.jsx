import { useState, useRef, useEffect } from 'react';
import { GoBell, GoSearch, GoSidebarExpand } from 'react-icons/go';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Navbar = ({ onMenuClick }) => {
    const { unreadCount, notifications, markRead, markAllRead } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState({ leads: [], users: [] });
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Debounce Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                try {
                    const res = await api.get(`/search?q=${searchTerm}`);
                    setSearchResults(res.data);
                    setShowResults(true);
                } catch (err) {
                    console.error(err);
                }
            } else {
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleNotificationClick = async (note) => {
        if (!note.read) {
            await markRead(note._id);
        }
        setShowNotifications(false);
        if (note.link) {
            navigate(note.link);
        }
    };

    const handleResultClick = (link) => {
        setSearchTerm('');
        setShowResults(false);
        navigate(link);
    };

    return (
        <header className="navbar">
            <button className="mobile-menu-btn" onClick={onMenuClick}>
                <GoSidebarExpand />
            </button>

            <div className="navbar-search" ref={searchRef}>
                <GoSearch className="search-icon" />
                <input
                    type="text"
                    placeholder="Search (Ctrl + K)"
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
                />

                {showResults && (searchResults.leads.length > 0 || searchResults.users.length > 0) && (
                    <div className="search-results-dropdown">
                        {searchResults.leads.length > 0 && (
                            <div className="search-section">
                                <div className="search-header">Leads</div>
                                {searchResults.leads.map(lead => (
                                    <div
                                        key={lead._id}
                                        className="search-item"
                                        onClick={() => handleResultClick(`/leads/${lead._id}`)}
                                    >
                                        <div className="search-item-title">{lead.title}</div>
                                        <div className="search-item-meta">{lead.companyName} • {lead.status}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {searchResults.users.length > 0 && (
                            <div className="search-section">
                                <div className="search-header">Users</div>
                                {searchResults.users.map(user => (
                                    <div
                                        key={user._id}
                                        className="search-item"
                                        onClick={() => handleResultClick(`/users`)} // Or profile if exists
                                    >
                                        <div className="search-item-title">{user.name}</div>
                                        <div className="search-item-meta">{user.email} • {user.role}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="navbar-actions">
                <div className="notification-wrapper" ref={dropdownRef}>
                    <button
                        className="notification-btn"
                        onClick={() => setShowNotifications(!showNotifications)}
                        title="Notifications"
                    >
                        <GoBell />
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                    </button>

                    {showNotifications && (
                        <div className="notification-dropdown">
                            <div className="notification-header">
                                <span>Notifications</span>
                                {unreadCount > 0 && (
                                    <button className="text-btn text-xs" onClick={markAllRead}>
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="notification-list">
                                {notifications.length === 0 ? (
                                    <div className="notification-empty">No notifications</div>
                                ) : (
                                    notifications.map(note => (
                                        <div
                                            key={note._id}
                                            className={`notification-item ${!note.read ? 'unread' : ''}`}
                                            onClick={() => handleNotificationClick(note)}
                                        >
                                            <div className="notification-content">
                                                <div className="notification-message">{note.message}</div>
                                                <div className="notification-time">{note.createdAt ? new Date(note.createdAt).toLocaleTimeString() : ''}</div>
                                            </div>
                                            {!note.read && <div className="notification-dot" />}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
