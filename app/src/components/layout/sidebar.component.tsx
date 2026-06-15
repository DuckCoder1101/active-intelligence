import { Link } from '@tanstack/react-router';
import { MdOutlineLogout } from 'react-icons/md';

import { useAuth } from '@/contexts/auth.context';
import UserService from '@/services/user.service';
import { NAVBAR_ITEMS } from '@/constants/navbar-items.const';
import { useHandleError } from '@/hooks/useHandleError.util';

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function Sidebar() {
  const { profile } = useAuth();
  const handleError = useHandleError();

  async function handleLogout() {
    try {
      await UserService.signout();
    } catch (err) {
      handleError(err);
    }
  }

  return (
    <aside className="flex w-60.5 shrink-0 flex-col overflow-y-auto bg-sidebar">
      {/* Logo */}
      <div className="border-b border-[#1a2d3e] px-5 pb-3.5 pt-4.5">
        <div className="text-[15px] font-black tracking-tight text-slate-100">
          Active<span className="text-primary">Intelligence</span>
        </div>
        <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[1.2px] text-[#334155]">
          Data Lake Platform
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-1">
        {NAVBAR_ITEMS.map((section) => (
          <div key={section.label} className="pt-3 pb-0.5">
            <div className="px-5 pb-1.5 text-[9px] font-black uppercase tracking-[1px] text-[#263a4d]">
              {section.label}
            </div>
            {section.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: false }}
                className="flex cursor-pointer items-center gap-2.5 border-l-[3px] border-transparent px-5 py-2 text-[12px] font-medium text-slate-500 transition-colors hover:bg-sidebar-hover hover:text-slate-300"
                activeProps={{
                  className:
                    'flex cursor-pointer items-center gap-2.5 border-l-[3px] border-primary bg-sidebar-hover px-5 py-2 text-[12px] font-medium text-slate-100 transition-colors',
                }}
              >
                <item.icon size={17} style={{ flexShrink: 0 }} />
                <span className="flex-1">{item.label}</span>
                {item.badge != null && (
                  <span className="rounded-full bg-danger px-1.5 py-px text-[9px] font-black text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto flex items-center gap-2.5 border-t border-[#1a2d3e] px-4 py-3">
        <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white">
          {profile?.name ? getInitials(profile.name) : '?'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] font-bold text-[#e2e8f0]">
            {profile?.name ?? '—'}
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title="Sair"
          className="ml-auto cursor-pointer text-[#475569] transition-colors hover:text-slate-400"
        >
          <MdOutlineLogout size={17} />
        </button>
      </div>
    </aside>
  );
}
