import { Link, useNavigate } from '@tanstack/react-router';
import {
  MdOutlineDarkMode,
  MdOutlineLightMode,
  MdOutlineLogout,
} from 'react-icons/md';

import { Breadcrumb } from '@/components/layout/breadcrumb.component';
import { NotificationBell } from '@/components/layout/notification-bell.component';
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
        <img
          src={
            theme === 'light'
              ? '/icons/icon-text-dark.png'
              : '/icons/icon-text.png'
          }
          alt="Ícone da Guará"
          className="w-25 mx-5"
        />

        <div className="h-4 w-px bg-border" />
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell />

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
          to="/profile"
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
