import React, { useEffect, useState } from 'react';
import { apiClient, Participation } from '../services/api';
import CustomerLayout from './CustomerLayout';
import StatusChip from '../components/StatusChip';

const HistoryPage: React.FC = () => {
    const [participations, setParticipations] = useState<Participation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getParticipations();
            setParticipations(response.data.data || []);
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch history:', err);
            setError('Could not load participation history.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <CustomerLayout title="My History">
            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 shadow-soft border border-slate-200">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <div className="h-4 w-2/3 rounded bg-slate-100 animate-pulse mb-2" />
                                    <div className="h-2.5 w-16 rounded bg-slate-100 animate-pulse" />
                                </div>
                                <div className="h-5 w-20 rounded-full bg-slate-100 animate-pulse" />
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                                <div className="h-8 rounded-xl bg-slate-50 animate-pulse" />
                                <div className="h-8 rounded-xl bg-slate-50 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-100 p-6 rounded-2xl text-center">
                    <p className="text-red-600 font-semibold mb-4">{error}</p>
                    <button
                        onClick={fetchHistory}
                        className="px-6 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition"
                    >
                        Retry
                    </button>
                </div>
            ) : participations.length === 0 ? (
                <div className="text-center py-20 px-6">
                    <div className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-primary-50 text-primary-500 mb-5">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No participations yet</h3>
                    <p className="text-slate-500 max-w-xs mx-auto">
                        Your event history will appear here once you start joining events.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {participations.map((p, idx) => (
                        <div
                            key={`${p.eventId}-${idx}`}
                            className="bg-white rounded-2xl p-4 shadow-soft border border-slate-200 flex flex-col gap-3"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-grow">
                                    <h4 className="text-base font-bold text-slate-900 leading-tight mb-0.5">
                                        {p.eventTitle}
                                    </h4>
                                    <p className="text-[9px] font-bold text-primary-500 uppercase tracking-tighter">
                                        {p.eventType}
                                    </p>
                                </div>
                                <StatusChip status={p.status} size="small" />
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Event Date</p>
                                        <p className="text-xs font-bold text-slate-700">
                                            {new Date(p.eventStartTime).toLocaleDateString([], {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Guests</p>
                                        <p className="text-xs font-bold text-slate-700">+{p.guestCount}</p>
                                    </div>
                                </div>
                            </div>

                            {p.remarks && (
                                <div className="bg-amber-50 rounded-xl p-3 text-amber-700 text-xs italic border border-amber-100/60">
                                    "{p.remarks}"
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </CustomerLayout>
    );
};

export default HistoryPage;
