import { useSnackbar } from '@contexts/snackbar.context';

import type { SnackbarMessage } from '@contexts/snackbar.context';
import { MdClose } from 'react-icons/md';

const TYPE_CLASSES: Record<NonNullable<SnackbarMessage['type']>, string> = {
  error: 'bg-red-800',
  success: 'bg-green-800',
  message: 'bg-blue-800',
};

export function Snackbar() {
  const { messages, dismissSnackbar: dismiss } = useSnackbar();

  if (messages.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
      {messages.map(({ id, message, type }) => (
        <div
          key={id}
          className={`${TYPE_CLASSES[type]} flex min-w-64 items-center justify-between gap-4 rounded-lg px-4 py-3 text-sm text-white shadow-lg`}
        >
          <span>{message}</span>
          <button
            onClick={() => dismiss(id!)}
            className="shrink-0 opacity-70 hover:opacity-100"
            aria-label="Fechar"
          >
            <MdClose size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
