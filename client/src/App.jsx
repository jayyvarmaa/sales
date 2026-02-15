import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import NewLead from './pages/NewLead';
import Approvals from './pages/Approvals';
import Team from './pages/Team';
import UserManagement from './pages/UserManagement';
import AuditLog from './pages/AuditLog';

import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import NotFound from './pages/NotFound';
import Forbidden from './pages/Forbidden';

const AppRoutes = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading" style={{ minHeight: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
            <Route path="/403" element={<Forbidden />} />

            {/* Protected Routes */}
            <Route element={
                <ProtectedRoute>
                    <Layout />
                </ProtectedRoute>
            }>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/leads/new" element={
                    <ProtectedRoute roles={['rep']}>
                        <NewLead />
                    </ProtectedRoute>
                } />
                <Route path="/leads/:id/edit" element={
                    <ProtectedRoute roles={['rep']}>
                        <NewLead />
                    </ProtectedRoute>
                } />
                <Route path="/leads/:id" element={<LeadDetail />} />
                <Route path="/approvals" element={
                    <ProtectedRoute roles={['manager', 'master']}>
                        <Approvals />
                    </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                    <ProtectedRoute roles={['manager', 'master']}>
                        <Analytics />
                    </ProtectedRoute>
                } />
                <Route path="/team" element={
                    <ProtectedRoute roles={['manager', 'master']}>
                        <Team />
                    </ProtectedRoute>
                } />
                <Route path="/users" element={
                    <ProtectedRoute roles={['master']}>
                        <UserManagement />
                    </ProtectedRoute>
                } />
                <Route path="/audit" element={
                    <ProtectedRoute roles={['master']}>
                        <AuditLog />
                    </ProtectedRoute>
                } />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#191919',
                            color: '#f1f1f1',
                            border: '1px solid #363636',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontFamily: 'Poppins, sans-serif'
                        },
                        success: {
                            iconTheme: { primary: '#4a9e5c', secondary: '#fff' }
                        },
                        error: {
                            iconTheme: { primary: '#c45450', secondary: '#fff' }
                        }
                    }}
                />
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;
