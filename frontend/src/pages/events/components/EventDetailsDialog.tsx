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
    Card,
    CardContent,
    Avatar,
    Stack
} from '@mui/material';
import {
    CalendarToday,
    Event,
    People,
    Schedule,
    Description,
    Close,
    AccessTime,
    LockClock,
} from '@mui/icons-material';
import type { Event as EventType } from '../types/event.types';
import { format } from 'date-fns';

interface EventDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    event: EventType | null;
}

const EventDetailsDialog: React.FC<EventDetailsDialogProps> = ({ open, onClose, event }) => {
    if (!event) return null;

    const getStatusColor = (status?: string) => {
        switch (status?.toUpperCase()) {
            case 'ONGOING':
            case 'ACTIVE':
                return 'success';
            case 'UPCOMING':
                return 'info';
            case 'RECENT':
                return 'primary';
            case 'ENDED':
            case 'COMPLETED':
                return 'default';
            default:
                return 'default';
        }
    };

    const getStatusLabel = (status?: string) => {
        return status?.toUpperCase() || 'UNKNOWN';
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="lg" 
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                }
            }}
        >
            <DialogTitle sx={{ pb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ color: 'white' }}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                            <Event sx={{ fontSize: 32 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: 'white', mb: 0.5 }}>
                                {event.title}
                            </Typography>
                            <Chip
                                label={getStatusLabel(event.status)}
                                color={getStatusColor(event.status)}
                                size="small"
                                sx={{ 
                                    bgcolor: 'rgba(255,255,255,0.9)',
                                    fontWeight: 'bold',
                                }}
                            />
                        </Box>
                    </Box>
                    <Button
                        onClick={onClose}
                        sx={{
                            minWidth: 'auto',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                        }}
                    >
                        <Close />
                    </Button>
                </Box>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3, bgcolor: '#f5f7fa' }}>
                {/* Description Card */}
                {event.description && (
                    <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 2 }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <Description color="primary" />
                                <Typography variant="h6" fontWeight="600">
                                    Description
                                </Typography>
                            </Box>
                            <Typography 
                                variant="body1" 
                                color="text.secondary"
                                sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}
                            >
                                {event.description}
                            </Typography>
                        </CardContent>
                    </Card>
                )}

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                    {/* Event Information Card */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <Event color="primary" />
                                    <Typography variant="h6" fontWeight="600">
                                        Event Information
                                    </Typography>
                                </Box>
                                
                                <Stack spacing={2.5}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                                            Event Type
                                        </Typography>
                                        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                            <Chip 
                                                label={event.eventType?.name || 'N/A'} 
                                                size="small" 
                                                color="primary" 
                                                variant="outlined"
                                            />
                                        </Box>
                                    </Box>

                                    <Divider />

                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                                            Maximum Participants
                                        </Typography>
                                        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                            <People color="action" fontSize="small" />
                                            <Typography variant="h6" fontWeight="600">
                                                {event.maxParticipants || 'Unlimited'}
                                                {(event as any).totalParticipants !== undefined && (
                                                    <Typography 
                                                        component="span" 
                                                        variant="body2" 
                                                        color="text.secondary"
                                                        sx={{ ml: 1, fontWeight: 'normal' }}
                                                    >
                                                        ({(event as any).totalParticipants} registered)
                                                    </Typography>
                                                )}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Schedule Card */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <Schedule color="primary" />
                                    <Typography variant="h6" fontWeight="600">
                                        Event Schedule
                                    </Typography>
                                </Box>
                                
                                <Stack spacing={2.5}>
                                    <Box>
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                            <CalendarToday color="action" fontSize="small" />
                                            <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                                                Start Time
                                            </Typography>
                                        </Box>
                                        <Typography variant="body1" fontWeight="500" sx={{ ml: 4 }}>
                                            {event.startAt ? format(new Date(event.startAt), 'PPpp') : 'N/A'}
                                        </Typography>
                                    </Box>

                                    <Divider />

                                    <Box>
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                            <AccessTime color="action" fontSize="small" />
                                            <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                                                Registration Opens
                                            </Typography>
                                        </Box>
                                        <Typography variant="body1" fontWeight="500" sx={{ ml: 4 }}>
                                            {event.registrationOpensAt ? format(new Date(event.registrationOpensAt), 'PPpp') : 'N/A'}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                            <LockClock color="action" fontSize="small" />
                                            <Typography variant="caption" color="text.secondary" fontWeight="600" textTransform="uppercase">
                                                Registration Closes
                                            </Typography>
                                        </Box>
                                        <Typography variant="body1" fontWeight="500" sx={{ ml: 4 }}>
                                            {event.registrationClosesAt ? format(new Date(event.registrationClosesAt), 'PPpp') : 'N/A'}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f5f7fa' }}>
                <Button 
                    onClick={onClose} 
                    variant="contained"
                    color="primary"
                    sx={{ borderRadius: 2, px: 3, textTransform: 'none', fontWeight: 600 }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EventDetailsDialog;
