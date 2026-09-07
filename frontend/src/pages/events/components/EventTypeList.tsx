import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  IconButton,
  Paper,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  PowerSettingsNew as PowerIcon,
} from '@mui/icons-material';
import { EventType } from '../types/event.types';
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

type PendingAction = { kind: 'toggle'; eventType: EventType };

const EventTypeList: React.FC = () => {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
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

  const handleClose = () => {
    setDetailsOpen(false);
    setSelectedEventType(null);
  };

  const handleOpenDetails = (eventType: EventType) => {
    setSelectedEventType(eventType);
    setDetailsOpen(true);
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
      </TableCell>
    </>
  );

  return (
    <Box>
      <PageHeader
        title="Event Types"
        subtitle="Manage event types"
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
          emptyDescription="Event types can only be updated, not created from here."
          onRowClick={handleOpenDetails}
          page={page}
          rowsPerPage={rowsPerPage}
          count={total}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Paper>

      <EventTypeDetailsDialog
        open={detailsOpen}
        onClose={() => {
          handleClose();
          fetchEventTypes();
        }}
        eventType={selectedEventType}
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
