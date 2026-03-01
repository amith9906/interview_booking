import { useEffect, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { subscribeToast } from '../services/toastService';

const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToast((payload) => setToast(payload));
    return unsubscribe;
  }, []);

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setToast(null);
  };

  return (
    <>
      {children}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClose={handleClose}
      >
        {toast && (
          <Alert severity={toast.type || 'info'} onClose={handleClose} variant="filled" sx={{ width: '100%' }}>
            {toast.message}
          </Alert>
        )}
      </Snackbar>
    </>
  );
};

export default ToastProvider;
