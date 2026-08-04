import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import {
  MdMenu,
  MdOutlineLogout,
  MdOutlineDarkMode,
  MdOutlineLightMode,
} from 'react-icons/md';

import { NotificationBell } from '@/components/layout/notification-bell.component';
import { UserAvatar } from '@/components/ui/user-avatar.component';
import { ProfileModal } from '@/components/user/profile-modal.component';
import { useAuth } from '@/contexts/auth.context';
import { useTheme } from '@/contexts/theme.context';
import { useSignoutMutation } from '@/queries/user.queries';

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { userProfile: profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const signout = useSignoutMutation();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleLogout = () => {
    signout.mutate(undefined, {
      onSuccess: () => navigate({ to: '/auth/signin' }),
    });
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="text-text-muted transition-colors hover:text-text lg:hidden"
          >
            <MdMenu size={20} />
          </button>
        )}

        <span className="hidden text-[11px] font-bold uppercase tracking-[1.2px] text-text-muted sm:block">
          Portal da empresa
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
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
          onClick={handleLogout}
          title="Sair"
          className="btn-icon hidden lg:flex"
        >
          <MdOutlineLogout size={17} />
        </button>

        <button
          type="button"
          onClick={() => setIsProfileModalOpen(true)}
          title="Meu perfil"
          className="transition-opacity hover:opacity-80"
        >
          <UserAvatar
            name={profile?.name}
            photoUrl={profile?.avatarUrl ?? null}
            className="h-8 w-8 bg-orange"
            initialsClassName="text-[10px]"
          />
        </button>
      </div>

      {isProfileModalOpen && (
        <ProfileModal onClose={() => setIsProfileModalOpen(false)} />
      )}
    </header>
  );
}
