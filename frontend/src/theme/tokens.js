// Single source of truth for design tokens. Plain JS (no TS syntax) so both
// tailwind.config.js (require) and TypeScript modules (import) can consume it.
// Keep in sync with src/theme/theme.ts — values here are the canonical source.

const palette = {
  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
  violet: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065',
  },
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
  },
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
  },
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
  },
  sky: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
  },
};

const font = {
  sans: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
};

const gradient = {
  brand: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
  brandSoft: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
  canvas: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
  sidebar: 'linear-gradient(180deg, #101728 0%, #0b1120 100%)',
};

const shadow = {
  xs: '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
  sm: '0 1px 3px 0 rgba(16, 24, 40, 0.07), 0 1px 2px 0 rgba(16, 24, 40, 0.05)',
  md: '0 4px 8px -2px rgba(16, 24, 40, 0.08), 0 2px 4px -2px rgba(16, 24, 40, 0.05)',
  lg: '0 12px 20px -6px rgba(16, 24, 40, 0.10), 0 4px 8px -4px rgba(16, 24, 40, 0.05)',
  popover:
    '0 24px 48px -12px rgba(16, 24, 40, 0.20), 0 8px 20px -8px rgba(16, 24, 40, 0.10)',
};

const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
};

module.exports = { palette, font, gradient, shadow, radius };
