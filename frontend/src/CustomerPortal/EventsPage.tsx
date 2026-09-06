import React, { useEffect, useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField } from '@mui/material';
import { apiClient } from '../services/api';
import CustomerLayout from './CustomerLayout';
import StatusChip from '../components/StatusChip';
import ConfirmDialog from '../components/ConfirmDialog';
import { useSnackbar } from '../context/SnackbarContext';

const EventsPage: React.FC = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [joiningId, setJoiningId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [editingGuestId, setEditingGuestId] = useState<number | null>(null);
    const [tempGuestCount, setTempGuestCount] = useState<number>(0);
    const [isUpdatingGuest, setIsUpdatingGuest] = useState(false);
    const [guestCountError, setGuestCountError] = useState<string | null>(null);
    const [cancelEventId, setCancelEventId] = useState<number | null>(null);

    const snackbar = useSnackbar();

    const handleJoinEvent = async (eventId: number, currentStatus?: string) => {
        try {
            setJoiningId(eventId);
            if (currentStatus === 'CANCELED') {
                await apiClient.updateParticipationStatus(eventId, 'GOING');
            } else {
                await apiClient.participateInEvent(eventId);
            }
            fetchEvents();
        } catch (err: any) {
            console.error('Failed to join event:', err);
            snackbar.error(err.response?.data?.message || 'Failed to join event. Please try again.');
        } finally {
            setJoiningId(null);
        }
    };

    const handleCancelParticipation = async (eventId: number) => {
        try {
            setJoiningId(eventId);
            await apiClient.updateParticipationStatus(eventId, 'CANCELED');
            fetchEvents();
        } catch (err: any) {
            console.error('Failed to cancel participation:', err);
            snackbar.error(err.response?.data?.message || 'Failed to cancel participation. Please try again.');
            throw err;
        } finally {
            setJoiningId(null);
        }
    };

    const handleUpdateGuestCount = async (eventId: number) => {
        if (tempGuestCount > 5) {
            setGuestCountError('Maximum 5 guests allowed.');
            return;
        }
        try {
            setIsUpdatingGuest(true);
            await apiClient.updateGuestCount(eventId, tempGuestCount);
            setEditingGuestId(null);
            setGuestCountError(null);
            fetchEvents();
            snackbar.success('Guest count updated');
        } catch (err: any) {
            console.error('Failed to update guest count:', err);
            snackbar.error(err.response?.data?.message || 'Failed to update guest count. Please try again.');
        } finally {
            setIsUpdatingGuest(false);
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
            <div className="flex flex-col gap-3 mb-6">
                <div className="relative w-full">
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchTitle}
                        onChange={(e) => setSearchTitle(e.target.value)}
                        className="w-full px-4 py-2.5 pl-10 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                    />
                    <svg
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {/* Segmented status filter */}
                <div className="flex gap-1 p-1 bg-slate-200/60 rounded-full">
                    {(['ONGOING', 'UPCOMING', 'RECENT'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatus(s)}
                            className={`flex-1 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${status === s
                                ? 'bg-white text-primary-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {s.charAt(0) + s.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="grid gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft">
                            <div className="h-5 w-20 rounded-full bg-slate-100 animate-pulse mb-3" />
                            <div className="h-4 w-2/3 rounded bg-slate-100 animate-pulse mb-2" />
                            <div className="h-3 w-full rounded bg-slate-100 animate-pulse mb-4" />
                            <div className="h-14 rounded-2xl bg-slate-50 animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-100 p-6 rounded-2xl text-center">
                    <p className="text-red-600 font-semibold mb-4">{error}</p>
                    <button
                        onClick={fetchEvents}
                        className="px-6 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition"
                    >
                        Retry
                    </button>
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-16 px-6">
                    <div className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-primary-50 text-primary-500 mb-4">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                        No {status.toLowerCase()} events
                    </h3>
                    <p className="text-slate-500 max-w-xs mx-auto text-xs">
                        {status === 'ONGOING'
                            ? 'Check back later for active events or see what is coming up next.'
                            : status === 'UPCOMING'
                                ? 'No upcoming events scheduled yet. Stay tuned!'
                                : 'No recent events recorded. History starts here!'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className="group bg-white rounded-2xl p-4 shadow-soft border border-slate-200 hover:shadow-card hover:border-slate-300 transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <StatusChip status={event.status} size="small" />
                            </div>

                            <h3 className="text-base font-bold text-slate-900 mb-1 leading-tight group-hover:text-primary-600 transition-colors">
                                {event.title}
                            </h3>

                            <p className="text-slate-500 text-xs mb-4 line-clamp-2 leading-tight">
                                {event.description || 'No description provided for this event.'}
                            </p>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100/80">
                                <div className="flex flex-row flex-wrap gap-x-8 gap-y-2 flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Starts At</p>
                                            <p className="text-xs font-bold text-slate-700 whitespace-nowrap">
                                                {new Date(event.startAt).toLocaleString([], {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short',
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spots</p>
                                            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                                                {event.totalParticipants} / {event.maxParticipants}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {event.status === 'ONGOING' && (
                                    <div className="shrink-0 flex flex-col items-end gap-2 w-full md:w-auto">
                                        {(event.perticipationStatus === 'GOING' || event.perticipationStatus === 'CANCELED') && (
                                            <button
                                                onClick={() => {
                                                    setEditingGuestId(event.id);
                                                    setTempGuestCount(event.guestCount || 0);
                                                    setGuestCountError(null);
                                                }}
                                                className="w-full md:w-auto px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl font-bold text-xs border border-indigo-100 transition-all duration-200"
                                            >
                                                Update Guests ({event.guestCount || 0})
                                            </button>
                                        )}

                                        <div className="flex flex-row items-center gap-2 w-full md:w-auto">
                                            {event.perticipationStatus === 'GOING' ? (
                                                <button
                                                    className="flex-1 md:flex-none px-6 py-2 bg-red-50 text-red-600 hover:bg-red-100 active:scale-[0.98] rounded-xl font-bold text-xs border border-red-100 transition-all duration-200 disabled:opacity-50"
                                                    onClick={() => setCancelEventId(event.id)}
                                                    disabled={joiningId === event.id}
                                                >
                                                    {joiningId === event.id ? (
                                                        <span className="inline-block w-3 h-3 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></span>
                                                    ) : 'Cancel'}
                                                </button>
                                            ) : (
                                                <button
                                                    className="flex-1 md:flex-none px-8 py-2 bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                    onClick={() => handleJoinEvent(event.id, event.perticipationStatus)}
                                                    disabled={joiningId === event.id}
                                                >
                                                    {joiningId === event.id ? (
                                                        <span className="inline-block w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                                    ) : null}
                                                    {event.perticipationStatus === 'CANCELED' ? 'Re-join' : 'Join Now'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Guest Count Modal */}
            <Dialog
                open={editingGuestId !== null}
                onClose={() => setEditingGuestId(null)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Update guest count</DialogTitle>
                <DialogContent>
                    <TextField
                        type="number"
                        fullWidth
                        value={tempGuestCount}
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setTempGuestCount(val);
                            if (val > 5) setGuestCountError('Maximum 5 guests allowed.');
                            else setGuestCountError(null);
                        }}
                        slotProps={{ htmlInput: { min: 0, max: 5 } }}
                        error={Boolean(guestCountError)}
                        helperText={guestCountError ?? 'You can invite up to 5 additional guests.'}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditingGuestId(null)} color="inherit" variant="text">
                        Cancel
                    </Button>
                    <Button
                        onClick={() => editingGuestId && handleUpdateGuestCount(editingGuestId)}
                        disabled={isUpdatingGuest || Boolean(guestCountError)}
                        variant="contained"
                    >
                        {isUpdatingGuest ? 'Saving…' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Cancel participation confirm */}
            <ConfirmDialog
                open={cancelEventId !== null}
                onClose={() => setCancelEventId(null)}
                onConfirm={() => {
                    if (cancelEventId) return handleCancelParticipation(cancelEventId);
                }}
                title="Cancel participation?"
                message="You can re-join later while the event is still ongoing."
                confirmLabel="Cancel participation"
                tone="danger"
            />
        </CustomerLayout>
    );
};

export default EventsPage;
