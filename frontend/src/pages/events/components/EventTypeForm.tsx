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
  FormHelperText,
  Box,
  Typography,
  Chip,
  MenuItem,
  Select,
  SelectChangeEvent,
  Card,
  CardContent,
  Divider,
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [settingKey, setSettingKey] = useState('');
  const [settingValue, setSettingValue] = useState('');
  const [settingType, setSettingType] = useState('string');
  const [settingRequired, setSettingRequired] = useState(false);

  // Event Type Settings API state
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
      const settings = await eventTypeService.getEventTypeSettings(eventTypeId);
      if (settings && settings.length > 0) {
        const setting = settings[0];
        setEventTypeSettings({
          autoCreateAt: setting.value || '09:00',
          autoEventIntervalInMinutes: parseInt(setting.value) || 1440,
          isActive: setting.isRequired || false,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : Number(value),
    }));
  };

  const addSetting = () => {
    if (!settingKey.trim()) return;

    const newSetting = {
      id: `temp-${Date.now()}`,
      key: settingKey,
      value: settingValue,
      dataType: settingType,
      isRequired: settingRequired,
    };

    setFormData(prev => ({
      ...prev,
      settings: [...(prev.settings || []), newSetting],
    }));

    // Reset form
    setSettingKey('');
    setSettingValue('');
    setSettingType('string');
    setSettingRequired(false);
  };

  const removeSetting = (id: string) => {
    setFormData(prev => ({
      ...prev,
      settings: (prev.settings || []).filter(setting => setting.id !== id),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Event type name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveSettings = async () => {
    if (!eventType?.id) {
      setSettingsError('Please save the event type first before configuring settings');
      return;
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(eventTypeSettings.autoCreateAt)) {
      setSettingsError('Please enter time in HH:MM format (e.g., 09:00)');
      return;
    }

    try {
      setSettingsLoading(true);
      setSettingsError(null);
      setSettingsSuccess(false);

      await eventTypeService.createEventTypeSetting({
        eventTypeId: eventType.id,
        key: 'autoCreateAt',
        value: eventTypeSettings.autoCreateAt,
        dataType: 'string',
        isRequired: eventTypeSettings.isActive,
      });

      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error saving event type settings:', error);
      setSettingsError(error.message || 'Failed to save settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      onSave(formData);
    }
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
            <div className="col-span-12 md:col-span-6">
              <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight="600">
                    Basic Information
                  </Typography>
                  <TextField
                    fullWidth
                    label="Name *"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    margin="normal"
                    error={!!errors.name}
                    helperText={errors.name}
                    required
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    margin="normal"
                    multiline
                    rows={3}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    type="number"
                    label="Maximum Participants"
                    name="maxParticipants"
                    value={formData.maxParticipants || ''}
                    onChange={handleNumberChange}
                    margin="normal"
                    inputProps={{ min: 0 }}
                    sx={{ mb: 2 }}
                  />

                  <Divider sx={{ my: 2 }} />

                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isActive || false}
                          onChange={(e) =>
                            setFormData(prev => ({ ...prev, isActive: e.target.checked }))
                          }
                          name="isActive"
                          color="primary"
                        />
                      }
                      label="Active"
                    />
                    <Box mt={2}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.requiresApproval || false}
                            onChange={(e) =>
                              setFormData(prev => ({ ...prev, requiresApproval: e.target.checked }))
                            }
                            name="requiresApproval"
                            color="primary"
                          />
                        }
                        label="Requires Approval"
                      />
                      <FormHelperText>
                        If enabled, participants will need approval to join events of this type.
                      </FormHelperText>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </div>

            <div className="col-span-12 md:col-span-6">
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

                    <Box mt={2}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSaveSettings}
                        disabled={settingsLoading}
                        fullWidth
                        startIcon={settingsLoading ? <CircularProgress size={20} /> : <Settings />}
                      >
                        {settingsLoading ? 'Saving...' : 'Save Settings'}
                      </Button>
                    </Box>

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
            sx={{ borderRadius: 2, textTransform: 'none', px: 3, fontWeight: 600 }}
          >
            {eventType ? 'Update Event Type' : 'Create Event Type'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EventTypeForm;
