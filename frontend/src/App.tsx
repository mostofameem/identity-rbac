/**
 * Main App Component
 * 
 * The root component that handles routing and authentication.
 * Uses the new PageLayout and refactored page components.
 * 
 * Features:
 * - Protected routes with authentication
 * - Consistent layout across all pages
 * - Clean routing structure
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PageLayout } from './components/layout';
import { UserManagement, RoleManagement, PermissionManagement } from './components/pages';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import ProtectedRoute from './components/ProtectedRoute';
import { useMessage } from './hooks';

/**
 * Page Wrapper Component
 * 
 * Wraps page components with consistent layout and message handling
 */
interface PageWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ title, subtitle, children }) => {
  const { message, messageType, showMessage, clearMessage } = useMessage();
  const [loading, setLoading] = React.useState(false);

  const handleShowMessage = (msg: string, isError: boolean = false) => {
    showMessage(msg, isError ? 'error' : 'success');
  };

  return (
    <PageLayout title={title} subtitle={subtitle}>
      {React.cloneElement(children as React.ReactElement, {
        showMessage: handleShowMessage,
        loading,
        setLoading,
      })}
    </PageLayout>
  );
};

/**
 * App Routes Component
 * 
 * Defines all application routes with proper authentication checks
 */
const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Home Route */}
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
            <PageWrapper 
              title="User Management" 
              subtitle="Manage users and their role assignments"
            >
              <UserManagement 
                showMessage={() => {}} 
                loading={false} 
                setLoading={() => {}} 
              />
            </PageWrapper>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/roles" 
        element={
          <ProtectedRoute requiredPermission="role">
            <PageWrapper 
              title="Role Management" 
              subtitle="Create and manage system roles with permissions"
            >
              <RoleManagement 
                showMessage={() => {}} 
                loading={false} 
                setLoading={() => {}} 
              />
            </PageWrapper>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/permissions" 
        element={
          <ProtectedRoute requiredPermission="permission">
            <PageWrapper 
              title="Permission Management" 
              subtitle="View and manage system permissions"
            >
              <PermissionManagement 
                showMessage={() => {}} 
                loading={false} 
                setLoading={() => {}} 
              />
            </PageWrapper>
          </ProtectedRoute>
        } 
      />

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

/**
 * Main App Component
 * 
 * Root component with routing and authentication context
 */
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;