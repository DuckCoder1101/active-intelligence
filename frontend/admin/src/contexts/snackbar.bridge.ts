import type { SnackbarMessage } from '@/contexts/snackbar.context';

type PushSnackbar = (message: SnackbarMessage) => void;

let pushRef: PushSnackbar | null = null;

export function setSnackbarBridge(fn: PushSnackbar) {
  pushRef = fn;
}

export function pushSnackbarViaBridge(message: SnackbarMessage) {
  pushRef?.(message);
}
