import React, { useState, useEffect } from 'react';
import {
    Button,
    Typography,
    Box,
    Divider,
    Chip,
    Card,
    CardContent,
    IconButton,
    Alert,
    CircularProgress,
    Stack,
    MenuItem,
    TextField,
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
    Comment as CommentIcon,
    LocalFireDepartment as FireIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import type { Event as EventType, EventType as EventTypeDetail } from '../types/event.types';
import { eventService, eventTypeService } from '../services/eventService';
import { format } from 'date-fns';
import DetailDialogShell from '../../../components/DetailDialogShell';
import StatusChip from '../../../components/StatusChip';
import FieldLabel from '../../../components/FieldLabel';
import { useSnackbar } from '../../../context/SnackbarContext';

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

    const snackbar = useSnackbar();

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

    const handleToggleAutoCreate = async () => {
        if (!event?.id) return;
        try {
            const newStatus = event.shouldAutoCreateEvent ? 'INACTIVE' : 'ACTIVE';
            await eventService.updateShouldAutoCreateEvent(event.id, newStatus);
            await fetchEventDetails(event.id);
        } catch (err: any) {
            console.error('Error toggling auto-recreate:', err);
            snackbar.error(err.message || 'Failed to update auto-recreate status');
        }
    };

    const handleSave = async () => {
        if (!event?.id) return;
        try {
            setSaving(true);
            await eventService.updateEvent(event.id, editData);
            await fetchEventDetails(event.id);
            setIsEditing(false);
            snackbar.success('Event updated');
        } catch (err: any) {
            console.error('Error updating event:', err);
            snackbar.error(err.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    const isHot = editData.shouldAutoCreateEvent;

    return (
        <DetailDialogShell
            open={open}
            onClose={onClose}
            maxWidth="lg"
            icon={<Event />}
            title={isEditing ? (
                <TextField
                    variant="standard"
                    value={editData.title || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                    fullWidth
                    sx={{
                        input: { color: 'white', fontSize: '1.25rem', fontWeight: 700 },
                        '& .MuiInput-underline:before': { borderBottomColor: 'rgba(255,255,255,0.3)' },
                        '& .MuiInput-underline:after': { borderBottomColor: 'white' }
                    }}
                />
            ) : (
                event?.title || 'Unknown Event'
            )}
            subtitle={
                <StatusChip
                    status={event?.status || 'UNKNOWN'}
                    glass
                    sx={{ mt: 0.5 }}
                />
            }
            headerActions={
                <>
                    <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.15)',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.2)',
                        }}
                    >
                        <IconButton
                            onClick={handleToggleAutoCreate}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.1)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                            }}
                            title={isHot ? 'Disable Hot Event' : 'Enable Hot Event'}
                        >
                            <PowerIcon
                                sx={{
                                    color: isHot ? (theme) => theme.palette.success.light : (theme) => theme.palette.error.light,
                                    fontSize: 18
                                }}
                            />
                        </IconButton>
                        <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.5px', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                            <FireIcon sx={{ fontSize: 14 }} /> Hot Event
                        </Typography>
                    </Box>

                    {!isEditing ? (
                        <Button
                            onClick={() => setIsEditing(true)}
                            variant="contained"
                            startIcon={<EditIcon />}
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.2)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.32)' }
                            }}
                        >
                            Edit
                        </Button>
                    ) : (
                        <IconButton
                            onClick={onClose}
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.15)',
                                color: 'white',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
                            }}
                            size="small"
                        >
                            <Close />
                        </IconButton>
                    )}
                </>
            }
            footerActions={
                <>
                    <Box>
                        {isEditing ? (
                            <Button onClick={() => setIsEditing(false)} variant="outlined" color="inherit" disabled={saving}>
                                Cancel
                            </Button>
                        ) : (
                            <Button onClick={onClose} variant="text">
                                Close
                            </Button>
                        )}
                    </Box>
                    {isEditing && (
                        <Button
                            onClick={handleSave}
                            variant="contained"
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                            sx={{ px: 3 }}
                        >
                            Save Changes
                        </Button>
                    )}
                </>
            }
            loading={loading}
        >
            {error && (
                <Box py={4}>
                    <Alert severity="error">{error}</Alert>
                </Box>
            )}

            {!error && event && (
                <>
                    {/* Description Card */}
                    {event.description && (
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <Description color="primary" />
                                    <Typography variant="h6">
                                        Description
                                    </Typography>
                                </Box>
                                {isEditing ? (
                                    <TextField
                                        multiline
                                        fullWidth
                                        minRows={2}
                                        value={editData.description || ''}
                                        onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Update description..."
                                        size="small"
                                    />
                                ) : (
                                    <Typography variant="body1" color="text.secondary">
                                        {event.description}
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Remarks Card */}
                    {event.remarks && (
                        <Card sx={{ mb: 3, borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <CommentIcon color="primary" />
                                    <Typography variant="h6" color="primary">
                                        Remarks
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ pl: 4 }}>
                                    {event.remarks}
                                </Typography>
                            </CardContent>
                        </Card>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                        {/* Event Information Card */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                                        <Event color="primary" />
                                        <Typography variant="h6">
                                            Event Information
                                        </Typography>
                                    </Box>

                                    <Stack spacing={2.5}>
                                        <Box>
                                            <FieldLabel>Event Type</FieldLabel>
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
                                            <FieldLabel>Maximum Participants</FieldLabel>
                                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                                <People color="action" fontSize="small" />
                                                <Typography variant="h6">
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
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                                        <Schedule color="primary" />
                                        <Typography variant="h6">
                                            Event Schedule
                                        </Typography>
                                    </Box>

                                    <Stack spacing={2.5}>
                                        <Box>
                                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                <CalendarToday color="action" fontSize="small" />
                                                <FieldLabel>Start Time</FieldLabel>
                                            </Box>
                                            <Box sx={{ ml: 4 }}>
                                                {isEditing ? (
                                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                        <DateTimePicker
                                                            value={editData.startAt ? new Date(editData.startAt) : null}
                                                            onChange={(date) => setEditData(prev => ({ ...prev, startAt: date || '' }))}
                                                            slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                                        />
                                                    </LocalizationProvider>
                                                ) : (
                                                    <Typography variant="body1">
                                                        {event.startAt ? format(new Date(event.startAt), 'PPpp') : 'N/A'}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>

                                        <Divider />

                                        <Box>
                                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                <AccessTime color="action" fontSize="small" />
                                                <FieldLabel>Registration Opens</FieldLabel>
                                            </Box>
                                            <Box sx={{ ml: 4 }}>
                                                {isEditing ? (
                                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                        <DateTimePicker
                                                            value={editData.registrationOpensAt ? new Date(editData.registrationOpensAt) : null}
                                                            onChange={(date) => setEditData(prev => ({ ...prev, registrationOpensAt: date || '' }))}
                                                            slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                                        />
                                                    </LocalizationProvider>
                                                ) : (
                                                    <Typography variant="body1">
                                                        {event.registrationOpensAt ? format(new Date(event.registrationOpensAt), 'PPpp') : 'N/A'}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>

                                        <Box>
                                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                <LockClock color="action" fontSize="small" />
                                                <FieldLabel>Registration Closes</FieldLabel>
                                            </Box>
                                            <Box sx={{ ml: 4 }}>
                                                {isEditing ? (
                                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                        <DateTimePicker
                                                            value={editData.registrationClosesAt ? new Date(editData.registrationClosesAt) : null}
                                                            onChange={(date) => setEditData(prev => ({ ...prev, registrationClosesAt: date || '' }))}
                                                            slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                                        />
                                                    </LocalizationProvider>
                                                ) : (
                                                    <Typography variant="body1">
                                                        {event.registrationClosesAt ? format(new Date(event.registrationClosesAt), 'PPpp') : 'N/A'}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Box>
                    </Box>
                </>
            )}
        </DetailDialogShell>
    );
};

export default EventDetailsDialog;
