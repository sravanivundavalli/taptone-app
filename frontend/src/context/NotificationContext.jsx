import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info'); // 'success', 'error', 'warning', 'info'

  const showNotification = useCallback((msg, sev = 'info') => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, []);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Snackbar 
        open={open} 
        autoHideDuration={4000} 
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleClose} severity={severity} variant="filled" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};
