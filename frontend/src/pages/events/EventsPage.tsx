import React from 'react';
import { Box } from '@mui/material';
import EventList from './components/EventList';
import EventParticipationList from './components/EventParticipationList';
import type { Event as EventType } from './types/event.types';

export default function EventsPage() {
  const [selectedEventForParticipants, setSelectedEventForParticipants] = React.useState<EventType | null>(null);

  const handleEventClick = (event: EventType) => {
    setSelectedEventForParticipants(event);
  };

  const handleBackToEvents = () => {
    setSelectedEventForParticipants(null);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {selectedEventForParticipants ? (
        <EventParticipationList
          event={selectedEventForParticipants}
          onBack={handleBackToEvents}
        />
      ) : (
        <EventList onEventClick={handleEventClick} />
      )}
    </Box>
  );
}

