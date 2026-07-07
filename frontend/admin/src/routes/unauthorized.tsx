import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { MdLockOutline } from 'react-icons/md';

import { getSessionUser } from '@/server/session';

const APP_SIGNIN_URL = import.meta.env.VITE_APP_URL
  ? `${import.meta.env.VITE_APP_URL}/auth/signin`
  : undefined;

export const Route = createFileRoute('/unauthorized')({
  beforeLoad: async () => {
    const sessionUser = await getSessionUser();

    if (sessionUser?.accessLevel === 'user' && APP_SIGNIN_URL) {
      throw redirect({ href: APP_SIGNIN_URL });
    }
  },
  component: UnauthorizedComponent,
});

function UnauthorizedComponent() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
        <MdLockOutline size={28} className="text-danger" />
      </div>
      <div>
        <h2 className="text-[18px] font-black tracking-tight text-text">
          Acesso negado
        </h2>
        <p className="mt-1 text-[13px] text-text-sub">
          Você não tem permissão para acessar esta página.
        </p>
      </div>
      <Link to="/profile" className="btn-primary mt-2">
        Voltar ao perfil
      </Link>
    </div>
  );
}
