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
    key: '',
    value: '',
    dataType: 'string',
    isRequired: false,
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
      setSettings(response);
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
    if (!newSetting.key || !selectedEventType) return;

    try {
      const settingToAdd = {
        ...newSetting,
        eventTypeId: selectedEventType,
      };

      await eventTypeService.createEventTypeSetting(settingToAdd);
      setNewSetting({ key: '', value: '', dataType: 'string', isRequired: false });
      fetchSettings();
    } catch (error) {
      console.error('Error adding setting:', error);
    }
  };

  const handleDeleteSetting = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this setting?')) return;

    try {
      await eventTypeService.deleteEventTypeSetting(id);
      fetchSettings();
    } catch (error) {
      console.error('Error deleting setting:', error);
    }
  };

  const handleUpdateSetting = async (id: string, updatedSetting: Partial<EventTypeSetting>) => {
    try {
      await eventTypeService.updateEventTypeSetting(id, updatedSetting);
      fetchSettings();
    } catch (error) {
      console.error('Error updating setting:', error);
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
              Add New Setting
            </Typography>

            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-12 md:col-span-3">
                <TextField
                  fullWidth
                  label="Key"
                  name="key"
                  value={newSetting.key}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small"
                />
              </div>

              <div className="col-span-12 md:col-span-3">
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>Data Type</InputLabel>
                  <Select
                    name="dataType"
                    value={newSetting.dataType}
                    onChange={(e) => setNewSetting({ ...newSetting, dataType: e.target.value as 'string' | 'number' | 'boolean' | 'object' | 'date' | 'select' | 'array' | undefined })}
                    label="Data Type"
                  >
                    <MenuItem value="string">String</MenuItem>
                    <MenuItem value="number">Number</MenuItem>
                    <MenuItem value="boolean">Boolean</MenuItem>
                    <MenuItem value="date">Date</MenuItem>
                    <MenuItem value="array">Array</MenuItem>
                    <MenuItem value="object">Object</MenuItem>
                  </Select>
                </FormControl>
              </div>

              <div className="col-span-12 md:col-span-3">
                <TextField
                  fullWidth
                  label="Value"
                  name="value"
                  value={newSetting.value}
                  onChange={handleInputChange}
                  variant="outlined"
                  size="small"
                />
              </div>

              <div className="col-span-12 md:col-span-2">
                <FormControlLabel
                  control={
                    <Switch
                      checked={newSetting.isRequired || false}
                      onChange={(e) => setNewSetting({ ...newSetting, isRequired: e.target.checked })}
                      name="isRequired"
                      color="primary"
                    />
                  }
                  label="Required"
                />
              </div>

              <div className="col-span-12 md:col-span-1">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddSetting}
                  disabled={!newSetting.key}
                  fullWidth
                >
                  Add
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
            <Typography>No settings found for this event type.</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Key</TableCell>
                    <TableCell>Data Type</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Required</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {settings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell>{setting.key}</TableCell>
                      <TableCell>{setting.dataType}</TableCell>
                      <TableCell>
                        {setting.dataType === 'boolean' ? (
                          <Switch
                            checked={setting.value === 'true'}
                            onChange={(e) =>
                              handleUpdateSetting(setting.id, {
                                ...setting,
                                value: e.target.checked ? 'true' : 'false'
                              })
                            }
                            color="primary"
                          />
                        ) : (
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
                            fullWidth
                          />
                        )}
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
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleDeleteSetting(setting.id)}
                          color="error"
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
