import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import AdminDashboard from './components/AdminDashboard';
import UserManagement from './components/UserManagement';
import RoleManagement from './components/RoleManagement';
import PermissionManagement from './components/PermissionManagement';
import Sidebar from './components/Sidebar';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route component (redirects to home if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return user ? <Navigate to="/" replace /> : <>{children}</>;
};

// Wrapper components for management pages
const UserManagementPage: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [isError, setIsError] = React.useState(false);
  const { user } = useAuth();

  const showMessage = (msg: string, error: boolean = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => {
      setMessage('');
      setIsError(false);
    }, 5000);
  };

  return (
    <div className="h-screen bg-gray-100">
      <Sidebar />
      <div className="ml-64 h-full overflow-auto">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <div className="flex items-center">
                <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              </div>
            </div>
          </div>
        </header>
        <main className="p-6">
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}
          <UserManagement showMessage={showMessage} loading={loading} setLoading={setLoading} />
        </main>
      </div>
    </div>
  );
};

const RoleManagementPage: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [isError, setIsError] = React.useState(false);
  const { user } = useAuth();

  const showMessage = (msg: string, error: boolean = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => {
      setMessage('');
      setIsError(false);
    }, 5000);
  };

  return (
    <div className="h-screen bg-gray-100">
      <Sidebar />
      <div className="ml-64 h-full overflow-auto">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
              <div className="flex items-center">
                <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              </div>
            </div>
          </div>
        </header>
        <main className="p-6">
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}
          <RoleManagement showMessage={showMessage} loading={loading} setLoading={setLoading} />
        </main>
      </div>
    </div>
  );
};

const PermissionManagementPage: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [isError, setIsError] = React.useState(false);
  const { user } = useAuth();

  const showMessage = (msg: string, error: boolean = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => {
      setMessage('');
      setIsError(false);
    }, 5000);
  };

  return (
    <div className="h-screen bg-gray-100">
      <Sidebar />
      <div className="ml-64 h-full overflow-auto">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Permission Management</h1>
              <div className="flex items-center">
                <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              </div>
            </div>
          </div>
        </header>
        <main className="p-6">
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}
          <PermissionManagement showMessage={showMessage} loading={loading} setLoading={setLoading} />
        </main>
      </div>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/users" 
        element={
          <ProtectedRoute>
            <UserManagementPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/roles" 
        element={
          <ProtectedRoute>
            <RoleManagementPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/permissions" 
        element={
          <ProtectedRoute>
            <PermissionManagementPage />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App; 