import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { apiClient, LoginResponse } from '../services/api';
import { useAuth } from '../context/AuthContext';

const GoogleAuthCallback: React.FC = () => {
    const { provider } = useParams<{ provider: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();

    useEffect(() => {
        const handleCallback = async () => {
            const queryParams = new URLSearchParams(location.search);
            const code = queryParams.get('code');
            const state = queryParams.get('state');

            if (!code || !state || !provider) {
                setError('Missing required authentication parameters');
                setTimeout(() => navigate('/login'), 3000);
                return;
            }

            try {
                const response = await apiClient.completeGoogleAuth(provider, code, state);
                const { accessToken, refreshToken } = response.data;

                // Save tokens and user data (similar to login method in AuthContext)
                localStorage.setItem('token', accessToken);
                localStorage.setItem('refreshToken', refreshToken);

                // Fetch user permissions
                const permissionsResponse = await apiClient.getUserPermissions();
                const permissions = permissionsResponse.data.data || [];

                const userEmail = "Google User"; // We might want to decode JWT to get email or let backend return it.
                // Since our AuthContext expects a user object, we should probably update it to handle this flow or re-use parts.

                // For now, let's just use a trick: navigate to a path that triggers AuthContext's initial loading logic
                // Or better, let's just reload the page to let AuthContext pick up the tokens.
                window.location.href = '/';
            } catch (err: any) {
                console.error('Authentication failed:', err);
                setError(err.message || 'Authentication failed. Redirecting to login...');
                setTimeout(() => navigate('/login'), 3000);
            }
        };

        handleCallback();
    }, [location, navigate, provider]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                {error ? (
                    <div className="text-red-600">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h2 className="text-xl font-bold mb-2">Authentication Error</h2>
                        <p>{error}</p>
                    </div>
                ) : (
                    <div>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-bold mb-2">Completing Authentication</h2>
                        <p className="text-gray-600">Please wait while we log you in...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GoogleAuthCallback;
