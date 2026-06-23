import { BROADCRUMB_ROUTE_MAP } from '@/constants/broadcrumb-routes.const';
import { Link, useRouterState } from '@tanstack/react-router';
import { MdChevronRight } from 'react-icons/md';

export function Breadcrumb() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const match = BROADCRUMB_ROUTE_MAP.find((r) => r.test(pathname));
  if (!match) return null;

  const { crumbs } = match;

  return (
    <nav className="flex items-center gap-1 text-[12px] text-text-muted">
      {crumbs.map((crumb, i) => (
        <span key={crumb.label} className="flex items-center gap-1">
          {i > 0 && (
            <MdChevronRight size={14} className="shrink-0 text-text-muted/50" />
          )}
          {crumb.to ? (
            <Link
              to={crumb.to}
              className="text-text-sub transition-colors hover:text-text"
            >
              {crumb.label}
            </Link>
          ) : (
            <span
              className={
                i === crumbs.length - 1
                  ? 'font-semibold text-text'
                  : 'text-text-sub'
              }
            >
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
