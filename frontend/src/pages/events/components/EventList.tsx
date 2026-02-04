import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Chip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  PowerSettingsNew as PowerIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import type { Event as EventType } from '../types/event.types';
import EventForm from './EventForm';
import EventDetailsDialog from './EventDetailsDialog';
import { eventService } from '../services/eventService';

const EventList: React.FC = () => {
  const [events, setEvents] = useState<EventType[]>([]);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [viewEvent, setViewEvent] = useState<EventType | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTitle, setSearchTitle] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await eventService.getEvents({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTitle || undefined,
        status: selectedStatus || undefined,
      });
      setEvents(response.data || []);
      setTotal(response.total || 0);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      alert(error.message || 'Failed to fetch events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTitle, selectedStatus]);

  useEffect(() => {
    fetchEvents();
  }, [page, rowsPerPage, selectedStatus, fetchEvents]);

  // Debounced search for title
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 0) {
        setPage(0);
      } else {
        fetchEvents();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTitle, page, fetchEvents]);

  const handleStatusChange = (event: any) => {
    setSelectedStatus(event.target.value);
    setPage(0);
  };

  const handleOpen = (event?: EventType) => {
    setSelectedEvent(event || null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedEvent(null);
  };

  const handleOpenDetails = (event: EventType) => {
    setViewEvent(event);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setViewEvent(null);
  };

  const handleSave = async (eventData: Partial<EventType>) => {
    try {
      if (selectedEvent) {
        await eventService.updateEvent(selectedEvent.id, eventData);
      } else {
        await eventService.createEvent(eventData);
      }
      await fetchEvents();
      handleClose();
    } catch (error: any) {
      console.error('Error saving event:', error);
      alert(error.message || 'Failed to save event. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventService.deleteEvent(id);
        await fetchEvents();
      } catch (error: any) {
        console.error('Error deleting event:', error);
        alert(error.message || 'Failed to delete event. Please try again.');
      }
    }
  };

  const handleToggleStatus = async (event: EventType) => {
    const currentStatus = (event.status || '').toUpperCase();
    const isCurrentlyActive = event.isActive !== undefined ? event.isActive : (currentStatus === 'ACTIVE' || currentStatus === 'ONGOING');
    const newStatus: any = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
    const confirmMessage = `Are you sure you want to ${isCurrentlyActive ? 'deactivate' : 'activate'} this event?`;

    if (window.confirm(confirmMessage)) {
      try {
        await eventService.changeEventStatus(event.id, newStatus);
        await fetchEvents();
      } catch (error: any) {
        console.error('Error toggling event status:', error);
        alert(error.message || 'Failed to toggle status. Please try again.');
      }
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
        <Typography variant="h4" component="h1">
          Events
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Create Event
        </Button>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Search by Name"
          variant="outlined"
          size="small"
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
          sx={{ minWidth: 250 }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
          }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="status-filter-label">Filter by Status</InputLabel>
          <Select
            labelId="status-filter-label"
            id="status-filter"
            value={selectedStatus}
            label="Filter by Status"
            onChange={handleStatusChange}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="ONGOING">Ongoing</MenuItem>
            <MenuItem value="UPCOMING">Upcoming</MenuItem>
            <MenuItem value="RECENT">Recent</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>Reg. Closes</TableCell>
                <TableCell>Participants</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No events found
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {event.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={event.eventType?.name || 'N/A'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(event.startAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      {new Date(event.registrationClosesAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {(event as any).totalParticipants || 0} / {event.maxParticipants || '∞'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={event.status || 'Active'}
                        color={
                          event.status === 'active' || event.status === 'ONGOING'
                            ? 'success'
                            : event.status === 'upcoming' || event.status === 'UPCOMING'
                              ? 'info'
                              : event.status === 'RECENT'
                                ? 'primary'
                                : 'default'
                        }
                        sx={
                          event.status === 'INACTIVE'
                            ? { bgcolor: 'grey.700', color: 'white' }
                            : {}
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleOpenDetails(event)} color="info">
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleToggleStatus(event)}
                        color={(event.isActive !== undefined ? event.isActive : (((event.status || '') as string).toUpperCase() === 'ACTIVE' || ((event.status || '') as string).toUpperCase() === 'ONGOING')) ? 'warning' : 'success'}
                        size="small"
                        title={(event.isActive !== undefined ? event.isActive : (((event.status || '') as string).toUpperCase() === 'ACTIVE' || ((event.status || '') as string).toUpperCase() === 'ONGOING')) ? 'Deactivate' : 'Activate'}
                      >
                        <PowerIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(event.id)} color="error">
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

      <EventForm
        open={open}
        onClose={handleClose}
        onSave={handleSave}
        event={selectedEvent}
      />

      <EventDetailsDialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        event={viewEvent}
      />
    </Container>
  );
};

export default EventList;
