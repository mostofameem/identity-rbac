import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  IconButton,
  TableCell,
  TableRow,
  TextField,
  Typography,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Select,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  PowerSettingsNew as PowerIcon,
  Search as SearchIcon,
  LocalFireDepartment as FireIcon,
} from '@mui/icons-material';
import type { Event as EventType } from '../types/event.types';
import EventForm from './EventForm';
import EventDetailsDialog from './EventDetailsDialog';
import { eventService } from '../services/eventService';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import type { DataTableColumn } from '../../../components/DataTable';
import StatusChip from '../../../components/StatusChip';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { useSnackbar } from '../../../context/SnackbarContext';
import { useDebouncedValue } from '../../../hooks';

interface EventListProps {
  onEventClick?: (event: EventType) => void;
}

const COLUMNS: DataTableColumn[] = [
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'start', label: 'Start Time' },
  { key: 'closes', label: 'Reg. Closes' },
  { key: 'participants', label: 'Participants' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' },
];

type PendingAction =
  | { kind: 'delete'; event: EventType }
  | { kind: 'toggle'; event: EventType };

const EventList: React.FC<EventListProps> = ({ onEventClick }) => {
  const [events, setEvents] = useState<EventType[]>([]);

  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [viewEvent, setViewEvent] = useState<EventType | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTitle, setSearchTitle] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedAutoCreate, setSelectedAutoCreate] = useState('');
  const [pending, setPending] = useState<PendingAction | null>(null);

  const snackbar = useSnackbar();
  const debouncedSearch = useDebouncedValue(searchTitle, 500);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await eventService.getEvents({
        page: page + 1,
        limit: rowsPerPage,
        search: debouncedSearch || undefined,
        status: selectedStatus || undefined,
        shouldAutoCreate:
          selectedAutoCreate === '' ? undefined : selectedAutoCreate === 'true',
      });
      setEvents(response.data || []);
      setTotal(response.total || 0);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      snackbar.error(error.message || 'Failed to fetch events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, selectedStatus, selectedAutoCreate, snackbar]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Reset to the first page when a new search settles
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, selectedStatus, selectedAutoCreate]);

  const handleStatusChange = (event: any) => {
    setSelectedStatus(event.target.value);
  };

  const handleAutoCreateChange = (event: any) => {
    setSelectedAutoCreate(event.target.value);
  };

  // Event editing happens in the details dialog; the form is create-only
  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
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
      await eventService.createEvent(eventData);
      await fetchEvents();
      handleClose();
      snackbar.success('Event created');
    } catch (error: any) {
      console.error('Error saving event:', error);
      snackbar.error(error.message || 'Failed to save event. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await eventService.deleteEvent(id);
      await fetchEvents();
      snackbar.success('Event deleted');
    } catch (error: any) {
      console.error('Error deleting event:', error);
      snackbar.error(error.message || 'Failed to delete event. Please try again.');
      throw error; // keep the dialog open so the failure is visible
    }
  };

  const handleToggleStatus = async (event: EventType) => {
    const currentStatus = (event.status || '').toUpperCase();
    const isCurrentlyActive =
      event.isActive !== undefined
        ? event.isActive
        : currentStatus === 'ACTIVE' || currentStatus === 'ONGOING';
    const newStatus: any = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
    await eventService.changeEventStatus(event.id, newStatus);
    await fetchEvents();
    snackbar.success(isCurrentlyActive ? 'Event deactivated' : 'Event activated');
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const renderRow = (event: EventType) => {
    const currentStatus = (event.status || '').toUpperCase();
    const isCurrentlyActive =
      event.isActive !== undefined
        ? event.isActive
        : currentStatus === 'ACTIVE' || currentStatus === 'ONGOING';

    return (
      <>
        <TableCell>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="body2" fontWeight={600}>
              {event.title}
            </Typography>
            {event.shouldAutoCreateEvent && (
              <Tooltip title="Hot event — auto-created on schedule">
                <FireIcon fontSize="small" sx={{ color: 'warning.main' }} />
              </Tooltip>
            )}
          </Box>
        </TableCell>
        <TableCell>
          <Chip label={event.eventType?.name || 'N/A'} size="small" variant="outlined" />
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
          <StatusChip status={event.status || 'ACTIVE'} />
        </TableCell>
        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
          <Tooltip title="View details">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetails(event);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={isCurrentlyActive ? 'Deactivate' : 'Activate'}>
            <IconButton
              size="small"
              color={isCurrentlyActive ? 'warning' : 'success'}
              onClick={(e) => {
                e.stopPropagation();
                setPending({ kind: 'toggle', event });
              }}
            >
              <PowerIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                setPending({ kind: 'delete', event });
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </>
    );
  };

  return (
    <Box>
      <PageHeader
        title="Events"
        subtitle="Manage all events"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
            Create Event
          </Button>
        }
      />

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Search by name"
          variant="outlined"
          size="small"
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
          sx={{ minWidth: 250 }}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1, fontSize: 20 }} />,
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            id="status-filter"
            value={selectedStatus}
            label="Status"
            onChange={handleStatusChange}
          >
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="ONGOING">Ongoing</MenuItem>
            <MenuItem value="UPCOMING">Upcoming</MenuItem>
            <MenuItem value="RECENT">Recent</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="auto-create-filter-label">Auto-create</InputLabel>
          <Select
            labelId="auto-create-filter-label"
            id="auto-create-filter"
            value={selectedAutoCreate}
            label="Auto-create"
            onChange={handleAutoCreateChange}
          >
            <MenuItem value="">All events</MenuItem>
            <MenuItem value="true">Auto-created only</MenuItem>
            <MenuItem value="false">Manual only</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <DataTable
          columns={COLUMNS}
          rows={events}
          rowKey={(event) => event.id}
          renderRow={renderRow}
          loading={loading}
          skeletonRows={rowsPerPage > 8 ? 8 : rowsPerPage}
          emptyTitle="No events found"
          emptyDescription="Try adjusting your search or filters, or create a new event."
          onRowClick={onEventClick}
          page={page}
          rowsPerPage={rowsPerPage}
          count={total}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Paper>

      <EventForm
        open={open}
        onClose={handleClose}
        onSave={handleSave}
      />

      <EventDetailsDialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        event={viewEvent}
      />

      <ConfirmDialog
        open={pending?.kind === 'delete'}
        onClose={() => setPending(null)}
        onConfirm={() => handleDelete((pending as { kind: 'delete'; event: EventType }).event.id)}
        title="Delete event?"
        message={`This will permanently remove "${(pending as { kind: 'delete'; event: EventType } | null)?.event?.title ?? ''}". This action cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
      />

      <ConfirmDialog
        open={pending?.kind === 'toggle'}
        onClose={() => setPending(null)}
        onConfirm={async () => {
          if (pending?.kind === 'toggle') {
            try {
              await handleToggleStatus(pending.event);
            } catch (error: any) {
              console.error('Error toggling event status:', error);
              snackbar.error(error.message || 'Failed to toggle status. Please try again.');
              throw error;
            }
          }
        }}
        title={
          pending?.kind === 'toggle' && (pending.event.isActive !== undefined
            ? pending.event.isActive
            : (pending.event.status || '').toUpperCase() === 'ACTIVE' || (pending.event.status || '').toUpperCase() === 'ONGOING')
            ? 'Deactivate event?'
            : 'Activate event?'
        }
        message="The event's visibility to participants will change accordingly."
        confirmLabel={pending?.kind === 'toggle' && (pending.event.isActive !== undefined
          ? pending.event.isActive
          : (pending.event.status || '').toUpperCase() === 'ACTIVE' || (pending.event.status || '').toUpperCase() === 'ONGOING')
          ? 'Deactivate'
          : 'Activate'}
      />
    </Box>
  );
};

export default EventList;
