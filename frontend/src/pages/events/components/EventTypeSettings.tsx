import React, { useState, useEffect } from 'react';

import { SelectChangeEvent } from '@mui/material/Select';
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,

  FormControlLabel,
  Switch,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
} from '@mui/material';
import { Save as SaveIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { EventTypeSetting } from '../types/event.types';
import { eventTypeService } from '../services/eventService';

interface EventTypeSettingsProps {
  eventTypeId?: string;
}

const EventTypeSettings: React.FC<EventTypeSettingsProps> = ({ eventTypeId }) => {
  const [settings, setSettings] = useState<EventTypeSetting[]>([]);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [newSetting, setNewSetting] = useState<Partial<EventTypeSetting>>({
    key: 'autoCreateAt',
    value: '09:00',
    dataType: 'string',
    isRequired: true,
  });

  // Fetch event types for the dropdown
  const fetchEventTypes = async () => {
    try {
      const response = await eventTypeService.getEventTypes({ page: 1, limit: 100 });
      setEventTypes(response.data);
      if (response.data.length > 0 && !eventTypeId) {
        setSelectedEventType(response.data[0].id);
      } else if (eventTypeId) {
        setSelectedEventType(eventTypeId);
      }
    } catch (error) {
      console.error('Error fetching event types:', error);
    }
  };

  // Fetch settings for the selected event type
  const fetchSettings = async () => {
    if (!selectedEventType) return;

    setLoading(true);
    try {
      const response = await eventTypeService.getEventTypeSettings(selectedEventType);

      // If the backend returns a single object (which it usually does for settings)
      // we need to wrap it into an array for the table mapping to work correctly.
      if (response && typeof response === 'object' && !Array.isArray(response)) {
        setSettings([{
          id: response.id.toString(),
          key: 'autoCreateAt',
          value: response.autoCreateAt || '09:00',
          dataType: 'string',
          isRequired: response.isActive,
          eventTypeId: response.eventTypeId.toString(),
        }]);
      } else {
        setSettings(response || []);
      }
    } catch (error) {

      console.error('Error fetching event type settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventTypes();
  }, []);

  useEffect(() => {
    if (selectedEventType) {
      fetchSettings();
    }
  }, [selectedEventType]);

  const handleEventTypeChange = (event: SelectChangeEvent<string>) => {
    setSelectedEventType(event.target.value as string);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewSetting({
      ...newSetting,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleAddSetting = async () => {
    if (!selectedEventType || !newSetting.value) return;

    try {
      const settingToAdd = {
        eventTypeId: selectedEventType,
        autoCreateAt: newSetting.value || '09:00',
        autoEventIntervalInMinutes: 1440, // Default to 24 hours
        isActive: newSetting.isRequired !== false,
      };

      await eventTypeService.createEventTypeSetting(settingToAdd);
      setNewSetting({ key: 'autoCreateAt', value: '09:00', dataType: 'string', isRequired: true });
      await fetchSettings();
    } catch (error: any) {
      console.error('Error adding setting:', error);
      alert(error.message || 'Failed to save event type settings. Please ensure time is in HH:MM format.');
    }
  };

  const handleDeleteSetting = async (id: string) => {
    alert('Delete functionality is not supported by the backend. Please contact administrator.');
  };

  const handleUpdateSetting = async (id: string, updatedSetting: Partial<EventTypeSetting>) => {
    try {
      // Find the existing logic-specific values
      const currentSetting = settings.find(s => s.id === id);
      if (!currentSetting) return;

      const autoCreateAt = updatedSetting.key === 'autoCreateAt' ? (updatedSetting.value || '09:00') : currentSetting.value;
      const isActive = updatedSetting.isRequired !== undefined ? updatedSetting.isRequired : currentSetting.isRequired;

      const payload = {
        eventTypeId: selectedEventType,
        autoCreateAt: autoCreateAt,
        autoEventIntervalInMinutes: 1440, // 24 hours default
        isActive: isActive,
      };

      await eventTypeService.updateEventTypeSetting(payload);

      await fetchSettings();
    } catch (error: any) {
      console.error('Error updating setting:', error);
      alert(error.message || 'Failed to update setting. Please ensure time is in HH:MM format.');
    }
  };

  return (

    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Event Type Settings
        </Typography>

        <div className="grid grid-cols-12 gap-3 items-center">
          <div className="col-span-12 md:col-span-6">
            <FormControl fullWidth variant="outlined" margin="normal">
              <InputLabel>Select Event Type</InputLabel>
              <Select
                value={selectedEventType}
                onChange={handleEventTypeChange}
                label="Select Event Type"
                disabled={!!eventTypeId}
              >
                {eventTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </div>

        {selectedEventType && (
          <>
            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Event Type Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Configure automatic event creation settings for this event type.
            </Typography>

            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-12 md:col-span-4">
                <TextField
                  fullWidth
                  label="Auto Create At (HH:MM)"
                  name="value"
                  value={newSetting.value}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small"
                  placeholder="09:00"
                  helperText="Time in 24-hour format (e.g., 09:00, 14:30)"
                  required
                />
              </div>

              <div className="col-span-12 md:col-span-4">
                <TextField
                  fullWidth
                  type="number"
                  label="Interval (Minutes)"
                  name="interval"
                  value={1440}
                  variant="outlined"
                  size="small"
                  helperText="Default: 1440 (24 hours)"
                  disabled
                />
              </div>

              <div className="col-span-12 md:col-span-3">
                <FormControlLabel
                  control={
                    <Switch
                      checked={newSetting.isRequired !== false}
                      onChange={(e) => setNewSetting({ ...newSetting, isRequired: e.target.checked })}
                      name="isActive"
                      color="primary"
                    />
                  }
                  label="Active"
                />
              </div>

              <div className="col-span-12 md:col-span-1">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleAddSetting}
                  disabled={!newSetting.value}
                  fullWidth
                >
                  Save
                </Button>
              </div>
            </div>
          </>
        )}
      </Paper>

      {selectedEventType && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Current Settings
          </Typography>

          {loading ? (
            <Typography>Loading settings...</Typography>
          ) : settings.length === 0 ? (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                No event type settings found for this event type. Please create one below.
              </Alert>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Auto Create At</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {settings.map((setting) => (
                    <TableRow key={setting.id} hover>
                      <TableCell>
                        <TextField
                          value={setting.value}
                          onChange={(e) =>
                            handleUpdateSetting(setting.id, {
                              ...setting,
                              value: e.target.value
                            })
                          }
                          variant="outlined"
                          size="small"
                          placeholder="HH:MM"
                          helperText="Time in 24-hour format"
                          sx={{ minWidth: 150 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={setting.isRequired}
                          onChange={(e) =>
                            handleUpdateSetting(setting.id, {
                              ...setting,
                              isRequired: e.target.checked
                            })
                          }
                          color="primary"
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          {setting.isRequired ? 'Active' : 'Inactive'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleDeleteSetting(setting.id)}
                          color="error"
                          size="small"
                          disabled
                          title="Delete not supported"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default EventTypeSettings;
