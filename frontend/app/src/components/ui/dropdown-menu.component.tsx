import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { IconType } from 'react-icons';
import { MdExpandMore } from 'react-icons/md';

export interface DropdownMenuItem {
  label: string;
  icon?: IconType;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}

interface DropdownMenuProps {
  label: string;
  icon?: IconType;
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
  triggerClassName?: string;
}

/**
 * Botão com setinha que abre um menu de ações (portal, posicionado contra o
 * trigger, fecha em click-fora/Escape/scroll). Genérico — passe `items` com
 * label/icon/onClick para reaproveitar em qualquer lugar que hoje seria uma
 * fileira de botões (ex: ações de exportação, ações em massa de uma lista).
 */
export function DropdownMenu({
  label,
  icon: Icon,
  items,
  align = 'left',
  triggerClassName = 'btn-ghost-border',
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    right: number;
  } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      setPosition({
        top: rect.bottom + 6,
        left: rect.left,
        right: window.innerWidth - rect.right,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={triggerClassName}
      >
        {Icon && <Icon size={16} />}
        {label}
        <MdExpandMore
          size={16}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: position.top,
              ...(align === 'right'
                ? { right: position.right }
                : { left: position.left }),
            }}
            className="z-50 min-w-[200px] overflow-hidden rounded-md border border-border bg-card py-1 shadow-lg"
          >
            {items.map((item) => {
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    setOpen(false);
                    item.onClick();
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    item.variant === 'danger'
                      ? 'text-danger hover:bg-danger/10'
                      : 'text-text hover:bg-bg'
                  }`}
                >
                  {ItemIcon && <ItemIcon size={15} className="shrink-0" />}
                  {item.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
