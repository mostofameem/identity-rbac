import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { WarningOutlined } from '@mui/icons-material';

// Confirmation dialog replacing window.confirm(). onConfirm may be async —
// the dialog shows a pending state on the confirm button and closes when it
// resolves; a rejection keeps the dialog open so the caller can toast the error.

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
}) => {
  const [pending, setPending] = useState(false);

  const handleConfirm = async () => {
    setPending(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // Caller reports the error; keep the dialog open for retry/cancel.
    } finally {
      setPending(false);
    }
  };

  const iconBg = tone === 'danger' ? 'error.light' : 'primary.light';
  const iconColor = tone === 'danger' ? 'error.main' : 'primary.main';

  return (
    <Dialog open={open} onClose={pending ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography
          component="span"
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: iconBg,
            color: iconColor,
            flexShrink: 0,
          }}
        >
          <WarningOutlined fontSize="small" />
        </Typography>
        {title}
      </DialogTitle>
      {message && (
        <DialogContent sx={{ color: 'text.secondary' }}>{message}</DialogContent>
      )}
      <DialogActions>
        <Button onClick={onClose} disabled={pending} variant="outlined" color="inherit">
          {cancelLabel}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={pending}
          variant="contained"
          color={tone === 'danger' ? 'error' : 'primary'}
        >
          {pending ? 'Working…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
