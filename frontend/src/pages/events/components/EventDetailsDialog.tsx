import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Divider,
    Chip,
    Card,
    CardContent,
    Avatar,
    Alert,
    CircularProgress,
    Stack,
    MenuItem,
    IconButton
} from '@mui/material';
import {
    CalendarToday,
    Event,
    People,
    Schedule,
    Description,
    Close,
    AccessTime,
    LockClock,
    PowerSettingsNew as PowerIcon,
    Edit as EditIcon,
    Save as SaveIcon,
} from '@mui/icons-material';
import { TextField, Switch, FormControlLabel } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import type { Event as EventType, EventType as EventTypeDetail } from '../types/event.types';
import { eventService, eventTypeService } from '../services/eventService';
import { format } from 'date-fns';

interface EventDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    event: EventType | null;
}

const EventDetailsDialog: React.FC<EventDetailsDialogProps> = ({ open, onClose, event: initialEvent }) => {
    const [event, setEvent] = useState<EventType | null>(initialEvent);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<EventType>>({});
    const [saving, setSaving] = useState(false);
    const [eventTypes, setEventTypes] = useState<EventTypeDetail[]>([]);

    useEffect(() => {
        if (open && initialEvent?.id) {
            fetchEventDetails(initialEvent.id);
            fetchEventTypes();
        } else {
            setEvent(initialEvent);
            setError(null);
        }
    }, [open, initialEvent]);

    const fetchEventTypes = async () => {
        try {
            const response = await eventTypeService.getEventTypes({ page: 1, limit: 100 });
            setEventTypes(response.data);
        } catch (error) {
            console.error('Error fetching event types:', error);
        }
    };

    const fetchEventDetails = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            const data = await eventService.getEvent(id);
            setEvent(data);
            setEditData(data);
        } catch (err: any) {
            console.error('Error fetching event details:', err);
            setError(err.message || 'Failed to load event details');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAutoCreate = () => {
        if (!event) return;
        const newValue = !editData.shouldAutoCreateEvent;
        setEditData(prev => ({ ...prev, shouldAutoCreateEvent: newValue }));
        // Note: Backend API not yet implemented for this, but updating local state for UI
    };

    const handleSave = async () => {
        if (!event?.id) return;
        try {
            setSaving(true);
            await eventService.updateEvent(event.id, editData);
            await fetchEventDetails(event.id);
            setIsEditing(false);
        } catch (err: any) {
            console.error('Error updating event:', err);
            alert(err.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    const getStatusColor = (status?: string) => {
        switch (status?.toUpperCase()) {
            case 'ONGOING':
            case 'ACTIVE':
                return 'success';
            case 'UPCOMING':
                return 'info';
            case 'RECENT':
                return 'primary';
            case 'ENDED':
            case 'COMPLETED':
                return 'default';
            default:
                return 'default';
        }
    };

    const getStatusLabel = (status?: string | null) => {
        return status?.toUpperCase() || 'UNKNOWN';
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                }
            }}
        >
            <DialogTitle sx={{ pb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ color: 'white' }}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                            <Event sx={{ fontSize: 32 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: 'white', mb: 0.5 }}>
                                {isEditing ? (
                                    <TextField
                                        variant="standard"
                                        value={editData.title || ''}
                                        onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                                        fullWidth
                                        sx={{
                                            input: { color: 'white', fontSize: '1.5rem', fontWeight: 'bold' },
                                            '& .MuiInput-underline:before': { borderBottomColor: 'rgba(255,255,255,0.3)' },
                                            '& .MuiInput-underline:after': { borderBottomColor: 'white' }
                                        }}
                                    />
                                ) : (
                                    event?.title || 'Unknown Event'
                                )}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Chip
                                    label={getStatusLabel(event?.status)}
                                    color={getStatusColor(event?.status)}
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(255,255,255,0.9)',
                                        fontWeight: 'bold',
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={2}>
                        <Box display="flex" alignItems="center" gap={0.5} sx={{ bgcolor: 'rgba(255,255,255,0.1)', px: 1.5, py: 0.5, borderRadius: 2 }}>
                            <IconButton
                                onClick={handleToggleAutoCreate}
                                color={editData.shouldAutoCreateEvent ? "warning" : "success"}
                                size="small"
                                title={editData.shouldAutoCreateEvent ? "Disable Auto-Create" : "Enable Auto-Create"}
                                sx={{
                                    color: editData.shouldAutoCreateEvent ? 'orange' : '#4caf50',
                                    p: 0.5
                                }}
                            >
                                <PowerIcon />
                            </IconButton>
                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                                Auto Create: {editData.shouldAutoCreateEvent ? 'ON' : 'OFF'}
                            </Typography>
                        </Box>

                        {!isEditing ? (
                            <Button
                                onClick={() => setIsEditing(true)}
                                variant="contained"
                                color="primary"
                                startIcon={<EditIcon />}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                }}
                            >
                                Edit Event
                            </Button>
                        ) : (
                            <Button
                                onClick={onClose}
                                sx={{
                                    minWidth: 'auto',
                                    color: 'white',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                                }}
                            >
                                <Close />
                            </Button>
                        )}
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3, bgcolor: '#f5f7fa' }}>
                {loading && (
                    <Box display="flex" justifyContent="center" py={5}>
                        <Stack alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: 'primary.light', width: 48, height: 48 }}>
                                <Schedule className="animate-spin" />
                            </Avatar>
                            <Typography color="text.secondary">Loading event details...</Typography>
                        </Stack>
                    </Box>
                )}

                {error && (
                    <Box py={5}>
                        <Alert severity="error">{error}</Alert>
                    </Box>
                )}

                {!loading && !error && event && (
                    <>
                        {/* Description Card */}
                        {event.description && (
                            <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                                        <Description color="primary" />
                                        <Typography variant="h6" fontWeight="600">
                                            Description
                                        </Typography>
                                    </Box>
                                    {isEditing ? (
                                        <TextField
                                            multiline
                                            fullWidth
                                            minRows={2}
                                            variant="outlined"
                                            value={editData.description || ''}
                                            onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Update description..."
                                            size="small"
                                        />
                                    ) : (
                                        event.description
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                            {/* Event Information Card */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
                                    <CardContent>
                                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                                            <Event color="primary" />
                                            <Typography variant="h6" fontWeight="600">
                                                Event Information
                                            </Typography>
                                        </Box>

                                        <Stack spacing={2.5}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                                                    Event Type
                                                </Typography>
                                                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                                    {isEditing ? (
                                                        <TextField
                                                            select
                                                            size="small"
                                                            fullWidth
                                                            value={editData.eventTypeId || ''}
                                                            onChange={(e) => setEditData(prev => ({ ...prev, eventTypeId: e.target.value }))}
                                                        >
                                                            {eventTypes.map((type) => (
                                                                <MenuItem key={type.id} value={type.id}>
                                                                    {type.name}
                                                                </MenuItem>
                                                            ))}
                                                        </TextField>
                                                    ) : (
                                                        <Chip
                                                            label={event.eventType?.name || 'N/A'}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Box>
                                            </Box>

                                            <Divider />

                                            <Box>
                                                <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                                                    Maximum Participants
                                                </Typography>
                                                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                                    <People color="action" fontSize="small" />
                                                    <Typography variant="h6" fontWeight="600">
                                                        {isEditing ? (
                                                            <TextField
                                                                type="number"
                                                                size="small"
                                                                value={editData.maxParticipants || 0}
                                                                onChange={(e) => setEditData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
                                                                sx={{ width: 100 }}
                                                            />
                                                        ) : (
                                                            event.maxParticipants || 'Unlimited'
                                                        )}
                                                        {(event as any).totalParticipants !== undefined && (
                                                            <Typography
                                                                component="span"
                                                                variant="body2"
                                                                color="text.secondary"
                                                                sx={{ ml: 1, fontWeight: 'normal' }}
                                                            >
                                                                ({(event as any).totalParticipants} registered)
                                                            </Typography>
                                                        )}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Box>

                            {/* Schedule Card */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
                                    <CardContent>
                                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                                            <Schedule color="primary" />
                                            <Typography variant="h6" fontWeight="600">
                                                Event Schedule
                                            </Typography>
                                        </Box>

                                        <Stack spacing={2.5}>
                                            <Box>
                                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                    <CalendarToday color="action" fontSize="small" />
                                                    <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                                                        Start Time
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body1" fontWeight="500" sx={{ ml: 4 }}>
                                                    {isEditing ? (
                                                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                            <DateTimePicker
                                                                value={editData.startAt ? new Date(editData.startAt) : null}
                                                                onChange={(date) => setEditData(prev => ({ ...prev, startAt: date || '' }))}
                                                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                                            />
                                                        </LocalizationProvider>
                                                    ) : (
                                                        event.startAt ? format(new Date(event.startAt), 'PPpp') : 'N/A'
                                                    )}
                                                </Typography>
                                            </Box>

                                            <Divider />

                                            <Box>
                                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                    <AccessTime color="action" fontSize="small" />
                                                    <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                                                        Registration Opens
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body1" fontWeight="500" sx={{ ml: 4 }}>
                                                    {isEditing ? (
                                                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                            <DateTimePicker
                                                                value={editData.registrationOpensAt ? new Date(editData.registrationOpensAt) : null}
                                                                onChange={(date) => setEditData(prev => ({ ...prev, registrationOpensAt: date || '' }))}
                                                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                                            />
                                                        </LocalizationProvider>
                                                    ) : (
                                                        event.registrationOpensAt ? format(new Date(event.registrationOpensAt), 'PPpp') : 'N/A'
                                                    )}
                                                </Typography>
                                            </Box>

                                            <Box>
                                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                    <LockClock color="action" fontSize="small" />
                                                    <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                                                        Registration Closes
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body1" fontWeight="500" sx={{ ml: 4 }}>
                                                    {isEditing ? (
                                                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                            <DateTimePicker
                                                                value={editData.registrationClosesAt ? new Date(editData.registrationClosesAt) : null}
                                                                onChange={(date) => setEditData(prev => ({ ...prev, registrationClosesAt: date || '' }))}
                                                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                                            />
                                                        </LocalizationProvider>
                                                    ) : (
                                                        event.registrationClosesAt ? format(new Date(event.registrationClosesAt), 'PPpp') : 'N/A'
                                                    )}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Box>
                        </Box>
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f5f7fa', justifyContent: 'space-between' }}>
                <Box>
                    {isEditing ? (
                        <Button
                            onClick={() => setIsEditing(false)}
                            variant="outlined"
                            color="inherit"
                            disabled={saving}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                        >
                            Cancel
                        </Button>
                    ) : (
                        <Button
                            onClick={onClose}
                            variant="text"
                            color="primary"
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                        >
                            Close
                        </Button>
                    )}
                </Box>
                {isEditing && (
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        color="primary"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        sx={{ borderRadius: 2, px: 3, textTransform: 'none', fontWeight: 600 }}
                    >
                        Save Changes
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default EventDetailsDialog;
