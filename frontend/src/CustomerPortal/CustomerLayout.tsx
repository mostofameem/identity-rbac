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
        <div className="min-h-screen bg-slate-950 flex justify-center font-sans relative overflow-x-hidden">
            {/* Backdrop glows */}
            <div aria-hidden className="fixed -top-32 -left-24 w-96 h-96 rounded-full bg-primary-600/25 blur-[120px]" />
            <div aria-hidden className="fixed bottom-0 -right-24 w-96 h-96 rounded-full bg-violet-600/20 blur-[120px]" />

            {/* Device frame */}
            <div className="relative flex flex-col w-full max-w-md min-h-screen sm:min-h-[calc(100vh-3rem)] sm:my-6 bg-slate-50 sm:shadow-[0_24px_80px_rgba(2,6,23,0.5)] sm:rounded-[2rem] overflow-hidden">
                {/* Top Header */}
                <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-100 px-4 py-2.5 flex justify-between items-center">
                    <h1 className="flex items-center gap-2 text-base font-bold text-slate-900">
                        <span className="w-6 h-6 rounded-lg bg-brand-gradient grid place-items-center">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </span>
                        {title}
                    </h1>
                    <div className="flex items-center gap-1.5">
                        <a
                            href={config.adminPortalUrl}
                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors duration-200"
                            title="Admin Portal"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </a>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200"
                            title="Logout"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-grow pb-24 p-3 overflow-y-auto text-[13px] leading-snug">
                    {children}
                </main>

                {/* Bottom Navigation */}
                <nav className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 px-6 py-2 pb-safe-area shadow-[0_-4px_12px_rgba(0,0,0,0.04)] z-40">
                    <div className="flex justify-around items-center">
                        <NavLink
                            to="/"
                            end
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-0.5 px-6 py-1.5 rounded-xl transition-colors duration-200 ${isActive ? 'text-primary-600 bg-primary-50' : 'text-slate-400 hover:text-slate-600'
                                }`
                            }
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Explore</span>
                        </NavLink>

                        <NavLink
                            to="/history"
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-0.5 px-6 py-1.5 rounded-xl transition-colors duration-200 ${isActive ? 'text-primary-600 bg-primary-50' : 'text-slate-400 hover:text-slate-600'
                                }`
                            }
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
                        </NavLink>
                    </div>
                </nav>
            </div>
        </div>
    );
};

export default CustomerLayout;
