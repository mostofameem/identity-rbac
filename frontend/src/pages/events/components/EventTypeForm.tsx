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
  SelectChangeEvent
} from '@mui/material';
import { EventType } from '../types/event.types';

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

  useEffect(() => {
    if (eventType) {
      setFormData({
        ...eventType,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        isActive: true,
        requiresApproval: false,
        maxParticipants: 0,
        settings: [],
      });
    }
  }, [eventType, open]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{eventType ? 'Edit Event Type' : 'Create New Event Type'}</DialogTitle>
        <DialogContent dividers>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 md:col-span-6">
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
              />

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
            </div>

            <div className="col-span-12 md:col-span-6">
              <Typography variant="subtitle2" gutterBottom>
                Default Settings
              </Typography>

              <Box display="flex" gap={2} mb={2}>
                <TextField
                  label="Setting Key"
                  value={settingKey}
                  onChange={(e) => setSettingKey(e.target.value)}
                  size="small"
                  fullWidth
                />

                <TextField
                  select
                  label="Type"
                  value={settingType}
                  onChange={(e) => setSettingType(e.target.value)}
                  size="small"
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="string">String</MenuItem>
                  <MenuItem value="number">Number</MenuItem>
                  <MenuItem value="boolean">Boolean</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                </TextField>

                <Button
                  variant="outlined"
                  onClick={addSetting}
                  disabled={!settingKey.trim()}
                >
                  Add
                </Button>
              </Box>

              <Box display="flex" alignItems="center" mb={1}>
                <Typography variant="body2" color="textSecondary" sx={{ flexGrow: 1 }}>
                  Required
                </Typography>
                <Switch
                  checked={settingRequired}
                  onChange={(e) => setSettingRequired(e.target.checked)}
                  size="small"
                />
              </Box>

              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Current Settings
                </Typography>

                {formData.settings && formData.settings.length > 0 ? (
                  <Box>
                    {formData.settings.map((setting) => (
                      <Chip
                        key={setting.id}
                        label={`${setting.key} (${setting.dataType}${setting.isRequired ? ', required' : ''})`}
                        onDelete={() => removeSetting(setting.id)}
                        color="primary"
                        variant="outlined"
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No settings added yet.
                  </Typography>
                )}
              </Box>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" color="primary" variant="contained">
            {eventType ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EventTypeForm;
