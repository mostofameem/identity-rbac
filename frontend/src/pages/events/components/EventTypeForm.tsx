import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
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
import { EventType, Recurrence, RECURRENCE_OPTIONS, recurrenceLabel } from '../types/event.types';
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

  const [eventTypeSettings, setEventTypeSettings] = useState<{
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
        recurrence: 'DAILY',
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
        const recurrenceValue = data.Recurrence || data.recurrence || 'DAILY';
        const activeValue = data.IsActive !== undefined ? data.IsActive : (data.isActive === true);

        setEventTypeSettings({
          autoCreateAt: autoCreateAt,
          recurrence: (RECURRENCE_OPTIONS.some((option) => option.value === recurrenceValue)
            ? recurrenceValue
            : 'DAILY') as Recurrence,
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
        recurrence: eventTypeSettings.recurrence,
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
          width: '500px',
          maxWidth: '95vw',
          borderRadius: 3,
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{
          p: 2.5,
          background: eventType
            ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
            : 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}>
          {eventType ? <Settings /> : <AutoAwesome />}
          <Typography variant="h6" fontWeight="700">
            {eventType ? 'Edit Event Type' : 'New Event Type'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, bgcolor: '#ffffff' }}>
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Basic Info Section */}
            <Box>
              <Typography variant="overline" color="text.secondary" fontWeight="700" sx={{ mb: 1, display: 'block' }}>
                Basic Information
              </Typography>
              <TextField
                fullWidth
                label="Event Type Name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                size="small"
                variant="outlined"
                required
                sx={{ mb: 1.5 }}
              />
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                size="small"
                variant="outlined"
                multiline
                rows={2}
              />
            </Box>

            {/* Settings Section */}
            {eventType?.id && (
              <Box sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: '#f8fafc',
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Schedule fontSize="small" color="primary" />
                    <Typography variant="subtitle2" fontWeight="700">
                      Auto-Creation Settings
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={eventTypeSettings.isActive}
                        onChange={(e) => setEventTypeSettings(prev => ({ ...prev, isActive: e.target.checked }))}
                        color="primary"
                      />
                    }
                    label={<Typography variant="caption" fontWeight="600">Active</Typography>}
                    labelPlacement="start"
                    sx={{ m: 0 }}
                  />
                </Box>

                {settingsError && (
                  <Alert severity="error" sx={{ mb: 1.5, py: 0 }} onClose={() => setSettingsError(null)}>
                    {settingsError}
                  </Alert>
                )}

                {settingsSuccess && (
                  <Alert severity="success" sx={{ mb: 1.5, py: 0 }}>
                    Saved!
                  </Alert>
                )}

                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                  <TextField
                    label="Create At (HH:MM)"
                    value={eventTypeSettings.autoCreateAt}
                    onChange={(e) => setEventTypeSettings(prev => ({ ...prev, autoCreateAt: e.target.value }))}
                    size="small"
                    placeholder="09:00"
                    fullWidth
                  />
                  <TextField
                    select
                    label="Repeats"
                    value={eventTypeSettings.recurrence}
                    onChange={(e) => setEventTypeSettings(prev => ({
                      ...prev,
                      recurrence: e.target.value as Recurrence
                    }))}
                    size="small"
                    fullWidth
                  >
                    {RECURRENCE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Box mt={1.5} display="flex" alignItems="start" gap={1}>
                  <Info color="info" sx={{ fontSize: 16, mt: 0.3 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', lineHeight: 1.2 }}>
                    Events will be created automatically at the specified time, repeating {recurrenceLabel(eventTypeSettings.recurrence).toLowerCase()}.
                  </Typography>
                </Box>
              </Box>
            )}

            {!eventType?.id && (
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fff7ed', border: '1px dashed', borderColor: 'warning.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info color="warning" fontSize="small" />
                <Typography variant="caption" fontWeight="500">
                  Save to enable auto-creation settings.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 2.5, bgcolor: '#ffffff', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            onClick={onClose}
            color="inherit"
            variant="text"
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={settingsLoading}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              boxShadow: 'none',
              '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
            }}
            startIcon={settingsLoading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {settingsLoading ? 'Saving...' : (eventType ? 'Save Changes' : 'Create Type')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EventTypeForm;
