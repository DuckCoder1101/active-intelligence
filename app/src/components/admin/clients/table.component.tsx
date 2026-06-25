import { MdOutlineBusiness } from 'react-icons/md';
import { useNavigate } from '@tanstack/react-router';

import { Badge } from '@/components/ui/badge.component';
import { Spinner } from '@/components/ui/spinner.component';

import type { Company } from '@/models/company.model';
import { formatPhone } from '@/formatters/formatPhone';

interface CompaniesTableProps {
  companies: Company[];
  isLoading: boolean;
}

export function CompaniesTable({ companies, isLoading }: CompaniesTableProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="text-orange" />
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16">
        <MdOutlineBusiness size={28} className="text-text-muted" />
        <p className="text-[13px] text-text-muted">
          Nenhum cliente encontrado.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-bg/60">
            {['Nome', 'CNPJ', 'Contato', 'Estágio'].map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-text-sub"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {companies.map((company) => (
            <tr
              key={company.companyId}
              onClick={() =>
                navigate({
                  to: '/app/admin/clients/$client_id',
                  params: { client_id: company.companyId },
                })
              }
              className="cursor-pointer transition-colors hover:bg-bg/40"
            >
              <td className="px-4 py-3">
                <span className="text-[13px] font-semibold text-text">
                  {company.displayName}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-[13px] text-text-sub">
                  {company.legalInformation.documentNumber}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] text-text-sub">
                    {company.contact?.email ?? '—'}
                  </span>
                  {company.contact?.phone && (
                    <span className="text-[12px] text-text-muted">
                      {formatPhone(company.contact.phone)}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={
                    company.companyStage === 'operacional' ? 'orange' : 'default'
                  }
                >
                  {company.companyStage}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
