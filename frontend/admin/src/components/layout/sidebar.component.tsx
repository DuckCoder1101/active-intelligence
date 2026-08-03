import { Link } from '@tanstack/react-router';
import type { ElementType, ReactNode } from 'react';
import { MdChevronLeft, MdChevronRight, MdClose } from 'react-icons/md';

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
  /** Controla o drawer mobile (abaixo do breakpoint `lg`) — no desktop a sidebar fica sempre visível. */
  isOpen: boolean;
  onClose: () => void;
  footer?: ReactNode;
  className?: string;
}

/**
 * Modelo base de sidebar do admin — recolhível via um único botão no topo
 * (mesmo padrão da sidebar do app do cliente), com transição suave de
 * largura/conteúdo. Aceita itens de rota (navegação via Link) ou itens de
 * ação (seleção local, ex: módulos de Configurações).
 *
 * Abaixo de `lg`, vira um drawer (com backdrop) sempre expandido — o botão
 * de recolher é um recurso de desktop e fica escondido no mobile, que só
 * abre/fecha via botão de menu (hambúrguer) e este botão de fechar. A
 * posição/visibilidade no desktop (`lg:`) fica a cargo de quem chama, via
 * `className`.
 */
export function Sidebar({
  items,
  collapsed,
  onToggleCollapse,
  isOpen,
  onClose,
  footer,
  className,
}: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          'flex shrink-0 flex-col overflow-hidden border-r border-border bg-card transition-[width,translate] duration-300 ease-in-out',
          collapsed ? 'w-60 lg:w-17.5' : 'w-60 lg:w-56',
          'fixed inset-y-0 left-0 z-40',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
          className ?? '',
        ].join(' ')}
      >
        {/* Close button — mobile only; desktop has no explicit toggle to hide the sidebar */}
        <div className="flex items-center justify-end px-3 pt-3 lg:hidden">
          <button
            type="button"
            onClick={onClose}
            title="Fechar menu"
            className="btn-icon text-text-muted hover:text-text"
          >
            <MdClose size={18} />
          </button>
        </div>

        {/* Collapse toggle — desktop only; no mobile a sidebar é sempre expandida e some/aparece via botão de menu (hambúrguer) */}
        <div
          className={`hidden items-center px-3 pb-2 pt-3 lg:flex ${collapsed ? 'justify-center' : 'justify-end'}`}
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
                  collapsed
                    ? 'max-w-40 flex-1 opacity-100 lg:max-w-0 lg:flex-none lg:opacity-0'
                    : 'max-w-40 flex-1 opacity-100',
                ].join(' ')}
              >
                {item.label}
              </span>
            );

            const content = (
              <>
                <item.icon size={16} style={{ flexShrink: 0 }} />
                {label}
                {item.soon && (
                  <span
                    className={[
                      'shrink-0 rounded-full bg-orange/10 px-1.5 py-0.5 text-[9px] font-bold text-orange',
                      collapsed ? 'lg:hidden' : '',
                    ].join(' ')}
                  >
                    em breve
                  </span>
                )}
              </>
            );

            const rowClass = [
              'flex items-center gap-2.5 rounded-xl py-2.5 text-[13px] font-semibold transition-all duration-300 ease-in-out',
              collapsed ? 'px-3 lg:justify-center lg:px-0' : 'px-3',
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
                  onClick={onClose}
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
                onClick={() => {
                  item.onClick?.();
                  onClose();
                }}
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
    </>
  );
}
