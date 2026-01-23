import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Settings,
  Schedule,
  AutoAwesome,
  Info
} from '@mui/icons-material';
import { EventType } from '../types/event.types';
import { eventTypeService } from '../services/eventService';

interface EventTypeFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (eventType: Partial<EventType>) => void;
  eventType?: EventType | null;
}

const EventTypeForm: React.FC<EventTypeFormProps> = ({
  open,
  onClose,
  onSave,
  eventType,
}) => {
  const [formData, setFormData] = useState<Partial<EventType>>({
    name: '',
    description: '',
    isActive: true,
    requiresApproval: false,
    maxParticipants: 0,
    settings: [],
  });

  const [eventTypeSettings, setEventTypeSettings] = useState({
    autoCreateAt: '09:00',
    autoEventIntervalInMinutes: 1440, // 24 hours
    isActive: false,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  useEffect(() => {
    if (eventType) {
      setFormData({
        ...eventType,
      });
      // Fetch event type settings if editing
      if (eventType.id) {
        fetchEventTypeSettings(eventType.id);
      }
    } else {
      setFormData({
        name: '',
        description: '',
        isActive: true,
        requiresApproval: false,
        maxParticipants: 0,
        settings: [],
      });
      setEventTypeSettings({
        autoCreateAt: '09:00',
        autoEventIntervalInMinutes: 1440,
        isActive: false,
      });
    }
    setSettingsSuccess(false);
    setSettingsError(null);
  }, [eventType, open]);

  const fetchEventTypeSettings = async (eventTypeId: string) => {
    try {
      setSettingsLoading(true);
      const data = await eventTypeService.getEventTypeSettings(eventTypeId);
      console.log('Fetched settings data:', data);
      if (data) {
        // Handle both PascalCase (backend) and potential camelCase
        const autoCreateAt = data.AutoCreateAt || data.autoCreateAt || '09:00';
        const intervalValue = data.AutoEventIntervalInMinutes !== undefined
          ? data.AutoEventIntervalInMinutes
          : (data.autoEventIntervalInMinutes || 1440);
        const activeValue = data.IsActive !== undefined ? data.IsActive : (data.isActive === true);

        setEventTypeSettings({
          autoCreateAt: autoCreateAt,
          autoEventIntervalInMinutes: typeof intervalValue === 'string' ? parseInt(intervalValue) : intervalValue,
          isActive: activeValue === true || activeValue === 'true',
        });
      }
    } catch (error: any) {
      console.error('Error fetching event type settings:', error);
      // Don't show error if settings don't exist yet
      if (!error.message?.includes('not found')) {
        setSettingsError('Failed to load settings');
      }
    } finally {
      setSettingsLoading(false);
    }
  };

  const validate = (): boolean => {
    if (!formData.name?.trim()) {
      return false;
    }

    return true;
  };

  const handleSaveSettings = async (): Promise<boolean> => {
    if (!eventType?.id) {
      setSettingsError('Please save the event type first before configuring settings');
      return false;
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(eventTypeSettings.autoCreateAt)) {
      setSettingsError('Please enter time in HH:MM format (e.g., 09:00)');
      return false;
    }

    try {
      setSettingsLoading(true);
      setSettingsError(null);
      setSettingsSuccess(false);

      await eventTypeService.createEventTypeSetting({
        eventTypeId: eventType.id,
        autoCreateAt: eventTypeSettings.autoCreateAt,
        autoEventIntervalInMinutes: eventTypeSettings.autoEventIntervalInMinutes,
        isActive: eventTypeSettings.isActive,
      });

      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
      return true;
    } catch (error: any) {
      console.error('Error saving event type settings:', error);
      setSettingsError(error.message || 'Failed to save settings');
      return false;
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      // If we are editing, we also want to save the auto-creation settings
      if (eventType?.id) {
        const settingsSaved = await handleSaveSettings();
        if (!settingsSaved) return;
      }

      onSave(formData);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '650px',
          maxWidth: '95vw', // Ensure it doesn't overflow on small screens
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{
          pb: 2,
          background: eventType
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white'
        }}>
          <Typography variant="h5" fontWeight="bold">
            {eventType ? 'Edit Event Type' : 'Create New Event Type'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, bgcolor: '#f5f7fa' }}>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12">
              {/* Event Type Settings Configuration */}
              {eventType?.id && (
                <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2, border: '2px solid', borderColor: 'primary.main' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Settings color="primary" />
                      <Typography variant="h6" fontWeight="600">
                        Event Type Settings
                      </Typography>
                    </Box>

                    {settingsError && (
                      <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSettingsError(null)}>
                        {settingsError}
                      </Alert>
                    )}

                    {settingsSuccess && (
                      <Alert severity="success" sx={{ mb: 2 }}>
                        Settings saved successfully!
                      </Alert>
                    )}

                    <Box mb={2}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Schedule color="action" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight="600">
                          Auto Create At (HH:MM)
                        </Typography>
                      </Box>
                      <TextField
                        fullWidth
                        value={eventTypeSettings.autoCreateAt}
                        onChange={(e) => setEventTypeSettings(prev => ({ ...prev, autoCreateAt: e.target.value }))}
                        placeholder="09:00"
                        helperText="Time in 24-hour format when events should be auto-created"
                        sx={{ mb: 2 }}
                      />
                    </Box>

                    <Box mb={2}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <AutoAwesome color="action" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight="600">
                          Interval (Minutes)
                        </Typography>
                      </Box>
                      <TextField
                        fullWidth
                        type="number"
                        value={eventTypeSettings.autoEventIntervalInMinutes}
                        onChange={(e) => setEventTypeSettings(prev => ({
                          ...prev,
                          autoEventIntervalInMinutes: parseInt(e.target.value) || 1440
                        }))}
                        helperText="Default: 1440 (24 hours)"
                        sx={{ mb: 2 }}
                      />
                    </Box>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={eventTypeSettings.isActive}
                          onChange={(e) => setEventTypeSettings(prev => ({ ...prev, isActive: e.target.checked }))}
                          color="primary"
                        />
                      }
                      label="Enable Auto-Creation"
                    />

                    {/* Save settings button removed - merged with main update button */}

                    <Box mt={2} display="flex" alignItems="start" gap={1} sx={{ bgcolor: '#e3f2fd', p: 1.5, borderRadius: 1 }}>
                      <Info color="info" fontSize="small" sx={{ mt: 0.5 }} />
                      <Typography variant="caption" color="text.secondary">
                        Configure automatic event creation for this event type. Events will be created automatically at the specified time and interval.
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {!eventType?.id && (
                <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2, bgcolor: '#fff3e0' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Info color="warning" />
                      <Typography variant="subtitle2" fontWeight="600">
                        Event Type Settings
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Save the event type first to configure automatic event creation settings.
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f5f7fa' }}>
          <Button
            onClick={onClose}
            color="inherit"
            sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={settingsLoading}
            sx={{ borderRadius: 2, textTransform: 'none', px: 3, fontWeight: 600 }}
            startIcon={settingsLoading ? <CircularProgress size={20} /> : null}
          >
            {settingsLoading ? 'Saving...' : (eventType ? 'Update Event Type' : 'Create Event Type')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EventTypeForm;
