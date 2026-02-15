import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Layout = () => {
    const { user } = useAuth();
    const [pendingCount, setPendingCount] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (user && (user.role === 'manager' || user.role === 'master')) {
            api.get('/leads?status=pending_review&limit=1')
                .then(res => setPendingCount(res.data.total))
                .catch(() => { });
        }
    }, [user]);

    return (
        <div className="app-layout">
            <Sidebar
                pendingCount={pendingCount}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="main-wrapper">
                <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
