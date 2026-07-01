import { SnackbarContext } from '@contexts/snackbar.context';
import type { SnackbarMessage } from '@contexts/snackbar.context';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { Snackbar } from '@/components/layout/snackbar.component';
import { setSnackbarBridge } from '@/contexts/snackbar.bridge';


interface SnackbarProviderProps {
  children: ReactNode;
}

const DURATION_MS = 4000;
let nextId = 1;

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  const [messages, setMessages] = useState<SnackbarMessage[]>([]);

  const dismiss = useCallback((id: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const push = useCallback(
    (message: SnackbarMessage) => {
      message.id = nextId++;
      setMessages((prev) => [...prev, message]);
      setTimeout(() => dismiss(message.id as number), DURATION_MS);
    },
    [dismiss],
  );

  useEffect(() => {
    setSnackbarBridge(push);
  }, [push]);

  return (
    <SnackbarContext.Provider
      value={{ messages, pushSnackbar: push, dismissSnackbar: dismiss }}
    >
      {children}
      <Snackbar />
    </SnackbarContext.Provider>
  );
}
