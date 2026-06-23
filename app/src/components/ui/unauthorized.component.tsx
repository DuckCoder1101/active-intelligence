import { MdLockOutline } from 'react-icons/md';
import { Link } from '@tanstack/react-router';

export function Unauthorized() {
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
      <Link
        to="/app/admin/dashboard"
        className="mt-2 rounded-xl bg-orange px-5 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-80"
      >
        Voltar ao painel
      </Link>
    </div>
  );
}
