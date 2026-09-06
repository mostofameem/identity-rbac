import { createTheme, Theme } from '@mui/material/styles';
import { palette, font, gradient, shadow } from './tokens';

// Refined SaaS theme (light mode) — indigo/violet brand on a slate-neutral
// canvas. Token values come from src/theme/tokens.js, the single source shared
// with tailwind.config.js. Colors are routed through the palette everywhere so
// dark mode remains feasible later.

const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: palette.indigo[600],
      dark: palette.indigo[700],
      light: palette.indigo[500],
      contrastText: '#ffffff',
    },
    secondary: {
      main: palette.violet[600],
      dark: palette.violet[700],
      light: palette.violet[500],
      contrastText: '#ffffff',
    },
    success: { main: palette.emerald[600], dark: palette.emerald[700], light: palette.emerald[500] },
    warning: { main: palette.amber[600], dark: palette.amber[700], light: palette.amber[500] },
    error: { main: palette.red[600], dark: palette.red[700], light: palette.red[500] },
    info: { main: palette.sky[600], dark: palette.sky[700], light: palette.sky[500] },
    text: {
      primary: palette.slate[900],
      secondary: palette.slate[500],
      disabled: palette.slate[400],
    },
    divider: palette.slate[200],
    background: { default: palette.slate[50], paper: '#ffffff' },
    action: {
      selected: 'rgba(79, 70, 229, 0.08)',
      hover: 'rgba(15, 23, 42, 0.04)',
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: font.sans.join(', '),
    h1: { fontSize: '2.25rem', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2 },
    h2: { fontSize: '1.875rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25 },
    h3: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.3 },
    h4: { fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.35 },
    h5: { fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.4 },
    h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.45 },
    subtitle1: { fontSize: '0.9375rem', fontWeight: 500, lineHeight: 1.5 },
    subtitle2: { fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.55 },
    caption: { fontSize: '0.75rem', lineHeight: 1.5 },
    overline: { fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em' },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem', letterSpacing: 0 },
  },
  shadows: [
    'none',
    shadow.xs,
    shadow.sm,
    shadow.md,
    shadow.lg,
    shadow.lg,
    shadow.lg,
    shadow.lg,
    shadow.popover,
    ...Array.from({ length: 16 }, () => shadow.popover),
  ] as Theme['shadows'],
  components: {
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 16px',
          transition: 'background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease',
        },
        contained: {
          boxShadow: shadow.xs,
          '&:hover': { boxShadow: shadow.sm },
        },
        outlined: {
          borderColor: palette.slate[300],
          '&:hover': { borderColor: palette.slate[400], backgroundColor: 'rgba(15, 23, 42, 0.02)' },
        },
        sizeSmall: { padding: '5px 12px', fontSize: '0.8125rem' },
        sizeLarge: { padding: '12px 22px', fontSize: '0.9375rem' },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease, color 0.2s ease',
          '&:hover': { backgroundColor: 'rgba(15, 23, 42, 0.05)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
        sizeSmall: { height: 24 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${palette.slate[200]}`,
          boxShadow: shadow.xs,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#ffffff',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: palette.slate[200] },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: palette.slate[300] },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: palette.indigo[600],
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: '0.9375rem' },
        outlined: {
          '&.Mui-focused': { color: palette.indigo[600] },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: palette.slate[200], padding: '12px 16px' },
        head: {
          backgroundColor: palette.slate[50],
          color: palette.slate[500],
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td, &:last-child th': { borderBottom: 0 },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: { color: palette.slate[500] },
        toolbar: { paddingLeft: 16 },
        select: { borderRadius: 8 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: shadow.popover,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { padding: '20px 24px', fontSize: '1.125rem', fontWeight: 700 },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: { padding: '20px 24px' },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: { padding: '14px 24px' },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: `1px solid ${palette.slate[200]}`,
          boxShadow: shadow.lg,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: `1px solid ${palette.slate[200]}`,
          boxShadow: shadow.lg,
        },
        list: { padding: 6 },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: '1px 0',
          minHeight: 38,
          fontSize: '0.875rem',
          '&.Mui-selected': { backgroundColor: palette.indigo[50], color: palette.indigo[700] },
          '&.Mui-selected:hover': { backgroundColor: palette.indigo[100] },
        },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: {
          backgroundColor: palette.slate[800],
          fontSize: '0.75rem',
          fontWeight: 500,
          borderRadius: 8,
          padding: '6px 10px',
        },
        arrow: { color: palette.slate[800] },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10, fontWeight: 500 },
        standardSuccess: { backgroundColor: palette.emerald[50], color: palette.emerald[800] },
        standardError: { backgroundColor: palette.red[50], color: palette.red[800] },
        standardWarning: { backgroundColor: palette.amber[50], color: palette.amber[800] },
        standardInfo: { backgroundColor: palette.sky[50], color: palette.sky[800] },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: { padding: 4 },
        switchBase: { '&.Mui-checked + .MuiSwitch-track': { opacity: 1 } },
        track: { opacity: 1, backgroundColor: palette.slate[300] },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 999, height: 6, backgroundColor: palette.slate[200] },
        bar: { borderRadius: 999 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: 2.5, borderRadius: 999 },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        root: { fontSize: '0.875rem' },
      },
    },
  },
});

export const brandGradient = gradient.brand;
export default appTheme;
