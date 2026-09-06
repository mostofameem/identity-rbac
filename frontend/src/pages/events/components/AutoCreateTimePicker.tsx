import React, { useEffect, useRef, useState } from 'react';
import { Box, ButtonBase, Popover, Typography } from '@mui/material';
import { Check, DarkMode, ExpandMore, LightMode, Schedule, WbSunny } from '@mui/icons-material';

const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// The backend stores autoCreateAt as a time-of-day but marshals it as a full
// RFC3339 timestamp with a zeroed date (e.g. "0000-01-01T08:00:00Z"). Extract
// the literal clock part — no timezone conversion, so what was saved is what
// is shown.
export const toAutoCreateTime = (value?: string | null): string => {
  if (!value) return '09:00';
  if (HHMM_REGEX.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(11, 16);
  const hhmm = value.slice(0, 5);
  return HHMM_REGEX.test(hhmm) ? hhmm : '09:00';
};

// All selectable slots: 00:00–23:30 in 30-minute steps.
const SLOTS: string[] = Array.from({ length: 48 }, (_, i) =>
    `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`
);

const hourOf = (slot: string) => Number(slot.slice(0, 2));

const GROUPS = [
    { label: 'Morning', icon: <LightMode sx={{ fontSize: 15, color: 'text.disabled' }} />, from: 0, to: 11 },
    { label: 'Afternoon', icon: <WbSunny sx={{ fontSize: 15, color: 'text.disabled' }} />, from: 12, to: 17 },
    { label: 'Evening', icon: <DarkMode sx={{ fontSize: 15, color: 'text.disabled' }} />, from: 18, to: 23 },
];

interface AutoCreateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  size?: 'small' | 'medium';
  helperText?: string;
  fullWidth?: boolean;
  sx?: object;
}

// Premium time-of-day picker for autoCreateAt. A styled trigger field opens a
// popover with grouped, scrollable 30-minute time slots. API matches the old
// TimePicker-based control so call sites are unchanged.
const AutoCreateTimePicker: React.FC<AutoCreateTimePickerProps> = ({
  value,
  onChange,
  label,
  disabled,
  size = 'small',
  helperText,
  fullWidth,
  sx,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const open = Boolean(anchorEl) && !disabled;

  const meridiem = hourOf(value) < 12 ? 'AM' : 'PM';

  // Center the scroll container on the selected slot when the popover opens.
  useEffect(() => {
    if (!open) return;
    const container = listRef.current;
    const selected = container?.querySelector<HTMLElement>('[data-selected="true"]');
    if (container && selected) {
      const cRect = container.getBoundingClientRect();
      const sRect = selected.getBoundingClientRect();
      container.scrollTop += sRect.top - cRect.top - container.clientHeight / 2 + sRect.height / 2;
    }
  }, [open]);

  const triggerHeight = size === 'small' ? 42 : 54;

  const renderSlot = (slot: string) => {
    const selected = slot === value;
    return (
      <ButtonBase
        key={slot}
        data-selected={selected}
        onClick={() => {
          onChange(slot);
          setAnchorEl(null);
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.25,
          py: 0.75,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          fontSize: '0.8rem',
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          color: 'text.primary',
          transition: 'all 0.15s ease',
          '&:hover': {
            borderColor: 'primary.main',
            color: 'primary.main',
            bgcolor: 'rgba(79, 70, 229, 0.04)',
            transform: 'translateY(-1px)',
            boxShadow: '0 3px 8px rgba(79, 70, 229, 0.12)',
          },
          ...(selected && {
            bgcolor: 'primary.main',
            color: 'common.white',
            borderColor: 'primary.main',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
            '&:hover': {
              bgcolor: 'primary.dark',
              color: 'common.white',
              transform: 'none',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
            },
          }),
        }}
      >
        {selected && <Check sx={{ fontSize: 14 }} />}
        {slot}
      </ButtonBase>
    );
  };

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'fit-content', ...sx }}>
      {label && (
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: 'text.secondary' }}>
          {label}
        </Typography>
      )}

      <ButtonBase
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          width: '100%',
          height: triggerHeight,
          px: 1.25,
          bgcolor: 'background.paper',
          border: '1.5px solid',
          borderColor: open ? 'primary.main' : 'divider',
          borderRadius: '12px',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          '&:hover:not(.Mui-disabled)': {
            borderColor: 'primary.main',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.10)',
          },
          '&.Mui-focusVisible': {
            borderColor: 'primary.main',
            boxShadow: '0 0 0 4px rgba(79, 70, 229, 0.15)',
          },
          '&.Mui-disabled': {
            bgcolor: 'action.hover',
            borderColor: 'divider',
          },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 30,
            height: 30,
            borderRadius: 1.25,
            bgcolor: open ? 'primary.main' : 'rgba(79, 70, 229, 0.10)',
            color: open ? 'common.white' : 'primary.main',
            transition: 'all 0.2s ease',
          }}
        >
          <Schedule sx={{ fontSize: 17 }} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: size === 'small' ? '0.95rem' : '1.1rem',
              letterSpacing: '0.02em',
              fontVariantNumeric: 'tabular-nums',
              color: disabled ? 'text.disabled' : 'text.primary',
              lineHeight: 1,
            }}
          >
            {value}
          </Typography>
          <Box
            component="span"
            sx={{
              fontSize: '0.65rem',
              fontWeight: 700,
              lineHeight: 1,
              px: 0.5,
              py: '2px',
              borderRadius: 0.5,
              bgcolor: 'rgba(79, 70, 229, 0.08)',
              color: disabled ? 'text.disabled' : 'primary.main',
            }}
          >
            {meridiem}
          </Box>
        </Box>

        <ExpandMore
          sx={{
            fontSize: 18,
            color: 'text.disabled',
            transition: 'transform 0.25s ease',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        />
      </ButtonBase>

      {helperText && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
          {helperText}
        </Typography>
      )}

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        marginThreshold={8}
        slotProps={{
          paper: {
            sx: {
              width: 304,
              borderRadius: '16px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.08)',
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: 2,
            py: 1.5,
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.10), rgba(79, 70, 229, 0.02))',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 34,
              height: 34,
              borderRadius: 1.5,
              bgcolor: 'primary.main',
              color: 'common.white',
              boxShadow: '0 4px 10px rgba(79, 70, 229, 0.35)',
            }}
          >
            <Schedule fontSize="small" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {label || 'Create At'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
              Pick a time — 30 min steps
            </Typography>
          </Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color: 'primary.main',
              bgcolor: 'rgba(79, 70, 229, 0.08)',
              px: 0.75,
              py: 0.25,
              borderRadius: 0.75,
            }}
          >
            {value}
          </Typography>
        </Box>

        <Box
          ref={listRef}
          sx={{
            maxHeight: 316,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0, 0, 0, 0.15)', borderRadius: 3 },
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          }}
        >
          {GROUPS.map((group) => (
            <Box key={group.label}>
              <Box
                sx={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 2,
                  py: 0.75,
                  bgcolor: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(6px)',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {group.icon}
                <Typography
                  variant="overline"
                  sx={{ lineHeight: 1, fontWeight: 700, fontSize: '0.65rem', color: 'text.secondary' }}
                >
                  {group.label}
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75, p: 1.25 }}>
                {SLOTS.filter((slot) => {
                  const h = hourOf(slot);
                  return h >= group.from && h <= group.to;
                }).map(renderSlot)}
              </Box>
            </Box>
          ))}
        </Box>
      </Popover>
    </Box>
  );
};

export default AutoCreateTimePicker;
