import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';

import { AuthProvider } from '@providers/auth.provider';
import { SnackbarProvider } from '@providers/snackbar.provider';

import appCss from '../styles.css?url';

import type { RouterContext } from '../router';
import { FaSearch } from 'react-icons/fa';

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
        title: 'Active Inteligence',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

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
          <Link to="/app/user/profile" className="underline">
            voltar para o painel?
          </Link>
        </p>
      </div>
    </div>
  );
}

function RootComponent() {
  return (
    <SnackbarProvider>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </SnackbarProvider>
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
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
