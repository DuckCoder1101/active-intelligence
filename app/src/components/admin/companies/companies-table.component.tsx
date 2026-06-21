import {
  MdEdit,
  MdDelete,
  MdChevronRight,
  MdOutlineBusiness,
} from 'react-icons/md';

import { Badge } from '@/components/ui/badge.component';
import { Spinner } from '@/components/ui/spinner.component';

import type { Company } from '@t/company.model';
import { formatPhone } from '@/formatters/formatPhone';

interface CompaniesTableProps {
  companies: Company[];
  isLoading: boolean;
  deletingId: string | null;
  onEdit: (company: Company) => void;
  onDelete: (companyId: string) => void;
}

export function CompaniesTable({
  companies,
  isLoading,
  deletingId,
  onEdit,
  onDelete,
}: CompaniesTableProps) {
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
            {['Nome', 'CNPJ', 'Contato', 'Estágio', 'Ações'].map((col) => (
              <th
                key={col}
                className={[
                  'px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-text-sub',
                  col === 'Ações' ? 'text-center' : 'text-left',
                ].join(' ')}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {companies.map((company) => {
            return (
              <tr
                key={company.companyId}
                className="transition-colors hover:bg-bg/40"
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
                      company.companyStage === 'operacional'
                        ? 'orange'
                        : 'default'
                    }
                  >
                    {company.companyStage}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button className="text-text-muted transition-colors hover:text-text">
                      <MdChevronRight size={18} />
                    </button>
                    <button
                      onClick={() => onEdit(company)}
                      className="text-text-muted transition-colors hover:text-text"
                      title="Editar"
                    >
                      <MdEdit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(company.companyId)}
                      disabled={deletingId === company.companyId}
                      className="text-text-muted transition-colors hover:text-danger disabled:opacity-50"
                      title="Excluir"
                    >
                      {deletingId === company.companyId ? (
                        <Spinner size={14} />
                      ) : (
                        <MdDelete size={16} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
