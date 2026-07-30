import { Link } from '@tanstack/react-router';
import type { ElementType, ReactNode } from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

export interface SidebarNavItem {
  key: string;
  label: string;
  icon: ElementType;
  /** Mostra o item desabilitado com badge "em breve" — ignora `to`/`onClick`. */
  soon?: boolean;
  /** Item de navegação: renderiza como Link. */
  to?: string;
  params?: Record<string, string>;
  exact?: boolean;
  /** Item de ação: renderiza como button, seleção controlada localmente. */
  onClick?: () => void;
  active?: boolean;
}

interface SidebarProps {
  items: SidebarNavItem[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  footer?: ReactNode;
  className?: string;
}

/**
 * Modelo base de sidebar do admin — recolhível via um único botão no topo
 * (mesmo padrão da sidebar do app do cliente), com transição suave de
 * largura/conteúdo. Aceita itens de rota (navegação via Link) ou itens de
 * ação (seleção local, ex: módulos de Configurações).
 */
export function Sidebar({
  items,
  collapsed,
  onToggleCollapse,
  footer,
  className,
}: SidebarProps) {
  return (
    <aside
      className={[
        'flex shrink-0 flex-col overflow-hidden border-r border-border bg-card transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-17.5' : 'w-56',
        className ?? '',
      ].join(' ')}
    >
      <div
        className={`flex items-center px-3 pb-2 pt-3 ${collapsed ? 'justify-center' : 'justify-end'}`}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="btn-icon text-text-muted hover:text-text"
        >
          {collapsed ? <MdChevronRight size={18} /> : <MdChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 py-1">
        {items.map((item) => {
          const label = (
            <span
              className={[
                'overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out',
                collapsed ? 'max-w-0 opacity-0' : 'max-w-40 flex-1 opacity-100',
              ].join(' ')}
            >
              {item.label}
            </span>
          );

          const content = (
            <>
              <item.icon size={16} style={{ flexShrink: 0 }} />
              {label}
              {item.soon && !collapsed && (
                <span className="shrink-0 rounded-full bg-orange/10 px-1.5 py-0.5 text-[9px] font-bold text-orange">
                  em breve
                </span>
              )}
            </>
          );

          const rowClass = [
            'flex items-center gap-2.5 rounded-xl py-2.5 text-[13px] font-semibold transition-all duration-300 ease-in-out',
            collapsed ? 'justify-center px-0' : 'px-3',
          ].join(' ');

          if (item.soon) {
            return (
              <div
                key={item.key}
                title={collapsed ? item.label : undefined}
                className={`${rowClass} text-text-muted opacity-60`}
              >
                {content}
              </div>
            );
          }

          if (item.to) {
            return (
              <Link
                key={item.key}
                to={item.to as never}
                params={item.params as never}
                activeOptions={{ exact: item.exact ?? false }}
                title={collapsed ? item.label : undefined}
                className={`${rowClass} text-text-sub hover:bg-bg hover:text-text [&.active]:bg-orange/10 [&.active]:text-orange`}
                activeProps={{ className: 'active' }}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              title={collapsed ? item.label : undefined}
              className={[
                rowClass,
                'text-left',
                item.active
                  ? 'bg-orange/10 text-orange'
                  : 'text-text-sub hover:bg-bg hover:text-text',
              ].join(' ')}
            >
              {content}
            </button>
          );
        })}
      </nav>

      {footer && <div className="border-t border-border py-2">{footer}</div>}
    </aside>
  );
}
