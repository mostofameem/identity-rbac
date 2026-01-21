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
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
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
      setEventTypes(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Error fetching event types:', error);
      // Handle error
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
        await eventTypeService.updateEventType(selectedEventType.id, eventTypeData);
      } else {
        await eventTypeService.createEventType(eventTypeData);
      }
      fetchEventTypes();
      handleClose();
    } catch (error) {
      console.error('Error saving event type:', error);
      // Handle error
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event type?')) {
      try {
        await eventTypeService.deleteEventType(id);
        fetchEventTypes();
      } catch (error) {
        console.error('Error deleting event type:', error);
        // Handle error
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
                    Loading...
                  </TableCell>
                </TableRow>
              ) : eventTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No event types found
                  </TableCell>
                </TableRow>
              ) : (
                eventTypes.map((eventType) => (
                  <TableRow key={eventType.id}>
                    <TableCell>{eventType.name}</TableCell>
                    <TableCell>{eventType.description || 'N/A'}</TableCell>
                    <TableCell>{eventType.isActive ? 'Yes' : 'No'}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleOpen(eventType)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(eventType.id)}>
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
