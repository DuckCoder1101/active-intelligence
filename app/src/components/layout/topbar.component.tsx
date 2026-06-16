import {
  MdOutlineDarkMode,
  MdOutlineDiamond,
  MdOutlineLightMode,
  MdOutlineLogout,
  MdOutlineSearch,
} from 'react-icons/md';

import { useHandleError } from '@/hooks/useHandleError.util';
import UserService from '@/services/user.service';
import { useTheme } from '@/contexts/theme.context';
import { useNavigate } from '@tanstack/react-router';

export function Topbar() {
  const handleError = useHandleError();
  const navigate = useNavigate();

  const { theme, toggleTheme } = useTheme();

  const logout = async () => {
    try {
      await UserService.signout();
      navigate({ to: '/auth/signin' });
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-orange">
          <MdOutlineDiamond size={16} className="text-white" />
        </div>
        <span className="text-[15px] font-black tracking-tight text-text">
          Active <span className="text-orange">OS</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
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
          title={theme == 'light' ? 'Modo claro' : 'Modo escuro'}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-sub transition-colors hover:bg-bg hover:text-text"
        >
          {theme == 'light' ? (
            <MdOutlineLightMode size={17} />
          ) : (
            <MdOutlineDarkMode size={17} />
          )}
        </button>

        <button
          type="button"
          onClick={logout}
          title="Sair"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-sub transition-colors hover:bg-bg hover:text-text"
        >
          <MdOutlineLogout size={17} />
        </button>
      </div>
    </header>
  );
}
