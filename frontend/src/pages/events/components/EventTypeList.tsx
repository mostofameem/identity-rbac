import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  PowerSettingsNew as PowerIcon,
} from '@mui/icons-material';
import { EventType } from '../types/event.types';
import EventTypeForm from './EventTypeForm';
import EventTypeDetailsDialog from './EventTypeDetailsDialog';
import { eventTypeService } from '../services/eventService';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import type { DataTableColumn } from '../../../components/DataTable';
import StatusChip from '../../../components/StatusChip';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { useSnackbar } from '../../../context/SnackbarContext';

const COLUMNS: DataTableColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' },
];

type PendingAction =
  | { kind: 'delete'; eventType: EventType }
  | { kind: 'toggle'; eventType: EventType };

const EventTypeList: React.FC = () => {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const snackbar = useSnackbar();

  const fetchEventTypes = useCallback(async () => {
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
      snackbar.error(error.message || 'Failed to fetch event types. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, snackbar]);

  useEffect(() => {
    fetchEventTypes();
  }, [fetchEventTypes]);

  const handleOpen = (eventType?: EventType) => {
    setSelectedEventType(eventType || null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setDetailsOpen(false);
    setSelectedEventType(null);
  };

  const handleOpenDetails = (eventType: EventType) => {
    setSelectedEventType(eventType);
    setDetailsOpen(true);
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
      snackbar.success(selectedEventType ? 'Event type updated' : 'Event type created');
    } catch (error: any) {
      console.error('Error saving event type:', error);
      snackbar.error(error.message || 'Failed to save event type. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await eventTypeService.deleteEventType(id);
      await fetchEventTypes();
      snackbar.success('Event type deleted');
    } catch (error: any) {
      console.error('Error deleting event type:', error);
      snackbar.error(error.message || 'Failed to delete event type. Please try again.');
      throw error;
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const newStatus = currentStatus ? 'INACTIVE' : 'ACTIVE';
    await eventTypeService.changeEventTypeStatus(id, newStatus);
    await fetchEventTypes();
    snackbar.success(currentStatus ? 'Event type deactivated' : 'Event type activated');
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const renderRow = (eventType: EventType) => (
    <>
      <TableCell>
        <Typography variant="body2" fontWeight={600}>
          {eventType.name}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {eventType.description || 'No description'}
        </Typography>
      </TableCell>
      <TableCell>
        <StatusChip status={eventType.isActive ? 'ACTIVE' : 'INACTIVE'} />
      </TableCell>
      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
        <Tooltip title="Settings & details">
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDetails(eventType);
            }}
            size="small"
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={eventType.isActive ? 'Deactivate' : 'Activate'}>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setPending({ kind: 'toggle', eventType });
            }}
            color={eventType.isActive ? 'warning' : 'success'}
            size="small"
          >
            <PowerIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setPending({ kind: 'delete', eventType });
            }}
            color="error"
            size="small"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </>
  );

  return (
    <Box>
      <PageHeader
        title="Event Types"
        subtitle="Manage event types"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
            Add Event Type
          </Button>
        }
      />

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <DataTable
          columns={COLUMNS}
          rows={eventTypes}
          rowKey={(eventType) => eventType.id}
          renderRow={renderRow}
          loading={loading}
          skeletonRows={rowsPerPage > 8 ? 8 : rowsPerPage}
          emptyTitle="No event types found"
          emptyDescription="Create an event type to start auto-creating scheduled events."
          onRowClick={handleOpenDetails}
          page={page}
          rowsPerPage={rowsPerPage}
          count={total}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Paper>

      <EventTypeForm
        open={open}
        onClose={handleClose}
        onSave={handleSave}
        eventType={selectedEventType}
      />

      <EventTypeDetailsDialog
        open={detailsOpen}
        onClose={() => {
          handleClose();
          fetchEventTypes();
        }}
        eventType={selectedEventType}
      />

      <ConfirmDialog
        open={pending?.kind === 'delete'}
        onClose={() => setPending(null)}
        onConfirm={() => handleDelete((pending as { kind: 'delete'; eventType: EventType }).eventType.id)}
        title="Delete event type?"
        message={`This will permanently remove "${(pending as { kind: 'delete'; eventType: EventType } | null)?.eventType?.name ?? ''}". This action cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
      />

      <ConfirmDialog
        open={pending?.kind === 'toggle'}
        onClose={() => setPending(null)}
        onConfirm={async () => {
          if (pending?.kind === 'toggle') {
            try {
              await handleToggleStatus(pending.eventType.id, pending.eventType.isActive);
            } catch (error: any) {
              console.error('Error toggling event type status:', error);
              snackbar.error(error.message || 'Failed to update status. Please try again.');
              throw error;
            }
          }
        }}
        title={pending?.eventType.isActive ? 'Deactivate event type?' : 'Activate event type?'}
        message={
          pending?.eventType.isActive
            ? 'New events of this type will no longer be created automatically.'
            : 'Events of this type will resume being created on schedule.'
        }
        confirmLabel={pending?.eventType.isActive ? 'Deactivate' : 'Activate'}
      />
    </Box>
  );
};

export default EventTypeList;
