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
    TextField,
    Switch,
    FormControlLabel,
    IconButton
} from '@mui/material';
import {
    Settings as SettingsIcon,
    Description,
    Close,
    PowerSettingsNew as PowerIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Schedule,
    Info
} from '@mui/icons-material';
import { EventType } from '../types/event.types';
import { eventTypeService } from '../services/eventService';

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
    const [settings, setSettings] = useState({
        autoCreateAt: '09:00',
        autoEventIntervalInMinutes: 1440,
        isActive: false,
    });
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsError, setSettingsError] = useState<string | null>(null);

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
                const autoCreateAt = data.AutoCreateAt || data.autoCreateAt || '09:00';
                const intervalValue = data.AutoEventIntervalInMinutes !== undefined
                    ? data.AutoEventIntervalInMinutes
                    : (data.autoEventIntervalInMinutes || 1440);
                const activeValue = data.IsActive !== undefined ? data.IsActive : (data.isActive === true);

                setSettings({
                    autoCreateAt: autoCreateAt,
                    autoEventIntervalInMinutes: typeof intervalValue === 'string' ? parseInt(intervalValue) : intervalValue,
                    isActive: activeValue === true || activeValue === 'true',
                });
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
                autoEventIntervalInMinutes: settings.autoEventIntervalInMinutes,
                isActive: settings.isActive,
            });

            // Update local state
            setEventType(prev => prev ? { ...prev, ...editData } : null);
            setIsEditing(false);
        } catch (err: any) {
            console.error('Error updating event type:', err);
            alert(err.message || 'Failed to save changes');
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
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }
            }}
        >
            <DialogTitle sx={{ pb: 2, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ color: 'white' }}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                            <SettingsIcon sx={{ fontSize: 32 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: 'white', mb: 0.5 }}>
                                {eventType?.name || 'Unknown Type'}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Chip
                                    label={eventType?.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    color={eventType?.isActive ? 'success' : 'default'}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.9)', fontWeight: 'bold' }}
                                />
                            </Box>
                        </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={2}>
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
                                Edit Settings
                            </Button>
                        ) : (
                            <IconButton
                                onClick={onClose}
                                sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                            >
                                <Close />
                            </IconButton>
                        )}
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3, bgcolor: '#f5f7fa' }}>
                <Stack spacing={3}>
                    {/* Description Card */}
                    <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <Description color="primary" />
                                <Typography variant="h6" fontWeight="600">
                                    Description
                                </Typography>
                            </Box>
                            <Typography variant="body1" color="text.secondary">
                                {eventType?.description || 'No description provided.'}
                            </Typography>
                        </CardContent>
                    </Card>

                    {/* Auto-Creation Settings Card */}
                    <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Schedule color="primary" />
                                    <Typography variant="h6" fontWeight="600">
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

                            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={3}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                                        Create At (HH:MM)
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        disabled={!isEditing}
                                        value={settings.autoCreateAt}
                                        onChange={(e) => setSettings(prev => ({ ...prev, autoCreateAt: e.target.value }))}
                                        size="small"
                                        placeholder="09:00"
                                        sx={{ mt: 0.5 }}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                                        Interval (Minutes)
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        disabled={!isEditing}
                                        value={settings.autoEventIntervalInMinutes}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            autoEventIntervalInMinutes: parseInt(e.target.value) || 1440
                                        }))}
                                        size="small"
                                        sx={{ mt: 0.5 }}
                                    />
                                </Box>
                            </Box>

                            <Box mt={2} display="flex" alignItems="start" gap={1} p={1.5} bgcolor="#eff6ff" borderRadius={1}>
                                <Info color="info" sx={{ fontSize: 18, mt: 0.2 }} />
                                <Typography variant="caption" color="blue" sx={{ lineHeight: 1.4 }}>
                                    When enabled, events of this type will be created automatically based on the schedule above.
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Stack>
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

export default EventTypeDetailsDialog;
