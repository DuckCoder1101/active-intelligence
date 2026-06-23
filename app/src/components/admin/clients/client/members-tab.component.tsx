import { useState, useEffect, useRef, useCallback } from 'react';
import { IMaskInput } from 'react-imask';
import { MdAdd, MdPersonRemove, MdStar } from 'react-icons/md';

import MembershipService from '@/services/membership.service';
import { Spinner } from '@/components/ui/spinner.component';
import { useHandleError } from '@/hooks/useHandleError.util';
import { useSnackbar } from '@/contexts/snackbar.context';

import type { MemberModel, MemberRole } from '@t/membership.model';

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: 'Owner',
  editor: 'Editor',
  viewer: 'Viewer',
};

const ROLE_CLASSES: Record<MemberRole, string> = {
  owner: 'bg-orange/15 text-orange',
  editor: 'bg-border text-text',
  viewer: 'bg-bg text-text-muted',
};

type Props = {
  companyId: string;
};

export function CompanyMembersTab({ companyId }: Props) {
  const [members, setMembers] = useState<MemberModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newCpf, setNewCpf] = useState('');
  const [newRole, setNewRole] = useState<MemberRole>('viewer');
  const [isAdding, setIsAdding] = useState(false);
  const [loadingUids, setLoadingUids] = useState<Set<string>>(new Set());

  const handleError = useHandleError();
  const { pushSnackbar } = useSnackbar();

  const handleErrorRef = useRef(handleError);
  handleErrorRef.current = handleError;

  const setUidLoading = (uid: string, on: boolean) => {
    setLoadingUids((prev) => {
      const next = new Set(prev);
      on ? next.add(uid) : next.delete(uid);
      return next;
    });
  };

  const load = useCallback(() => {
    setIsLoading(true);
    MembershipService.listMembers(companyId)
      .then(setMembers)
      .catch((err) => handleErrorRef.current(err))
      .finally(() => setIsLoading(false));
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSetOwner = async (uid: string) => {
    setUidLoading(uid, true);
    try {
      await MembershipService.setOwner(uid, companyId);
      pushSnackbar({ type: 'success', message: 'Owner definido!' });
      load();
    } catch (err) {
      handleError(err);
    } finally {
      setUidLoading(uid, false);
    }
  };

  const handleRemove = async (uid: string) => {
    setUidLoading(uid, true);
    try {
      await MembershipService.removeMember(uid, companyId);
      pushSnackbar({ type: 'success', message: 'Membro removido!' });
      load();
    } catch (err) {
      handleError(err);
    } finally {
      setUidLoading(uid, false);
    }
  };

  const handleAdd = async () => {
    const cpf = newCpf.replace(/\D/g, '');
    if (cpf.length !== 11) return;

    setIsAdding(true);
    try {
      await MembershipService.saveMember(cpf, companyId, newRole);
      pushSnackbar({ type: 'success', message: 'Membro adicionado!' });
      setNewCpf('');
      setNewRole('viewer');
      load();
    } catch (err) {
      handleError(err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Adicionar membro */}
      <div className="rounded-xl border border-border p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          Adicionar membro
        </p>
        <div className="flex gap-2">
          <IMaskInput
            mask="000.000.000-00"
            value={newCpf}
            onAccept={(value: string) => setNewCpf(value)}
            onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleAdd()}
            placeholder="000.000.000-00"
            type="tel"
            className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-[13px] text-text placeholder:text-text-muted outline-none focus:border-orange focus:ring-1 focus:ring-orange"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as MemberRole)}
            className="rounded-lg border border-border bg-bg px-2 py-2 text-[13px] text-text outline-none focus:border-orange focus:ring-1 focus:ring-orange"
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="owner">Owner</option>
          </select>
          <button
            type="button"
            disabled={newCpf.replace(/\D/g, '').length !== 11 || isAdding}
            onClick={handleAdd}
            className="flex items-center gap-1.5 rounded-lg bg-orange px-3 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {isAdding ? <Spinner size={12} /> : <MdAdd size={15} />}
            Adicionar
          </button>
        </div>
      </div>

      {/* Lista de membros */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size={20} />
        </div>
      ) : members.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-text-muted">
          Nenhum membro cadastrado.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {members.map((m) => {
            const isPending = loadingUids.has(m.user.uid);
            return (
              <li
                key={m.user.uid}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange/15 text-[11px] font-bold text-orange">
                    {m.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-text">
                      {m.user.name}
                    </p>
                    <p className="truncate font-mono text-[10px] text-text-muted">
                      {m.user.uid}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${ROLE_CLASSES[m.role]}`}
                  >
                    {ROLE_LABELS[m.role]}
                  </span>

                  {m.role !== 'owner' && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleSetOwner(m.user.uid)}
                      title="Definir como owner"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-sub transition-colors hover:border-orange/50 hover:bg-orange/10 hover:text-orange disabled:opacity-40"
                    >
                      {isPending ? <Spinner size={11} /> : <MdStar size={14} />}
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleRemove(m.user.uid)}
                    title="Remover membro"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-sub transition-colors hover:border-danger/50 hover:bg-danger/10 hover:text-danger disabled:opacity-40"
                  >
                    {isPending && m.role === 'owner' ? (
                      <Spinner size={11} />
                    ) : (
                      <MdPersonRemove size={14} />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
