import React from 'react';
import { Box } from '@mui/material';
import EventTypeList from './components/EventTypeList';

export default function EventTypesPage() {
    return (
        <Box sx={{ width: '100%' }}>
            <EventTypeList />
        </Box>
    );
}
