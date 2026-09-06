import React, { useState, useEffect, ChangeEvent, SyntheticEvent } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextFieldProps,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,

  FormHelperText,
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Chip,
  Autocomplete,
  SelectChangeEvent,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Event as EventIcon } from '@mui/icons-material';
import { Event, EventType } from '../types/event.types';
import { eventService, eventTypeService } from '../services/eventService';
import { brandGradient } from '../../../theme/theme';

interface EventFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (event: Partial<Event>) => void;
  event?: Event | null;
}

const EventForm: React.FC<EventFormProps> = ({ open, onClose, onSave, event }) => {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<Event>>({
    title: '',
    description: '',
    startAt: new Date(),
    registrationOpensAt: new Date(),
    registrationClosesAt: new Date(new Date().setHours(new Date().getHours() + 1)),
    maxParticipants: 0,
    eventTypeId: '',
    settings: {},
  });

  useEffect(() => {
    if (event) {
      setFormData({
        ...event,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        startAt: new Date(),
        registrationOpensAt: new Date(),
        registrationClosesAt: new Date(new Date().setHours(new Date().getHours() + 1)),
        maxParticipants: 0,
        eventTypeId: '',
        settings: {},
      });
    }
  }, [event, open]);

  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        setLoading(true);
        const response = await eventTypeService.getEventTypes({ page: 1, limit: 100 });
        setEventTypes(response.data);
      } catch (error) {
        console.error('Error fetching event types:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventTypes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (!name) return;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is edited
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSelectChange = (event: SelectChangeEvent<unknown>) => {
    const { name, value } = event.target;
    if (!name) return;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is edited
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleDateChange = (name: string, date: Date | null): void => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        [name]: date,
      }));
    }
  };

  const handleSettingChange = (key: string, value: string | boolean | number | null) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value,
      },
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.eventTypeId) {
      newErrors.eventTypeId = 'Event type is required';
    }

    if (!formData.startAt) {
      newErrors.startAt = 'Start date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (validate()) {
      onSave(formData);
    }
  };

  const selectedEventType = eventTypes.find((et: EventType) => et.id === formData.eventTypeId);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle
          sx={{
            background: brandGradient,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <EventIcon fontSize="small" />
          {event ? 'Edit Event' : 'Create New Event'}
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: 'background.default' }}>
          <div className="space-y-5">
            {/* General Information Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80">
              <Typography variant="subtitle1" className="font-semibold mb-3 text-slate-700">
                General Information
              </Typography>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12">
                  <TextField
                    fullWidth
                    label="Event Title"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleChange}
                    error={!!errors.title}
                    helperText={errors.title}
                    required
                    slotProps={{ htmlInput: { placeholder: "e.g., Weekly Team Sync" } }}
                  />
                </div>

                <div className="col-span-12 md:col-span-6">
                  <FormControl fullWidth error={!!errors.eventTypeId}>
                    <InputLabel>Event Type *</InputLabel>
                    <Select
                      name="eventTypeId"
                      value={formData.eventTypeId || ''}
                      onChange={handleSelectChange}
                      label="Event Type *"
                      disabled={loading}
                    >
                      {eventTypes.map((type) => (
                        <MenuItem key={type.id} value={type.id}>
                          {type.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.eventTypeId && (
                      <FormHelperText>{errors.eventTypeId}</FormHelperText>
                    )}
                  </FormControl>
                </div>

                <div className="col-span-12 md:col-span-6 flex items-center">
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
                    label="Event Active"
                    className="ml-2"
                  />
                </div>

                <div className="col-span-12">
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    multiline
                    minRows={3}
                    placeholder="Describe the event details..."
                  />
                </div>
              </div>
            </div>

            {/* Logistics Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80">
              <Typography variant="subtitle1" className="font-semibold mb-3 text-slate-700">
                Logistics
              </Typography>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12">
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Participants"
                    name="maxParticipants"
                    value={formData.maxParticipants || ''}
                    onChange={handleChange}
                    slotProps={{ htmlInput: { min: 0 } }}
                  />
                </div>
              </div>
            </div>

            {/* Schedule Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80">
              <Typography variant="subtitle1" className="font-semibold mb-3 text-slate-700">
                Event Schedule
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 md:col-span-6">
                    <DateTimePicker
                      label="Starts On *"
                      value={formData.startAt ? new Date(formData.startAt) : null}
                      onChange={(date) => handleDateChange('startAt', date)}
                      slotProps={{
                        textField: { fullWidth: true, error: !!errors.startAt, helperText: errors.startAt }
                      }}
                    />
                  </div>
                </div>
              </LocalizationProvider>
            </div>

            {/* Registration Window Section */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80">
              <Typography variant="subtitle1" className="font-semibold mb-3 text-slate-700">
                Registration Window
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 md:col-span-6">
                    <DateTimePicker
                      label="Registration Opens *"
                      value={formData.registrationOpensAt ? new Date(formData.registrationOpensAt) : null}
                      onChange={(date) => handleDateChange('registrationOpensAt', date)}
                      slotProps={{
                        textField: { fullWidth: true }
                      }}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <DateTimePicker
                      label="Registration Closes *"
                      value={formData.registrationClosesAt ? new Date(formData.registrationClosesAt) : null}
                      onChange={(date) => handleDateChange('registrationClosesAt', date)}
                      minDateTime={formData.registrationOpensAt ? new Date(formData.registrationOpensAt) : undefined}
                      slotProps={{
                        textField: { fullWidth: true }
                      }}
                    />
                  </div>
                </div>
              </LocalizationProvider>
            </div>

            {/* Dynamic Event Settings Section */}
            {selectedEventType && selectedEventType.settings && selectedEventType.settings.length > 0 && (
              <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100">
                <Typography variant="subtitle1" className="font-semibold mb-3 text-indigo-800">
                  {selectedEventType.name} Configuration
                </Typography>
                <div className="grid grid-cols-12 gap-4">
                  {selectedEventType.settings.map((setting) => (
                    <div key={setting.id} className="col-span-12 md:col-span-6">
                      <Typography variant="body2" className="mb-1 text-slate-600 font-medium">
                        {setting.key} {setting.isRequired && <span className="text-red-500">*</span>}
                      </Typography>
                      {renderSettingInput(
                        setting,
                        formData.settings?.[setting.key] || setting.defaultValue || '',
                        (value) => handleSettingChange(setting.key, value)
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={onClose} color="inherit" variant="text">
            Cancel
          </Button>
          <Button type="submit" color="primary" variant="contained">
            {event ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

interface SettingOption {
  value: string;
  label: string;
}

interface Setting {
  id: string;
  key: string;
  dataType: string;
  defaultValue?: string;
  options?: SettingOption[];
}

const renderSettingInput = (
  setting: Setting,
  value: string | boolean | number | null,
  onChange: (value: string) => void
) => {
  switch (setting.dataType) {
    case 'boolean':
      return (
        <Switch
          checked={value === 'true' || value === true}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange(e.target.checked.toString())
          }
          color="primary"
        />
      );
    case 'number':
      return (
        <TextField
          type="number"
          value={value || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
        />
      );
    case 'date':
      return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateTimePicker
            value={value ? new Date(value as string) : null}
            onChange={(date: Date | null) => date && onChange(date.toISOString())}
            slotProps={{
              textField: {
                fullWidth: true,
                variant: "outlined",
                size: "small"
              }
            }}
          />
        </LocalizationProvider>
      );
    case 'select':
      return (
        <FormControl fullWidth variant="outlined" size="small">
          <Select
            value={value || ''}
            onChange={(e: any) => onChange(e.target.value)}
          >
            {setting.options?.map((option: SettingOption) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    default:
      return (
        <TextField
          value={value || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          fullWidth
          variant="outlined"
          size="small"
          type={setting.dataType === 'password' ? 'password' : 'text'}
        />
      );
  }
};

export default EventForm;
