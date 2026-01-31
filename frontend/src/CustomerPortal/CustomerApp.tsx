import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import EventsPage from './EventsPage';
import HistoryPage from './HistoryPage';
import LoginPage from '../components/LoginPage';
import GoogleAuthCallback from '../components/GoogleAuthCallback';
import ProtectedRoute from '../components/ProtectedRoute';

const CustomerApp: React.FC = () => {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen bg-gray-50">
                    <Routes>
                        {/* Public Auth Routes */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/auth/:provider/callback" element={<GoogleAuthCallback />} />

                        {/* Customer Portal Routes */}
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <EventsPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/history"
                            element={
                                <ProtectedRoute>
                                    <HistoryPage />
                                </ProtectedRoute>
                            }
                        />

                        {/* Fallback - Redirect to main portal if logged in, else login */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
};

export default CustomerApp;
