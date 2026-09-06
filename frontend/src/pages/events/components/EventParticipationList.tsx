import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Divider,
  Paper,
  TableCell,
  TextField,
  Typography,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import type { Event as EventType, ParticipationDetail } from '../types/event.types';
import { eventService } from '../services/eventService';
import PageHeader from '../../../components/PageHeader';
import DataTable from '../../../components/DataTable';
import type { DataTableColumn } from '../../../components/DataTable';
import StatusChip from '../../../components/StatusChip';
import FieldLabel from '../../../components/FieldLabel';
import { useSnackbar } from '../../../context/SnackbarContext';
import { useDebouncedValue } from '../../../hooks';

interface EventParticipationListProps {
  event: EventType;
  onBack: () => void;
}

const COLUMNS: DataTableColumn[] = [
  { key: 'email', label: 'User Email' },
  { key: 'guests', label: 'Guest Count' },
  { key: 'status', label: 'Status' },
  { key: 'joined', label: 'Joined At' },
  { key: 'remarks', label: 'Remarks' },
];

const EventParticipationList: React.FC<EventParticipationListProps> = ({ event, onBack }) => {
  const [participants, setParticipants] = useState<ParticipationDetail[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');

  const snackbar = useSnackbar();
  const debouncedEmail = useDebouncedValue(searchEmail, 500);

  const fetchParticipants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await eventService.getEventParticipants(event.id, {
        page: page + 1,
        limit: rowsPerPage,
        email: debouncedEmail || undefined,
      });
      setParticipants(response.data || []);
      setTotal(response.total || 0);
    } catch (error: any) {
      console.error('Error fetching participants:', error);
      snackbar.error(error.message || 'Failed to fetch participants. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [event.id, page, rowsPerPage, debouncedEmail, snackbar]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Reset to the first page when a new search settles
  useEffect(() => {
    setPage(0);
  }, [debouncedEmail]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const renderRow = (participant: ParticipationDetail) => (
    <>
      <TableCell>
        <Typography variant="body2" fontWeight={600}>
          {participant.userEmail}
        </Typography>
      </TableCell>
      <TableCell>{participant.guestCount}</TableCell>
      <TableCell>
        <StatusChip status={participant.status} />
      </TableCell>
      <TableCell>{new Date(participant.createdAt).toLocaleString()}</TableCell>
      <TableCell>{participant.remarks || '—'}</TableCell>
    </>
  );

  const summary = [
    { label: 'Event title', value: event.title, bold: true },
    { label: 'Event type', value: event.eventType?.name || 'N/A' },
    { label: 'Start time', value: new Date(event.startAt).toLocaleString() },
    { label: 'Status', value: <StatusChip status={event.status || 'ACTIVE'} /> },
    { label: 'Total participants', value: event.totalParticipants || 0, bold: true, primary: true },
    { label: 'Maximum spots', value: event.maxParticipants || 'Unlimited' },
  ];

  return (
    <Box>
      <PageHeader title="Participation List" subtitle={event.title} onBack={onBack} />

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            Event details
          </Typography>
          <Divider sx={{ mb: 2.5 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {summary.map((item) => (
              <Box key={item.label}>
                <FieldLabel>{item.label}</FieldLabel>
                <Typography
                  variant="body1"
                  sx={{
                    mt: 0.5,
                    fontWeight: item.bold ? 700 : 400,
                    color: item.primary ? 'primary.main' : 'text.primary',
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          label="Search by email"
          variant="outlined"
          size="small"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          sx={{ minWidth: 300 }}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1, fontSize: 20 }} />,
            },
          }}
        />
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <DataTable
          columns={COLUMNS}
          rows={participants}
          rowKey={(_, index) => index}
          renderRow={renderRow}
          loading={loading}
          skeletonRows={rowsPerPage > 8 ? 8 : rowsPerPage}
          emptyTitle="No participants found"
          emptyDescription="Nobody has joined this event yet, or no one matches your search."
          page={page}
          rowsPerPage={rowsPerPage}
          count={total}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[20, 50, 100]}
        />
      </Paper>
    </Box>
  );
};

export default EventParticipationList;
