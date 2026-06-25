import { MdOutlinePeople } from 'react-icons/md';

import { Badge } from '@/components/ui/badge.component';
import { Spinner } from '@/components/ui/spinner.component';

import type { UserProfile } from '@/models/user.model';
import { formatPhone } from '@/formatters/formatPhone';
import { formatAccessLevel } from '@/formatters/formatAccessLevel';

interface UsersTableProps {
  users: UserProfile[];
  isLoading: boolean;
  onEdit: (user: UserProfile) => void;
}

export function UsersTable({ users, isLoading, onEdit }: UsersTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="text-orange" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16">
        <MdOutlinePeople size={28} className="text-text-muted" />
        <p className="text-[13px] text-text-muted">
          Nenhum usuário encontrado.
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
          {users.map((user) => (
            <tr
              key={user.uid}
              onClick={() => onEdit(user)}
              className="cursor-pointer transition-colors hover:bg-bg/40"
            >
              <td className="px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-semibold text-text">
                    {user.name}
                  </span>
                  <span className="text-[12px] text-text-muted">
                    {user.email}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-[13px] text-text-sub">{user.cpf}</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-[13px] text-text-sub">
                  {user.phone ? formatPhone(user.phone) : '—'}
                </span>
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={
                    user.accessLevel === 'owner'
                      ? 'purple'
                      : user.accessLevel === 'admin'
                        ? 'orange'
                        : 'default'
                  }
                >
                  {formatAccessLevel(user.accessLevel)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
