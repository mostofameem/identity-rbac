import React from 'react';
import { Box, Typography } from '@mui/material';
import { InboxOutlined } from '@mui/icons-material';

// Friendly empty state with an icon disc, title, description, and optional
// action. Replaces bare "No records found" table rows.

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: 'small' | 'medium';
  sx?: object;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  size = 'medium',
  sx,
}) => {
  const disc = size === 'small' ? 44 : 56;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: size === 'small' ? 4 : 6,
        px: 3,
        ...sx,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: disc,
          height: disc,
          borderRadius: '50%',
          bgcolor: 'action.selected',
          color: 'primary.main',
          mb: 1.5,
        }}
      >
        {icon ?? <InboxOutlined sx={{ fontSize: size === 'small' ? 22 : 26 }} />}
      </Box>
      <Typography variant="subtitle1" fontWeight={600}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 360 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
};

export default EmptyState;
