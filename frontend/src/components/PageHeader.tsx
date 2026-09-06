import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

// Page-level header: optional back button, title + subtitle, right-aligned
// actions (usually the primary CTA). Replaces the three hand-rolled copies.

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onBack?: () => void;
  sx?: object;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, onBack, sx }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 3, ...sx }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      {onBack && (
        <Tooltip title="Back">
          <IconButton onClick={onBack} size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
            <ArrowBack fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h3" component="h1" noWrap>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
    {actions && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>{actions}</Box>}
  </Box>
);

export default PageHeader;
