import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/api';
import CustomerLayout from './CustomerLayout';

const EventsPage: React.FC = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [joiningId, setJoiningId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // ... useEffect hooks ...

    const handleJoinEvent = async (eventId: number) => {
        try {
            setJoiningId(eventId);
            await apiClient.participateInEvent(eventId);
            // Refresh events to show updated status
            fetchEvents();
        } catch (err: any) {
            console.error('Failed to join event:', err);
            alert(err.response?.data?.message || 'Failed to join event. Please try again.');
        } finally {
            setJoiningId(null);
        }
    };
    const [status, setStatus] = useState<'ONGOING' | 'UPCOMING' | 'RECENT'>('ONGOING');
    const [searchTitle, setSearchTitle] = useState('');
    const [debouncedTitle, setDebouncedTitle] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedTitle(searchTitle);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTitle]);

    useEffect(() => {
        fetchEvents();
    }, [status, debouncedTitle]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getPublicEvents({
                mode: status,
                title: debouncedTitle
            });
            setEvents(response.data.data || []);
            setError(null);
        } catch (err: any) {
            console.error('Failed to fetch events:', err);
            setError('Could not load events. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <CustomerLayout title="Explore Events">
            {/* Filter Bar */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="relative w-full">
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchTitle}
                        onChange={(e) => setSearchTitle(e.target.value)}
                        className="w-full px-4 py-2 pl-10 rounded-xl border border-gray-100 bg-white text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {(['ONGOING', 'UPCOMING', 'RECENT'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatus(s)}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap border ${status === s
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 scale-105'
                                : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-200 hover:text-gray-600'
                                }`}
                        >
                            {s.charAt(0) + s.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium animate-pulse">Finding events...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-100 p-6 rounded-2xl text-center">
                    <p className="text-red-600 font-semibold mb-4">{error}</p>
                    <button
                        onClick={fetchEvents}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
                    >
                        Retry
                    </button>
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-16 px-6">
                    <div className="text-5xl mb-4">
                        {status === 'ONGOING' ? '🗓️' : status === 'UPCOMING' ? '⏳' : '📜'}
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                        No {status.toLowerCase()} events
                    </h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-xs">
                        {status === 'ONGOING'
                            ? 'Check back later for active events or see what is coming up next.'
                            : status === 'UPCOMING'
                                ? 'No upcoming events scheduled yet. Stay tuned!'
                                : 'No recent events recorded. History starts here!'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className="group bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100">
                                    {event.status}
                                </span>
                            </div>

                            <h3 className="text-base font-bold text-gray-900 mb-1 leading-tight group-hover:text-indigo-600 transition-colors">
                                {event.title}
                            </h3>

                            <p className="text-gray-500 text-xs mb-4 line-clamp-2 leading-tight">
                                {event.description || 'No description provided for this event.'}
                            </p>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-3 bg-gray-50 rounded-2xl">
                                <div className="flex flex-row flex-wrap gap-x-8 gap-y-2 flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Starts At</p>
                                            <p className="text-xs font-bold text-gray-700 whitespace-nowrap">
                                                {new Date(event.startAt).toLocaleString([], {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short',
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Spots</p>
                                            <span className="text-xs font-bold text-gray-700 whitespace-nowrap">
                                                {event.totalParticipants} / {event.maxParticipants}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {event.status === 'ONGOING' && (
                                    <div className="shrink-0 flex justify-end w-full md:w-auto">
                                        {event.perticipationStatus === 'GOING' ? (
                                            <button
                                                className="px-6 py-2 bg-red-50 text-red-600 hover:bg-red-100 active:scale-[0.98] rounded-xl font-bold text-xs border border-red-100 transition-all duration-200"
                                                onClick={() => {/* To be implemented: Cancellation flow */ }}
                                            >
                                                Cancel
                                            </button>
                                        ) : (
                                            <button
                                                className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                onClick={() => handleJoinEvent(event.id)}
                                                disabled={joiningId === event.id}
                                            >
                                                {joiningId === event.id ? (
                                                    <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                                ) : null}
                                                Join Now
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )
            }
        </CustomerLayout >
    );
};

export default EventsPage;
