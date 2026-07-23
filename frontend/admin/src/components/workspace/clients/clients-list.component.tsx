import { useNavigate } from '@tanstack/react-router';
import { MdChevronRight, MdOutlinePeople } from 'react-icons/md';

import { formatPhone } from '@/formatters/formatPhone';
import type { Company } from '@/models/company.model';
import { companyColor, companyInitials } from '@/utils/company-color.util';

interface ClientsListProps {
  companies: Company[];
}

export function ClientsList({ companies }: ClientsListProps) {
  const navigate = useNavigate();

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12">
        <MdOutlinePeople size={24} className="text-text-muted" />
        <p className="text-[13px] text-text-muted">
          Nenhum cliente encontrado.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-card">
      {companies.map((company) => (
        <button
          key={company.companyId}
          type="button"
          onClick={() =>
            navigate({
              to: '/workspace/clients',
              search: { clients: company.companyId },
            })
          }
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg/40"
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white ${companyColor(company.companyId)}`}
          >
            {companyInitials(company.displayName)}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-text">
              {company.displayName}
            </span>
            <span className="block truncate text-[11px] text-text-sub">
              {formatPhone(company.contact.phone)} · {company.contact.email}
            </span>
          </span>

          <span
            className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider sm:block ${
              company.companyStage === 'operacional'
                ? 'bg-success/10 text-success'
                : 'bg-orange/10 text-orange'
            }`}
          >
            {company.companyStage}
          </span>

          <MdChevronRight size={16} className="shrink-0 text-text-muted" />
        </button>
      ))}
    </div>
  );
}
