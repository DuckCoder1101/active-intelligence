import { MdOutlinePeople } from 'react-icons/md';

import { Badge } from '@/components/ui/badge.component';
import { Spinner } from '@/components/ui/spinner.component';

import type { AdminProfile } from '@/models/admin.model';
import { formatPhone } from '@/formatters/formatPhone';
import { formatAccessLevel } from '@/formatters/formatAccessLevel';

interface AdminsTableProps {
  admins: AdminProfile[];
  isLoading: boolean;
  onEdit: (admin: AdminProfile) => void;
}

export function AdminsTable({ admins, isLoading, onEdit }: AdminsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="text-orange" />
      </div>
    );
  }

  if (admins.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16">
        <MdOutlinePeople size={28} className="text-text-muted" />
        <p className="text-[13px] text-text-muted">
          Nenhum administrador encontrado.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-bg/60">
            {['Nome', 'CPF', 'Contato', 'Nível de acesso'].map((col) => (
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
          {admins.map((admin) => (
            <tr
              key={admin.uid}
              onClick={() => onEdit(admin)}
              className="cursor-pointer transition-colors hover:bg-bg/40"
            >
              <td className="px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-semibold text-text">
                    {admin.name}
                  </span>
                  <span className="text-[12px] text-text-muted">
                    {admin.email}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-[13px] text-text-sub">{admin.cpf}</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-[13px] text-text-sub">
                  {admin.phone ? formatPhone(admin.phone) : '—'}
                </span>
              </td>
              <td className="px-4 py-3">
                <Badge variant={admin.accessLevel === 'owner' ? 'purple' : 'orange'}>
                  {formatAccessLevel(admin.accessLevel)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
