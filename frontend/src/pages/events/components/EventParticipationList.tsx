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
    TextField,
    Card,
    CardContent,
    Divider,
} from '@mui/material';

import {
    ArrowBack as ArrowBackIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import type { Event as EventType, ParticipationDetail } from '../types/event.types';
import { eventService } from '../services/eventService';

interface EventParticipationListProps {
    event: EventType;
    onBack: () => void;
}

const EventParticipationList: React.FC<EventParticipationListProps> = ({ event, onBack }) => {
    const [participants, setParticipants] = useState<ParticipationDetail[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchEmail, setSearchEmail] = useState('');

    const fetchParticipants = useCallback(async () => {
        try {
            setLoading(true);
            const response = await eventService.getEventParticipants(event.id, {
                page: page + 1,
                limit: rowsPerPage,
                email: searchEmail || undefined,
            });
            setParticipants(response.data || []);
            setTotal(response.total || 0);
        } catch (error: any) {
            console.error('Error fetching participants:', error);
            alert(error.message || 'Failed to fetch participants. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [event.id, page, rowsPerPage, searchEmail]);

    useEffect(() => {
        fetchParticipants();
    }, [page, rowsPerPage, fetchParticipants]);

    // Debounced search for email
    useEffect(() => {
        const timer = setTimeout(() => {
            if (page !== 0) {
                setPage(0);
            } else {
                fetchParticipants();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchEmail, page, fetchParticipants]);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Container maxWidth="lg">
            <Box display="flex" alignItems="center" mb={3}>
                <IconButton onClick={onBack} sx={{ mr: 2 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" component="h1">
                    Participation List
                </Typography>
            </Box>

            <Card sx={{ mb: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                        Event Details
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Event Title
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                                {event.title}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Event Type
                            </Typography>
                            <Typography variant="body1">
                                {event.eventType?.name || 'N/A'}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Start Time
                            </Typography>
                            <Typography variant="body1">
                                {new Date(event.startAt).toLocaleString()}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Status
                            </Typography>
                            <Typography variant="body1">
                                {event.status || 'Active'}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Total Participants
                            </Typography>
                            <Typography variant="body1" fontWeight="bold" color="primary">
                                {event.totalParticipants || 0}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Maximum Spots
                            </Typography>
                            <Typography variant="body1">
                                {event.maxParticipants || 'Unlimited'}
                            </Typography>
                        </Box>
                    </Box>


                </CardContent>
            </Card>

            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <TextField
                    label="Search by Email"
                    variant="outlined"
                    size="small"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    sx={{ minWidth: 300 }}
                    InputProps={{
                        startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
                    }}
                />
            </Box>

            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>User Email</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Guest Count</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Joined At</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Remarks</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                        Loading participants...
                                    </TableCell>
                                </TableRow>
                            ) : participants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                        No participants found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                participants.map((participant, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell>{participant.userEmail}</TableCell>
                                        <TableCell>{participant.guestCount}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{
                                                textTransform: 'capitalize',
                                                color: participant.status === 'GOING' ? 'success.main' : 'text.secondary'
                                            }}>
                                                {participant.status.toLowerCase()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(participant.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            {participant.remarks || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[20, 50, 100]}
                    component="div"
                    count={total}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>
        </Container>
    );
};

export default EventParticipationList;
