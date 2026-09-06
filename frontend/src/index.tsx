import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './index.css';
import appTheme from './theme/theme';
import { SnackbarProvider } from './context/SnackbarContext';
import App from './App';
import CustomerApp from './CustomerPortal/CustomerApp';

const isCustomerPortal = process.env.REACT_APP_PORTAL === 'customer';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <SnackbarProvider>
        {isCustomerPortal ? <CustomerApp /> : <App />}
      </SnackbarProvider>
    </ThemeProvider>
  </React.StrictMode>
);
