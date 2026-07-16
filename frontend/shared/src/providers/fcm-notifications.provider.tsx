import { useQueryClient } from '@tanstack/react-query';
import { useRouterState } from '@tanstack/react-router';
import { getToken, onMessage } from 'firebase/messaging';
import { useEffect, type ReactNode } from 'react';
import { toast } from 'react-toastify';

import { useAuth } from '@/contexts/auth.context';
import { notificationKeys } from '@/queries/notification.queries';
import FcmService from '@/services/fcm.service';
import { FCM_VAPID_KEY, getMessagingClient } from '@/utils/firebase.util';

interface FcmNotificationsProviderProps {
  children: ReactNode;
}

export function FcmNotificationsProvider({
  children,
}: FcmNotificationsProviderProps) {
  const { claims } = useAuth();
  const queryClient = useQueryClient();

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthRoute = pathname.startsWith('/auth');

  useEffect(() => {
    if (!claims || isAuthRoute) {return;}
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    if (!FCM_VAPID_KEY || FCM_VAPID_KEY.startsWith('<')) {
      // VAPID key not configured (still the placeholder) — skip SW
      // registration entirely instead of registering it just to have
      // getToken() fail on every render.
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js',
        );

        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }

        if (Notification.permission !== 'granted') {return;}

        const messaging = getMessagingClient();
        if (!messaging) {return;}

        const token = await getToken(messaging, {
          vapidKey: FCM_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (!cancelled && token) {
          await FcmService.registerToken(token);
        }
      } catch (err) {
        console.error('[FcmNotificationsProvider] setup failed', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [claims, isAuthRoute]);

  useEffect(() => {
    const messaging = getMessagingClient();
    if (!messaging) {return;}

    return onMessage(messaging, (payload) => {
      const message = payload.notification?.body ?? payload.data?.message;
      if (message) {toast.info(message);}

      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
    });
  }, [queryClient]);

  return <>{children}</>;
}
