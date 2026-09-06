import React from 'react';
import { Box, Typography } from '@mui/material';

// Uppercase micro-label used above field values in detail views. Replaces the
// ~8 copies of the caption/uppercase/secondary Typography pattern.
const FieldLabel: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
    {icon}
    <Typography
      variant="caption"
      sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.6875rem' }}
    >
      {children}
    </Typography>
  </Box>
);

export default FieldLabel;
