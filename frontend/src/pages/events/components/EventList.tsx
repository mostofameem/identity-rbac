import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Grid,
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
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
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

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEvents({
        page: page + 1,
        limit: rowsPerPage,
      });
      setEvents(response.data || []);
      setTotal(response.total || 0);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      alert(error.message || 'Failed to fetch events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, rowsPerPage]);

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
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleOpenDetails(event)} color="info">
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton onClick={() => handleOpen(event)} color="primary">
                        <EditIcon />
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
