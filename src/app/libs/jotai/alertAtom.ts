'use client'; // Required for client-side logic in Next.js App Router

import { atom } from 'jotai';

// Define alert types
type AlertSeverity = 'success' | 'error' | 'warning' | 'info';

// Alert state shape
type AlertState = {
  open: boolean;
  message: string;
  severity: AlertSeverity;
};

// Initialize atom with default state
export const alertAtom = atom<AlertState>({
  open: false,
  message: '',
  severity: 'success',
});

// Atom to trigger showing an alert
export const showAlertAtom = atom(
  null, // No getter
  (get, set, { message, severity }: { message: string; severity?: AlertSeverity }) => {
    set(alertAtom, {
      open: true,
      message,
      severity: severity || 'success',
    });
  }
);

// Atom to hide the alert
export const hideAlertAtom = atom(null, (get, set) => {
  set(alertAtom, {
    ...get(alertAtom),
    open: false,
  });
});