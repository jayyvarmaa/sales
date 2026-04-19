import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const verifySession = async () => {
            try {
                // Check if session exists on backend
                const res = await api.get('/auth/profile');
                if (res.data.isAuthenticated) {
                    // Fetch full user data
                    const meRes = await api.get('/auth/me');
                    setUser(meRes.data);
                    localStorage.setItem('user', JSON.stringify(meRes.data));
                }
            } catch (err) {
                // No session or error
                localStorage.removeItem('user');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        verifySession();
    }, []);

    // Socket & Notifications
    useEffect(() => {
        if (user) {
            const socketUrl = import.meta.env.PROD ? window.location.origin : 'http://localhost:5000';
            const newSocket = io(socketUrl, {
                path: '/socket.io/',
                transports: ['polling']
            });
            setSocket(newSocket);

            newSocket.on('connect', () => {
                newSocket.emit('join', user._id);
            });

            newSocket.on('notification', (note) => {
                setNotifications(prev => [note, ...prev]);
                setUnreadCount(prev => prev + 1);
                toast(note.message, {
                    icon: note.type === 'success' ? '✅' : note.type === 'error' ? '❌' : 'ℹ️',
                    duration: 5000
                });
            });

            api.get('/notifications').then(res => {
                setNotifications(res.data.notifications);
                setUnreadCount(res.data.unreadCount);
            });

            return () => newSocket.close();
        }
    }, [user?._id]);

    const markRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    };

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const userData = res.data;
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const register = async (name, email, password, countryCode) => {
        const res = await api.post('/auth/register', { name, email, password, countryCode });
        const userData = res.data;
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    // Theme Management
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <AuthContext.Provider value={{
            user, loading, login, register, logout,
            theme, toggleTheme,
            socket, notifications, unreadCount, markRead, markAllRead
        }}>
            {children}
        </AuthContext.Provider>
    );
};
