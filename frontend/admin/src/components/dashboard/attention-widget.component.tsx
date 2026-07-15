import { Link } from '@tanstack/react-router';
import {
  MdChevronRight,
  MdOutlineAccessTime,
  MdOutlinePeople,
} from 'react-icons/md';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  count: number;
  linkLabel: string;
  to: string;
  search?: Record<string, string>;
}

function StatCard({
  icon: Icon,
  label,
  count,
  linkLabel,
  to,
  search,
}: StatCardProps) {
  return (
    <Link
      to={to}
      search={search}
      className="rounded-xl border border-border bg-card p-2.5 transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange/10">
          <Icon size={14} className="text-orange" />
        </div>
        <span className="text-[11px] font-medium text-text-sub">{label}</span>
      </div>

      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[22px] font-black leading-none tracking-tight text-text">
          {String(count).padStart(2, '0')}
        </span>
        <MdChevronRight size={15} className="shrink-0 text-text-muted" />
      </div>

      <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-text-sub">
        {linkLabel}
        <MdChevronRight size={11} className="text-orange" />
      </div>
    </Link>
  );
}

interface Props {
  taskCount: number;
  staleCount: number;
}

export function AttentionWidget({ taskCount, staleCount }: Props) {
  return (
    <div className="mb-5 grid grid-cols-1 gap-2.5 sm:mb-6 sm:grid-cols-2 sm:gap-3">
      <StatCard
        icon={MdOutlineAccessTime}
        label="Tarefas do dia ou atrasadas"
        count={taskCount}
        linkLabel="Ver tarefas"
        to="/projects"
      />
      <StatCard
        icon={MdOutlinePeople}
        label="Clientes sem interação (7+ dias)"
        count={staleCount}
        linkLabel="Ver clientes"
        to="/companies"
        search={{ filter: 'inativos' }}
      />
    </div>
  );
}
