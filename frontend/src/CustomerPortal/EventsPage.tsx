import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/api';
import CustomerLayout from './CustomerLayout';

const EventsPage: React.FC = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getEvents({ mode: 'ONGOING' });
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
        <CustomerLayout title="Ongoing Events">
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
                <div className="text-center py-20 px-6">
                    <div className="text-6xl mb-6">🗓️</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Ongoing Events</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">
                        Check back later for new events or explore your history.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className="group bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100">
                                    {event.status}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                    ID: #{event.id}
                                </span>
                            </div>

                            <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
                                {event.title}
                            </h3>

                            <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed">
                                {event.description || 'No description provided for this event.'}
                            </p>

                            <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Starts At</p>
                                        <p className="text-sm font-bold text-gray-700">
                                            {new Date(event.startAt).toLocaleString([], {
                                                dateStyle: 'medium',
                                                timeStyle: 'short',
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Spots</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-gray-700">
                                                {event.totalParticipants} / {event.maxParticipants}
                                            </span>
                                            <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full"
                                                    style={{
                                                        width: `${Math.min(
                                                            100,
                                                            (event.totalParticipants / event.maxParticipants) * 100
                                                        )}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <button
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-100 transition-all duration-200"
                                    onClick={() => {/* To be implemented: Registration flow */ }}
                                >
                                    Join Event
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </CustomerLayout>
    );
};

export default EventsPage;
