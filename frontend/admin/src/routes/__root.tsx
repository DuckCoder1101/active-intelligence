import { AuthProvider } from '@providers/auth.provider';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { FirebaseError } from 'firebase/app';
import { useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import { ToastContainer } from 'react-toastify';
import toastifyCss from 'react-toastify/dist/ReactToastify.css?url';

import type { RouterContext } from '../router';
import appCss from '../styles.css?url';

import { FcmNotificationsProvider } from '@/providers/fcm-notifications.provider';
import { NotificationsProvider } from '@/providers/notifications.provider';
import { ThemeProvider } from '@/providers/theme.provider';

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Guará',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'stylesheet', href: toastifyCss },
      { rel: 'icon', href: '/icons/favicon.png' },
    ],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
  errorComponent: RootErrorBoundary,
});

function RootErrorBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();

  const isPermissionDenied =
    error instanceof FirebaseError && error.code === 'functions/permission-denied';

  useEffect(() => {
    if (isPermissionDenied) {
      router.navigate({ to: '/unauthorized', replace: true });
    }
  }, [isPermissionDenied, router]);

  if (isPermissionDenied) {
    return null;
  }

  return (
    <div className="w-full min-h-screen flex justify-center items-center bg-bg">
      <div className="p-8 rounded-md bg-card animate-slide-up text-center">
        <strong className="text-text text-lg uppercase">
          Ocorreu um erro
        </strong>
        <p className="text-text-sub text-sm mt-2">
          Tente novamente mais tarde.
        </p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="w-full min-h-screen flex justify-center items-center bg-bg">
      <div className="p-8 rounded-md bg-card animate-slide-up">
        <span className="flex justify-center items-center gap-1 animate-bounce">
          <FaSearch size={15} />
          <strong className="text-2xl text-center">404</strong>
        </span>

        <strong className="text-text text-center uppercase text-lg">
          Página não encontrada!
        </strong>

        <p className="text-text-sub text-sm">
          Que tal{' '}
          <Link to="/" className="underline">
            voltar para o painel?
          </Link>
        </p>
      </div>
    </div>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <FcmNotificationsProvider>
        <NotificationsProvider>
          <ThemeProvider>
            <Outlet />
          </ThemeProvider>
        </NotificationsProvider>
      </FcmNotificationsProvider>
    </AuthProvider>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <ToastContainer position="top-center" theme="colored" />
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            {
              name: 'Tanstack Query',
              render: <ReactQueryDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
