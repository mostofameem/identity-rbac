import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import CustomerApp from './CustomerPortal/CustomerApp';

const isCustomerPortal = process.env.REACT_APP_PORTAL === 'customer';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    {isCustomerPortal ? <CustomerApp /> : <App />}
  </React.StrictMode>
); 