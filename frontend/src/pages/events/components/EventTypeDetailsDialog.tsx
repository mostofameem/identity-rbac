import React, { useState, useEffect } from 'react';
import {
    Button,
    Typography,
    Box,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    Stack,
    TextField,
    MenuItem,
    Switch,
    FormControlLabel,
    IconButton
} from '@mui/material';
import {
    Settings as SettingsIcon,
    Description,
    Close,
    Edit as EditIcon,
    Save as SaveIcon,
    Schedule,
} from '@mui/icons-material';
import { EventType, Recurrence, RECURRENCE_OPTIONS, recurrenceLabel } from '../types/event.types';
import { eventTypeService } from '../services/eventService';
import AutoCreateTimePicker, { toAutoCreateTime } from './AutoCreateTimePicker';
import DetailDialogShell from '../../../components/DetailDialogShell';
import StatusChip from '../../../components/StatusChip';
import FieldLabel from '../../../components/FieldLabel';
import { useSnackbar } from '../../../context/SnackbarContext';

interface EventTypeDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    eventType: EventType | null;
}

const EventTypeDetailsDialog: React.FC<EventTypeDetailsDialogProps> = ({ open, onClose, eventType: initialEventType }) => {
    const [eventType, setEventType] = useState<EventType | null>(initialEventType);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<EventType>>({});
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<{
        autoCreateAt: string;
        recurrence: Recurrence;
        isActive: boolean;
    }>({
        autoCreateAt: '09:00',
        recurrence: 'DAILY',
        isActive: false,
    });
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsError, setSettingsError] = useState<string | null>(null);
    const [noSettings, setNoSettings] = useState(false);

    const snackbar = useSnackbar();

    useEffect(() => {
        if (open && initialEventType?.id) {
            fetchEventTypeDetails(initialEventType.id);
            fetchEventTypeSettings(initialEventType.id);
        }
    }, [open, initialEventType]);

    const fetchEventTypeDetails = async (id: string) => {
        try {
            setLoading(true);
            const data = await eventTypeService.getEventType(id);
            setEventType(data);
            setEditData(data);
        } catch (error: any) {
            console.error('Error fetching event type details:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEventTypeSettings = async (id: string) => {
        try {
            setSettingsLoading(true);
            const data = await eventTypeService.getEventTypeSettings(id);
            if (data) {
                const autoCreateAt = toAutoCreateTime(data.AutoCreateAt || data.autoCreateAt);
                const recurrenceValue = data.Recurrence || data.recurrence || 'DAILY';
                const activeValue = data.IsActive !== undefined ? data.IsActive : (data.isActive === true);

                setSettings({
                    autoCreateAt: autoCreateAt,
                    recurrence: (RECURRENCE_OPTIONS.some((option) => option.value === recurrenceValue)
                        ? recurrenceValue
                        : 'DAILY') as Recurrence,
                    isActive: activeValue === true || activeValue === 'true',
                });
                setNoSettings(false);
            } else {
                setNoSettings(true);
            }
        } catch (error: any) {
            console.error('Error fetching event type settings:', error);
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!eventType?.id) return;
        try {
            setSaving(true);

            // Save auto-creation settings
            await eventTypeService.createEventTypeSetting({
                eventTypeId: eventType.id,
                autoCreateAt: settings.autoCreateAt,
                recurrence: settings.recurrence,
                isActive: settings.isActive,
            });

            // Update local state
            setEventType(prev => prev ? { ...prev, ...editData } : null);
            setIsEditing(false);
            snackbar.success('Settings saved');
        } catch (err: any) {
            console.error('Error updating event type:', err);
            snackbar.error(err.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!eventType?.id) return;
        try {
            const newStatus = eventType.isActive ? 'INACTIVE' : 'ACTIVE';
            await eventTypeService.changeEventTypeStatus(eventType.id, newStatus);
            setEventType(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
        } catch (error: any) {
            console.error('Error toggling status:', error);
        }
    };

    if (!open) return null;

    return (
        <DetailDialogShell
            open={open}
            onClose={onClose}
            maxWidth="sm"
            icon={<SettingsIcon />}
            title={eventType?.name || 'Unknown Type'}
            subtitle={
                <StatusChip
                    status={eventType?.isActive ? 'ACTIVE' : 'INACTIVE'}
                    glass
                    sx={{ mt: 0.5 }}
                />
            }
            headerActions={
                !isEditing ? (
                    <Button
                        onClick={() => setIsEditing(true)}
                        variant="contained"
                        startIcon={<EditIcon />}
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.32)' }
                        }}
                    >
                        Edit Settings
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
                )
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
            <Stack spacing={3}>
                {/* Description Card */}
                <Card>
                    <CardContent>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <Description color="primary" />
                            <Typography variant="h6">
                                Description
                            </Typography>
                        </Box>
                        <Typography variant="body1" color="text.secondary">
                            {eventType?.description || 'No description provided.'}
                        </Typography>
                    </CardContent>
                </Card>

                {/* Auto-Creation Settings Card */}
                <Card>
                    <CardContent>
                        {noSettings && !isEditing && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                No event settings provided. Please click "Edit Settings" to create one.
                            </Alert>
                        )}
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Schedule color="primary" />
                                <Typography variant="h6">
                                    Auto-Creation Settings
                                </Typography>
                            </Box>
                            <FormControlLabel
                                control={
                                    <Switch
                                        disabled={!isEditing}
                                        checked={settings.isActive}
                                        onChange={(e) => setSettings(prev => ({ ...prev, isActive: e.target.checked }))}
                                        color="primary"
                                    />
                                }
                                label={<Typography variant="body2" fontWeight="600">Active</Typography>}
                                labelPlacement="start"
                            />
                        </Box>

                        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={3}>
                            <Box>
                                <FieldLabel>Create At (HH:MM)</FieldLabel>
                                <Box sx={{ mt: 0.5 }}>
                                    <AutoCreateTimePicker
                                        fullWidth
                                        disabled={!isEditing}
                                        value={toAutoCreateTime(settings.autoCreateAt)}
                                        onChange={(value) => setSettings(prev => ({ ...prev, autoCreateAt: value }))}
                                    />
                                </Box>
                            </Box>
                            <Box>
                                <FieldLabel>Repeats</FieldLabel>
                                <TextField
                                    fullWidth
                                    select={isEditing}
                                    disabled={!isEditing}
                                    value={isEditing ? settings.recurrence : recurrenceLabel(settings.recurrence)}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        recurrence: e.target.value as Recurrence
                                    }))}
                                    size="small"
                                    sx={{ mt: 0.5 }}
                                >
                                    {RECURRENCE_OPTIONS.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Box>
                        </Box>

                        <Alert severity="info" icon={false} sx={{ mt: 2 }}>
                            When enabled, events of this type will be created automatically based on the schedule above.
                        </Alert>
                    </CardContent>
                </Card>
            </Stack>
        </DetailDialogShell>
    );
};

export default EventTypeDetailsDialog;
