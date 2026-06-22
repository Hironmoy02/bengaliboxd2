'use client';

import React from 'react';
import { Alert, AlertTitle, Collapse } from '@mui/material';

interface AppAlertProps {
  severity: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
}

export default function AppAlert({ severity, title, message, onClose }: AppAlertProps) {
  return (
    <Collapse in>
      <Alert
        severity={severity}
        onClose={onClose}
        sx={{
          borderRadius: 2,
          mb: 2,
          '& .MuiAlert-message': { width: '100%' },
        }}
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Collapse>
  );
}
