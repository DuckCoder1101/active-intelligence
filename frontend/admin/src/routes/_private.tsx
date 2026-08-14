import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { Topbar } from '@/components/layout/topbar.component';
import { SettingsModal } from '@/components/settings/settings-modal.component';
import { SettingsModalProvider } from '@/providers/settings-modal.provider';
import { getSessionUser } from '@/server/session';
import type { RouteAccessLevel } from '@/types/route-access.type';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';
import { auth } from '@/utils/firebase.util';

const ROUTE_ACCESS: RouteAccessLevel = {
  minAccessLevel: 'admin',
};

// Guard único para toda a árvore /_private: sessão, cadastro completo e o
// piso de acesso ('admin') comum a todo o painel. Cada rota abaixo herda
// isso via context — só precisa checar a PERMISSÃO específica da seção
// (manage-finance, manage-library, etc.), quando for mais restritiva que o piso.
export const Route = createFileRoute('/_private')({
  beforeLoad: async ({ context }) => {
    // O cookie de sessão (servidor) pode já ser válido antes do SDK do
    // Firebase no cliente terminar de restaurar o usuário (ex: reload de
    // página inteira após o login). Sem isso, o loader das rotas filhas
    // dispara chamadas autenticadas antes do auth.currentUser existir e
    // elas saem sem token -> functions/unauthenticated.
    await auth.authStateReady();

    const sessionUser = context.sessionUser ?? (await getSessionUser());

    if (!sessionUser) {
      throw redirect({ to: '/auth/signin' });
    }

    if (!sessionUser.complete) {
      throw redirect({ to: '/auth/complete-account' });
    }

    if (!checkRouteAccess(sessionUser, ROUTE_ACCESS)) {
      throw redirect({ to: '/unauthorized' });
    }

    return { sessionUser };
  },
  component: AdminComponent,
});

function AdminComponent() {
  return (
    <SettingsModalProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-bg">
        <Topbar />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>
      <SettingsModal />
    </SettingsModalProvider>
  );
}
