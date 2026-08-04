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
import { signOut } from 'firebase/auth';
import { useEffect } from 'react';
import { MdOutlineReportProblem, MdOutlineSearchOff } from 'react-icons/md';
import { ToastContainer } from 'react-toastify';
import toastifyCss from 'react-toastify/dist/ReactToastify.css?url';

import type { RouterContext } from '../router';
import appCss from '../styles.css?url';

import { FcmNotificationsProvider } from '@/providers/fcm-notifications.provider';
import { NotificationsProvider } from '@/providers/notifications.provider';
import { ThemeProvider } from '@/providers/theme.provider';
import { auth } from '@/utils/firebase.util';

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
  const isUnauthenticated =
    error instanceof FirebaseError && error.code === 'functions/unauthenticated';

  useEffect(() => {
    if (isPermissionDenied) {
      router.navigate({ to: '/unauthorized', replace: true });
    }
    if (isUnauthenticated) {
      // Sessão local ficou com token que o backend não reconhece mais (ex:
      // emulador de auth reiniciado) — sem isso o usuário fica preso nesta
      // tela sem nenhum jeito de deslogar e tentar de novo.
      signOut(auth).finally(() => {
        router.navigate({ to: '/auth/signin', replace: true });
      });
    }
  }, [isPermissionDenied, isUnauthenticated, router]);

  if (isPermissionDenied || isUnauthenticated) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-bg px-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-danger/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative w-full max-w-sm animate-slide-up rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <MdOutlineReportProblem size={30} />
        </div>

        <h1 className="mt-5 text-lg font-black text-text">Algo deu errado</h1>
        <p className="mt-2 text-[13px] text-text-sub">
          Não conseguimos carregar esta página. Tente novamente em instantes.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-primary w-full justify-center"
          >
            Tentar novamente
          </button>
          <Link to="/" className="btn-ghost-border w-full justify-center">
            Voltar para o painel
          </Link>
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-bg px-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-primary-glow/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-40 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
      />

      <div className="relative w-full max-w-sm animate-slide-up rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-surface text-orange">
          <MdOutlineSearchOff size={30} />
        </div>

        <p className="mt-5 bg-linear-to-r from-primary to-primary-glow bg-clip-text text-4xl font-black tabular-nums text-transparent">
          404
        </p>
        <h1 className="mt-1 text-lg font-black text-text">
          Página não encontrada
        </h1>
        <p className="mt-2 text-[13px] text-text-sub">
          O endereço pode estar errado ou a página foi movida.
        </p>

        <Link to="/" className="btn-primary mt-6 w-full justify-center">
          Voltar para o painel
        </Link>
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
