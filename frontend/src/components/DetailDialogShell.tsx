import React from 'react';
import {
  Avatar,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { brandGradient } from '../theme/theme';

// Shared shell for the two large view/edit detail dialogs: brand-gradient
// header with a glass avatar tile, tinted body, and a divided footer.
// Standardizes what EventDetailsDialog and EventTypeDetailsDialog hand-rolled.

interface DetailDialogShellProps {
  open: boolean;
  onClose: (e: unknown, reason?: string) => void;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  headerActions?: React.ReactNode;
  footerActions?: React.ReactNode;
  loading?: boolean;
  contentSx?: object;
  children: React.ReactNode;
}

const DetailDialogShell: React.FC<DetailDialogShellProps> = ({
  open,
  onClose,
  maxWidth = 'sm',
  icon,
  title,
  subtitle,
  headerActions,
  footerActions,
  loading = false,
  contentSx,
  children,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth scroll="body">
    <DialogTitle
      sx={{
        background: brandGradient,
        m: 0,
        px: 3,
        py: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Avatar
        variant="rounded"
        sx={{
          width: 48,
          height: 48,
          bgcolor: 'rgba(255, 255, 255, 0.2)',
          color: '#fff',
          backdropFilter: 'blur(4px)',
        }}
      >
        {icon}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h5" component="div" fontWeight={700} color="#fff" noWrap>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }} noWrap>
            {subtitle}
          </Typography>
        )}
      </Box>
      {headerActions && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>{headerActions}</Box>}
    </DialogTitle>
    <DialogContent dividers sx={{ p: 3, bgcolor: 'background.default', ...contentSx }}>
      {loading ? (
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Skeleton variant="rounded" height={72} />
          <Skeleton variant="rounded" height={48} width="60%" />
          <Skeleton variant="rounded" height={48} width="45%" />
        </Stack>
      ) : (
        children
      )}
    </DialogContent>
    {footerActions && (
      <DialogActions sx={{ bgcolor: 'background.default', justifyContent: 'space-between', px: 3 }}>
        {footerActions}
      </DialogActions>
    )}
  </Dialog>
);

export default DetailDialogShell;
