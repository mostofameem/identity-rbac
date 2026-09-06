import React from 'react';
import { Box, Typography } from '@mui/material';
import { Event as EventIcon, Schedule as ScheduleIcon, Groups as GroupsIcon, AutoAwesome as AutoAwesomeIcon } from '@mui/icons-material';

// Left half of the split-screen auth layout: brand gradient with soft glows
// and glass feature chips. Hidden below lg (form centers on small screens).

const FEATURES = [
  { icon: <ScheduleIcon sx={{ fontSize: 18 }} />, label: 'Auto-created recurring events' },
  { icon: <GroupsIcon sx={{ fontSize: 18 }} />, label: 'Participants & capacity at a glance' },
  { icon: <AutoAwesomeIcon sx={{ fontSize: 18 }} />, label: 'One dashboard for everything' },
];

const BrandPanel: React.FC = () => (
  <Box
    sx={{
      position: 'relative',
      overflow: 'hidden',
      display: { xs: 'none', lg: 'flex' },
      flexDirection: 'column',
      justifyContent: 'space-between',
      p: 8,
      color: 'white',
      background: 'linear-gradient(160deg, #4338ca 0%, #4f46e5 45%, #7c3aed 100%)',
    }}
  >
    {/* Decorative glows */}
    <Box sx={{ position: 'absolute', top: -120, right: -80, width: 340, height: 340, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', filter: 'blur(90px)' }} />
    <Box sx={{ position: 'absolute', bottom: -140, left: -60, width: 380, height: 380, borderRadius: '50%', background: 'rgba(167, 139, 250, 0.25)', filter: 'blur(100px)' }} />

    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative' }}>
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 40,
          height: 40,
          borderRadius: 2.5,
          bgcolor: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <EventIcon />
      </Box>
      <Typography variant="h6" fontWeight={700} letterSpacing="-0.01em">
        Event Management
      </Typography>
    </Box>

    <Box sx={{ position: 'relative', maxWidth: 420 }}>
      <Typography variant="h2" component="h2" sx={{ color: 'white', mb: 2 }}>
        Run every event on autopilot.
      </Typography>
      <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4 }}>
        Schedule event types once and let the platform create, track, and fill them — while you focus on the event itself.
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {FEATURES.map((feature) => (
          <Box
            key={feature.label}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1.25,
              alignSelf: 'flex-start',
              px: 2,
              py: 1.25,
              borderRadius: 2.5,
              bgcolor: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <Box sx={{ display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.9)' }}>{feature.icon}</Box>
            <Typography variant="body2" fontWeight={500} sx={{ color: 'white' }}>
              {feature.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>

    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', position: 'relative' }}>
      © {new Date().getFullYear()} Event Management
    </Typography>
  </Box>
);

export default BrandPanel;
