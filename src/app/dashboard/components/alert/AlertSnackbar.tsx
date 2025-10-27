'use client';

import { useAtom } from 'jotai';
import { Snackbar, Alert, AlertProps } from '@mui/material';
import { alertAtom, hideAlertAtom } from '@/app/libs/jotai/alertAtom';

// Custom Alert component for MUI styling
function CustomAlert(props: AlertProps) {
  return <Alert elevation={6} variant="filled" {...props} />;
}

export default function AlertSnackbar() {
  const [alert, setAlert] = useAtom(alertAtom);
  const [, hideAlert] = useAtom(hideAlertAtom);

  const handleClose = (_?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return; // Prevent closing on clickaway
    hideAlert();
  };

  return (
    <Snackbar
      open={alert.open}
      autoHideDuration={2000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <CustomAlert onClose={handleClose} severity={alert.severity} sx={{ width: '100%' }}>
        {alert.message}
      </CustomAlert>
    </Snackbar>
  );
}