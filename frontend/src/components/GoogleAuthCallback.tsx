import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { apiClient } from '../services/api';
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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="bg-white p-8 rounded-2xl shadow-card border border-slate-200 max-w-md w-full text-center">
                {error ? (
                    <div>
                        <div className="mx-auto mb-4 grid place-items-center h-14 w-14 rounded-full bg-red-50">
                            <svg className="h-7 w-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Authentication error</h2>
                        <p className="text-slate-500 text-sm">{error}</p>
                    </div>
                ) : (
                    <div>
                        <div className="mx-auto mb-5 grid place-items-center h-14 w-14 rounded-2xl bg-brand-gradient shadow-lg shadow-indigo-500/30">
                            <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-1">Completing sign-in</h2>
                        <p className="text-slate-500 text-sm">Please wait while we log you in…</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GoogleAuthCallback;
