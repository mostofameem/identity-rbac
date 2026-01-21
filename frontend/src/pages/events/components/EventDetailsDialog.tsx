import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Divider,
    Chip,
    Grid
} from '@mui/material';
import { Event } from '../types/event.types';
import { format } from 'date-fns';

interface EventDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    event: Event | null;
}

const EventDetailsDialog: React.FC<EventDetailsDialogProps> = ({ open, onClose, event }) => {
    if (!event) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">{event.title}</Typography>
                    <Chip
                        label={event.status || 'Active'}
                        color={event.status === 'active' || event.status === 'ONGOING' ? 'success' : event.status === 'UPCOMING' ? 'info' : 'default'}
                        size="small"
                    />
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Box mb={4}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                        Description
                    </Typography>
                    <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
                        {event.description || 'No description provided.'}
                    </Typography>
                </Box>

                <Divider className="my-4" />

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box mb={3}>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                Event Type
                            </Typography>
                            <Typography variant="body1">
                                {event.eventType?.name || 'N/A'}
                            </Typography>
                        </Box>

                        <Box mb={3}>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                Max Participants
                            </Typography>
                            <Typography variant="body1">
                                {event.maxParticipants}
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box mb={3}>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                Start Time
                            </Typography>
                            <Typography variant="body1">
                                {event.startAt ? format(new Date(event.startAt), 'PPpp') : 'N/A'}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>

                <Divider className="my-4" />

                <Box mt={2}>
                    <Typography variant="subtitle1" gutterBottom className="font-semibold text-gray-700">
                        Registration Window
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                Opens At
                            </Typography>
                            <Typography variant="body2">
                                {event.registrationOpensAt ? format(new Date(event.registrationOpensAt), 'PPpp') : 'N/A'}
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                Closes At
                            </Typography>
                            <Typography variant="body2">
                                {event.registrationClosesAt ? format(new Date(event.registrationClosesAt), 'PPpp') : 'N/A'}
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EventDetailsDialog;
