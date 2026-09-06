import { palette } from './tokens';

// Single source for status → tone mapping. Soft tinted chips (bg + colored text
// + border + dot) — the dot keeps statuses distinguishable beyond color alone.
// Replaces the four duplicated maps that lived in EventList,
// EventDetailsDialog, index.css, and shared/Badge variants.

export interface StatusTone {
  bg: string;
  color: string;
  border: string;
  dot: string;
}

const TONES: Record<'green' | 'amber' | 'blue' | 'gray' | 'red', StatusTone> = {
  green: { bg: palette.emerald[50], color: palette.emerald[700], border: palette.emerald[200], dot: palette.emerald[500] },
  amber: { bg: palette.amber[50], color: palette.amber[800], border: palette.amber[200], dot: palette.amber[500] },
  blue: { bg: palette.sky[50], color: palette.sky[700], border: palette.sky[200], dot: palette.sky[500] },
  gray: { bg: palette.slate[100], color: palette.slate[600], border: palette.slate[200], dot: palette.slate[400] },
  red: { bg: palette.red[50], color: palette.red[700], border: palette.red[200], dot: palette.red[500] },
};

const STATUS_TONE: Record<string, 'green' | 'amber' | 'blue' | 'gray' | 'red'> = {
  ACTIVE: 'green',
  ONGOING: 'green',
  GOING: 'green',
  REGISTERED: 'green',
  UPCOMING: 'amber',
  MAYBE: 'amber',
  PENDING: 'amber',
  NOT_REGISTERED: 'amber',
  RECENT: 'blue',
  COMPLETED: 'blue',
  ENDED: 'gray',
  INACTIVE: 'gray',
  CANCELLED: 'red',
  NOT_GOING: 'red',
};

const DEFAULT_TONE: StatusTone = {
  bg: palette.slate[100],
  color: palette.slate[600],
  border: palette.slate[200],
  dot: palette.slate[400],
};

export const getStatusStyle = (status?: string | null): StatusTone => {
  if (!status) return DEFAULT_TONE;
  const tone = STATUS_TONE[status.toUpperCase()];
  return tone ? TONES[tone] : DEFAULT_TONE;
};

// "NOT_REGISTERED" → "Not registered"
export const formatStatusLabel = (status?: string | null): string => {
  if (!status) return '—';
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
