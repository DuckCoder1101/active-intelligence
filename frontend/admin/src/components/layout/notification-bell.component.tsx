import { useEffect, useRef, useState } from 'react';
import { MdOutlineNotifications } from 'react-icons/md';

import { formatRelativeTime } from '@/formatters/formatRelativeTime';
import { useNotifications } from '@/hooks/useNotifications.util';

export function NotificationBell() {
  const { canView, notifications, unreadCount, markAsRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {return;}

    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!canView) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title="Notificações"
        className="btn-icon relative"
      >
        <MdOutlineNotifications size={17} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-danger" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-80 rounded-xl border border-border bg-card shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="text-[13px] font-bold text-text">Notificações</p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12px] text-text-muted">
                Nenhuma notificação por enquanto.
              </p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.notificationId}
                  type="button"
                  onClick={() => markAsRead(notification.notificationId)}
                  className={`flex w-full flex-col gap-1 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-bg ${
                    notification.read ? '' : 'bg-orange/5'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notification.read && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange" />
                    )}
                    <p className="flex-1 text-[12.5px] text-text">
                      {notification.message}
                    </p>
                  </div>
                  <span className="pl-3.5 text-[11px] text-text-muted">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
