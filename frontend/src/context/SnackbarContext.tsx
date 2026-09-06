import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Alert, AlertColor, Snackbar, useMediaQuery, useTheme } from '@mui/material';

// App-wide toast notifications. Replaces the alert() calls that were scattered
// through the events components. Bottom-right on desktop, bottom-center on
// phones (so it sits above the customer portal's tab bar). Latest message wins.

type SnackbarFn = (message: string) => void;

interface SnackbarContextValue {
  success: SnackbarFn;
  error: SnackbarFn;
  info: SnackbarFn;
  warning: SnackbarFn;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

interface ToastState {
  message: string;
  severity: AlertColor;
  autoHideMs: number;
}

const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));

  const show = useCallback((severity: AlertColor, message: string, autoHideMs: number) => {
    setToast({ message, severity, autoHideMs });
  }, []);

  const value = useMemo<SnackbarContextValue>(
    () => ({
      success: (message) => show('success', message, 4000),
      error: (message) => show('error', message, 6000),
      info: (message) => show('info', message, 4000),
      warning: (message) => show('warning', message, 5000),
    }),
    [show]
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={toast?.autoHideMs ?? 4000}
        onClose={(_e, reason) => {
          if (reason === 'clickaway') return;
          setToast(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: isPhone ? 'center' : 'right' }}
        sx={{ bottom: isPhone ? 88 : 24 }}
      >
        <Alert
          onClose={() => setToast(null)}
          severity={toast?.severity ?? 'info'}
          variant="filled"
          sx={{ boxShadow: 6, alignItems: 'center' }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = (): SnackbarContextValue => {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useSnackbar must be used within SnackbarProvider');
  return ctx;
};

export { SnackbarProvider };
export default SnackbarProvider;
