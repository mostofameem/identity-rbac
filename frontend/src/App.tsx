/**
 * Main App Component
 *
 * Root component with routing and authentication context. Pages own their
 * headers; PageLayout supplies only the shell (sidebar + content column).
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PageLayout } from './components/layout';
import { UserManagement, RoleManagement, PermissionManagement } from './components/pages';
import EventsPage from './pages/events/EventsPage';
import EventTypesPage from './pages/events/EventTypesPage';
import LoginPage from './components/LoginPage';
import GoogleAuthCallback from './components/GoogleAuthCallback';
import HomePage from './components/HomePage';
import InvitationPage from './components/InvitationPage';
import ProtectedRoute from './components/ProtectedRoute';
import { logConfig, validateConfig } from './config/env';

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/:provider/callback" element={<GoogleAuthCallback />} />
        <Route path="/invitation" element={<InvitationPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Home Route (wraps itself in PageLayout) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      {/* Management Routes */}
      <Route
        path="/users"
        element={
          <ProtectedRoute requiredPermission="user">
            <PageLayout>
              <UserManagement />
            </PageLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/roles"
        element={
          <ProtectedRoute requiredPermission="role">
            <PageLayout>
              <RoleManagement />
            </PageLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/permissions"
        element={
          <ProtectedRoute requiredPermission="permission.view">
            <PageLayout>
              <PermissionManagement />
            </PageLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <PageLayout>
              <EventsPage />
            </PageLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/event-types"
        element={
          <ProtectedRoute>
            <PageLayout>
              <EventTypesPage />
            </PageLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    // Initialize configuration
    try {
      validateConfig();
      logConfig();
    } catch (error) {
      console.error('Configuration error:', error);
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
