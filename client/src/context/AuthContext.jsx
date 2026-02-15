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
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (token && savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            // Verify token is still valid
            api.get('/auth/me')
                .then(res => {
                    setUser(res.data);
                    localStorage.setItem('user', JSON.stringify(res.data));
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    // Socket & Notifications
    useEffect(() => {
        if (user) {
            // In production, use window.location.origin or env var
            const socketUrl = import.meta.env.PROD ? window.location.origin : 'http://localhost:5000';
            const newSocket = io(socketUrl, {
                path: '/socket.io/',
                transports: ['polling'] // Force polling for Vercel serverless compatibility
            });
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('Socket connected');
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

            // Fetch initial notifications
            api.get('/notifications').then(res => {
                setNotifications(res.data.notifications);
                setUnreadCount(res.data.unreadCount);
            });

            return () => newSocket.close();
        }
    }, [user?._id]); // Re-run only if user ID changes (login)

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
        const { token, ...userData } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const register = async (name, email, password, countryCode) => {
        const res = await api.post('/auth/register', { name, email, password, countryCode });
        const { token, ...userData } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
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
