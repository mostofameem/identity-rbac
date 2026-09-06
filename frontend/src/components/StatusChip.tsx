import React from 'react';
import { Box, Chip } from '@mui/material';
import { formatStatusLabel, getStatusStyle } from '../theme/status';

// Soft-tinted status pill with a leading dot (statuses stay distinguishable
// beyond color alone). Single implementation backed by src/theme/status.ts.

interface StatusChipProps {
  status?: string | null;
  label?: string;
  size?: 'small' | 'medium';
  showDot?: boolean;
  /** Frosted white-on-gradient variant for use on colored/gradient headers. */
  glass?: boolean;
  sx?: object;
}

const StatusChip: React.FC<StatusChipProps> = ({
  status,
  label,
  size = 'small',
  showDot = true,
  glass = false,
  sx,
}) => {
  const tone = getStatusStyle(status);
  const text = label ?? formatStatusLabel(status);

  return (
    <Chip
      size={size}
      label={
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
          {showDot && (
            <Box
              component="span"
              sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: glass ? 'common.white' : tone.dot }}
            />
          )}
          {text}
        </Box>
      }
      sx={{
        ...(glass
          ? {
              bgcolor: 'rgba(255, 255, 255, 0.16)',
              color: 'common.white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(4px)',
            }
          : {
              bgcolor: tone.bg,
              color: tone.color,
              border: `1px solid ${tone.border}`,
            }),
        '& .MuiChip-label': { px: 1.25 },
        ...sx,
      }}
    />
  );
};

export default StatusChip;
