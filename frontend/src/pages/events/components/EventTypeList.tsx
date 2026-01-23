import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  IconButton,
  Typography,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  PowerSettingsNew as PowerIcon
} from '@mui/icons-material';
import { EventType } from '../types/event.types';
import EventTypeForm from './EventTypeForm';
import { eventTypeService } from '../services/eventService';

const EventTypeList: React.FC = () => {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchEventTypes = async () => {
    try {
      setLoading(true);
      const response = await eventTypeService.getEventTypes({
        page: page + 1,
        limit: rowsPerPage,
      });
      setEventTypes(response.data || []);
      setTotal(response.total || 0);
    } catch (error: any) {
      console.error('Error fetching event types:', error);
      alert(error.message || 'Failed to fetch event types. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventTypes();
  }, [page, rowsPerPage]);

  const handleOpen = (eventType?: EventType) => {
    setSelectedEventType(eventType || null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedEventType(null);
  };

  const handleSave = async (eventTypeData: Partial<EventType>) => {
    try {
      if (selectedEventType) {
        // Backend doesn't have a general update endpoint for event types.
        // Settings are updated internally within the EventTypeForm.
        // We just need to refresh the list to show any potential changes (like status).
        console.log('Event type settings updated, refreshing list...');
      } else {
        await eventTypeService.createEventType(eventTypeData);
      }
      await fetchEventTypes();
      handleClose();
    } catch (error: any) {
      console.error('Error saving event type:', error);
      alert(error.message || 'Failed to save event type. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event type?')) {
      try {
        await eventTypeService.deleteEventType(id);
        await fetchEventTypes();
      } catch (error: any) {
        console.error('Error deleting event type:', error);
        alert(error.message || 'Failed to delete event type. Please try again.');
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const newStatus = currentStatus ? 'INACTIVE' : 'ACTIVE';
    try {
      await eventTypeService.changeEventTypeStatus(id, newStatus);
      await fetchEventTypes();
    } catch (error: any) {
      console.error('Error toggling event type status:', error);
      alert(error.message || 'Failed to update status. Please try again.');
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Event Types
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Event Type
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Active</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Loading...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : eventTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No event types found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                eventTypes.map((eventType) => (
                  <TableRow key={eventType.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {eventType.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {eventType.description || 'No description'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={eventType.isActive ? 'Active' : 'Inactive'}
                        color={eventType.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => handleOpen(eventType)}
                        color="secondary"
                        size="small"
                        title="Settings"
                      >
                        <SettingsIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleToggleStatus(eventType.id, eventType.isActive)}
                        color={eventType.isActive ? "warning" : "success"}
                        size="small"
                        title={eventType.isActive ? "Deactivate" : "Activate"}
                      >
                        <PowerIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleOpen(eventType)}
                        color="primary"
                        size="small"
                        title="Edit"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(eventType.id)}
                        color="error"
                        size="small"
                        title="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <EventTypeForm
        open={open}
        onClose={handleClose}
        onSave={handleSave}
        eventType={selectedEventType}
      />
    </Container>
  );
};

export default EventTypeList;
