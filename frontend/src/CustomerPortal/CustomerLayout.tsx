import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { config } from '../config/env';

interface CustomerLayoutProps {
    children: React.ReactNode;
    title: string;
}

const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children, title }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans">
            {/* Top Header */}
            <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    {title}
                </h1>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden xs:block">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">User</p>
                        <p className="text-sm font-semibold text-gray-700 truncate max-w-[120px]">
                            {user?.email?.split('@')[0]}
                        </p>
                    </div>
                    <a
                        href={config.adminPortalUrl}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all duration-200"
                        title="Admin Portal"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </a>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                        title="Logout"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow pb-24 p-4">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 pb-safe-area shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-40">
                <div className="flex justify-around items-center max-w-md mx-auto">
                    <NavLink
                        to="/portal"
                        end
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 p-2 transition-all duration-200 ${isActive ? 'text-indigo-600 scale-110' : 'text-gray-400 hover:text-gray-600'
                            }`
                        }
                    >
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Explore</span>
                    </NavLink>

                    <NavLink
                        to="/portal/history"
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 p-2 transition-all duration-200 ${isActive ? 'text-indigo-600 scale-110' : 'text-gray-400 hover:text-gray-600'
                            }`
                        }
                    >
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
                    </NavLink>
                </div>
            </nav>
        </div>
    );
};

export default CustomerLayout;
