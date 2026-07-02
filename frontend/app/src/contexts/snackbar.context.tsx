import { createContext, useContext } from 'react';

export interface SnackbarMessage {
  id?: number;
  message: string;
  type: 'error' | 'message' | 'success';
}

export interface SnackbarContextState {
  messages: SnackbarMessage[];
  pushSnackbar: (message: SnackbarMessage) => void;
  dismissSnackbar: (id: number) => void;
}

export const SnackbarContext = createContext<SnackbarContextState | null>(null);

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) {throw new Error('useSnackbar must be used within SnackbarProvider');}
  return ctx;
}
