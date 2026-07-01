import { Link, useNavigate } from '@tanstack/react-router';
import {
  MdOutlineDarkMode,
  MdOutlineDiamond,
  MdOutlineLightMode,
  MdOutlineLogout,
  MdOutlineSearch,
} from 'react-icons/md';

import { Breadcrumb } from '@/components/ui/breadcrumb.component';
import { UserAvatar } from '@/components/ui/user-avatar.component';
import { useAuth } from '@/contexts/auth.context';
import { useTheme } from '@/contexts/theme.context';
import { useSignoutMutation } from '@/queries/user.queries';

export function Topbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { userProfile: profile } = useAuth();
  const signout = useSignoutMutation();

  const logout = () => {
    signout.mutate(undefined, {
      onSuccess: () => navigate({ to: '/auth/signin' }),
    });
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-orange">
            <MdOutlineDiamond size={16} className="text-white" />
          </div>
          <span className="text-[15px] font-black tracking-tight text-text">
            Active <span className="text-orange">OS</span>
          </span>
        </div>
        <div className="h-4 w-px bg-border" />
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-1.5 text-[12px] text-text-muted">
          <MdOutlineSearch size={14} />
          <span>Buscar...</span>
          <kbd className="rounded bg-border px-1.5 py-0.5 text-[10px] font-bold text-text-muted">
            ⌘K
          </kbd>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
          className="btn-icon"
        >
          {theme === 'light' ? (
            <MdOutlineLightMode size={17} />
          ) : (
            <MdOutlineDarkMode size={17} />
          )}
        </button>

        <button
          type="button"
          onClick={logout}
          title="Sair"
          className="btn-icon"
        >
          <MdOutlineLogout size={17} />
        </button>

        <Link
          to="/user/profile"
          title="Meu perfil"
          className="transition-opacity hover:opacity-80"
        >
          <UserAvatar
            name={profile?.name}
            photoUrl={profile?.avatarUrl ?? null}
            className="h-8 w-8 bg-orange"
            initialsClassName="text-[10px]"
          />
        </Link>
      </div>
    </header>
  );
}
