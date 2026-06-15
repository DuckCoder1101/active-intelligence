import { useCallback, useState } from 'react';

import { Snackbar } from '@/components/layout/snackbar.component';
import { SnackbarContext } from '@contexts/snackbar.context';

import type { ReactNode } from 'react';
import type { SnackbarMessage } from '@contexts/snackbar.context';

interface SnackbarProviderProps {
  children: ReactNode;
}

const DURATION_MS = 4000;

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  const [messages, setMessages] = useState<SnackbarMessage[]>([]);

  const dismiss = useCallback((id: number) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const push = useCallback(
    (message: SnackbarMessage) => {
      message.id = Date.now();
      setMessages((prev) => [...prev, message]);
      setTimeout(() => dismiss(message.id as number), DURATION_MS);
    },
    [dismiss],
  );

  return (
    <SnackbarContext.Provider
      value={{ messages, pushSnackbar: push, dismissSnackbar: dismiss }}
    >
      {children}
      <Snackbar />
    </SnackbarContext.Provider>
  );
}
