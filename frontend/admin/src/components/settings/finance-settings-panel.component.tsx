import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useBlocker } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { MdAdd, MdDeleteOutline } from 'react-icons/md';
import { toast } from 'react-toastify';

import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import { UnsavedChangesModal } from '@/components/settings/unsaved-changes-modal.component';
import { Spinner } from '@/components/ui/spinner.component';
import {
  FINANCE_CATEGORY_TYPES,
  FINANCE_CATEGORY_TYPE_LABELS,
} from '@/models/finance.model';
import type { FinanceCategoryType } from '@/models/finance.model';
import {
  financeAccountsQueryOptions,
  financeSubcategoriesQueryOptions,
  useDeleteFinanceAccountMutation,
  useDeleteFinanceSubcategoryMutation,
  useSaveFinanceAccountMutation,
  useSaveFinanceSubcategoryMutation,
} from '@/queries/finance.queries';
import type {
  DraftAccount,
  DraftSubcategoriesByCategory,
  DraftSubcategory,
} from '@/utils/finance-settings-draft.util';
import {
  isAccountsDirty,
  isSubcategoriesDirty,
  newKey,
  toDraftAccounts,
  toDraftSubcategoriesByCategory,
} from '@/utils/finance-settings-draft.util';

type Section = 'subcategories' | 'accounts';

interface RemovingSubcategory {
  categoryType: FinanceCategoryType;
  key: string;
  name: string;
}

export function FinanceSettingsPanel() {
  const queryClient = useQueryClient();
  const { data: subcategories } = useSuspenseQuery(financeSubcategoriesQueryOptions());
  const { data: accounts } = useSuspenseQuery(financeAccountsQueryOptions());

  const saveSubcategory = useSaveFinanceSubcategoryMutation();
  const deleteSubcategory = useDeleteFinanceSubcategoryMutation();
  const saveAccount = useSaveFinanceAccountMutation();
  const deleteAccount = useDeleteFinanceAccountMutation();

  const [section, setSection] = useState<Section>('subcategories');
  const [selectedCategoryType, setSelectedCategoryType] =
    useState<FinanceCategoryType>('receita');

  const [originalSubs, setOriginalSubs] = useState<DraftSubcategoriesByCategory>(
    () => toDraftSubcategoriesByCategory(subcategories),
  );
  const [draftSubs, setDraftSubs] = useState<DraftSubcategoriesByCategory>(
    () => toDraftSubcategoriesByCategory(subcategories),
  );
  const [removedSubcategoryIds, setRemovedSubcategoryIds] = useState<string[]>([]);

  const [originalAccounts, setOriginalAccounts] = useState<DraftAccount[]>(() =>
    toDraftAccounts(accounts),
  );
  const [draftAccounts, setDraftAccounts] = useState<DraftAccount[]>(() =>
    toDraftAccounts(accounts),
  );
  const [removedAccountIds, setRemovedAccountIds] = useState<string[]>([]);

  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const [showAddSub, setShowAddSub] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [removingSub, setRemovingSub] = useState<RemovingSubcategory | null>(null);

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [removingAccount, setRemovingAccount] = useState<DraftAccount | null>(null);

  const newSubInputRef = useRef<HTMLInputElement>(null);
  const newAccountInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);

  const dirty =
    isSubcategoriesDirty(draftSubs, originalSubs, removedSubcategoryIds) ||
    isAccountsDirty(draftAccounts, originalAccounts, removedAccountIds);

  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    withResolver: true,
  });

  function resetSubcategoriesDraft(source: typeof subcategories) {
    const fresh = toDraftSubcategoriesByCategory(source);
    setOriginalSubs(fresh);
    setDraftSubs(fresh);
    setRemovedSubcategoryIds([]);
  }

  function resetAccountsDraft(source: typeof accounts) {
    const fresh = toDraftAccounts(source);
    setOriginalAccounts(fresh);
    setDraftAccounts(fresh);
    setRemovedAccountIds([]);
  }

  const handleCancel = () => {
    resetSubcategoriesDraft(subcategories);
    resetAccountsDraft(accounts);
  };

  // --- Subcategorias ---

  const currentSubGroup = draftSubs[selectedCategoryType];

  const handleAddSubcategory = () => {
    if (!newSubName.trim()) {
      return;
    }
    setDraftSubs((prev) => ({
      ...prev,
      [selectedCategoryType]: [
        ...prev[selectedCategoryType],
        { key: newKey(), name: newSubName.trim() },
      ],
    }));
    setNewSubName('');
    setShowAddSub(false);
  };

  const requestRemoveSubcategory = (sub: DraftSubcategory) => {
    if (!sub.subcategoryId) {
      setDraftSubs((prev) => ({
        ...prev,
        [selectedCategoryType]: prev[selectedCategoryType].filter(
          (s) => s.key !== sub.key,
        ),
      }));
      return;
    }
    setRemovingSub({ categoryType: selectedCategoryType, key: sub.key, name: sub.name });
  };

  const handleConfirmRemoveSubcategory = () => {
    if (!removingSub) {
      return;
    }
    const { categoryType, key } = removingSub;
    const sub = draftSubs[categoryType].find((s) => s.key === key);
    setDraftSubs((prev) => ({
      ...prev,
      [categoryType]: prev[categoryType].filter((s) => s.key !== key),
    }));
    if (sub?.subcategoryId) {
      setRemovedSubcategoryIds((prev) => [...prev, sub.subcategoryId!]);
    }
    setRemovingSub(null);
  };

  const handleRenameSubcategory = (key: string, name: string) => {
    setDraftSubs((prev) => ({
      ...prev,
      [selectedCategoryType]: prev[selectedCategoryType].map((s) =>
        s.key === key ? { ...s, name } : s,
      ),
    }));
  };

  const handleReorderSubcategory = (fromKey: string, toKey: string) => {
    setDraftSubs((prev) => {
      const group = prev[selectedCategoryType];
      const fromIndex = group.findIndex((s) => s.key === fromKey);
      const toIndex = group.findIndex((s) => s.key === toKey);
      if (fromIndex === -1 || toIndex === -1) {
        return prev;
      }
      const next = [...group];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { ...prev, [selectedCategoryType]: next };
    });
  };

  // --- Contas ---

  const handleAddAccount = () => {
    if (!newAccountName.trim()) {
      return;
    }
    setDraftAccounts((prev) => [
      ...prev,
      { key: newKey(), name: newAccountName.trim() },
    ]);
    setNewAccountName('');
    setShowAddAccount(false);
  };

  const requestRemoveAccount = (account: DraftAccount) => {
    if (!account.accountId) {
      setDraftAccounts((prev) => prev.filter((a) => a.key !== account.key));
      return;
    }
    setRemovingAccount(account);
  };

  const handleConfirmRemoveAccount = () => {
    if (!removingAccount) {
      return;
    }
    setDraftAccounts((prev) => prev.filter((a) => a.key !== removingAccount.key));
    if (removingAccount.accountId) {
      setRemovedAccountIds((prev) => [...prev, removingAccount.accountId!]);
    }
    setRemovingAccount(null);
  };

  const handleRenameAccount = (key: string, name: string) => {
    setDraftAccounts((prev) => prev.map((a) => (a.key === key ? { ...a, name } : a)));
  };

  // --- Salvar ---

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const categoryType of FINANCE_CATEGORY_TYPES) {
        const group = draftSubs[categoryType];
        const originalGroup = originalSubs[categoryType];
        for (let i = 0; i < group.length; i++) {
          const sub = group[i];
          const origIndex = originalGroup.findIndex(
            (o) => o.subcategoryId === sub.subcategoryId,
          );
          const changed =
            !sub.subcategoryId || origIndex === -1 ||
            originalGroup[origIndex].name !== sub.name || origIndex !== i;
          if (changed) {
            await saveSubcategory.mutateAsync({
              subcategoryId: sub.subcategoryId,
              categoryType,
              name: sub.name,
              order: i,
            });
          }
        }
      }
      for (const subcategoryId of removedSubcategoryIds) {
        await deleteSubcategory.mutateAsync(subcategoryId);
      }

      for (const acc of draftAccounts) {
        const orig = originalAccounts.find((o) => o.accountId === acc.accountId);
        const changed = !acc.accountId || !orig || orig.name !== acc.name;
        if (changed) {
          await saveAccount.mutateAsync({ accountId: acc.accountId, name: acc.name });
        }
      }
      for (const accountId of removedAccountIds) {
        await deleteAccount.mutateAsync(accountId);
      }

      toast.success('Configurações salvas!');
      const [freshSubs, freshAccounts] = await Promise.all([
        queryClient.fetchQuery(financeSubcategoriesQueryOptions()),
        queryClient.fetchQuery(financeAccountsQueryOptions()),
      ]);
      resetSubcategoriesDraft(freshSubs);
      resetAccountsDraft(freshAccounts);
    } catch {
      toast.error('Não foi possível salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-6 py-4">
        <div>
          <h1 className="text-[18px] font-bold text-text">Financeiro</h1>
          <p className="mt-0.5 text-[12px] text-text-sub">
            Subcategorias e contas usadas nos lançamentos do módulo Financeiro.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 gap-2 border-b border-border px-6 pt-4">
        {(
          [
            ['subcategories', 'Subcategorias'],
            ['accounts', 'Contas'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={`rounded-t-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
              section === key
                ? 'border-b-2 border-orange text-text'
                : 'text-text-muted hover:text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 gap-8 overflow-y-auto px-6 py-6">
        {section === 'subcategories' ? (
          <>
            <div className="flex w-full max-w-sm shrink-0 flex-col gap-2">
              <h2 className="text-[13px] font-bold text-text">Categoria</h2>
              {FINANCE_CATEGORY_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedCategoryType(type)}
                  className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-[13px] font-semibold transition-colors ${
                    selectedCategoryType === type
                      ? 'border-orange bg-orange/10 text-text'
                      : 'border-border bg-card text-text-sub hover:text-text'
                  }`}
                >
                  <span className="flex-1 truncate">
                    {FINANCE_CATEGORY_TYPE_LABELS[type]}
                  </span>
                  <span className="shrink-0 rounded-full bg-border px-2 py-0.5 text-[10px] font-bold text-text-muted">
                    {draftSubs[type].length}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-1 flex-col gap-2">
              <h2 className="text-[13px] font-bold text-text">
                Subcategorias de {FINANCE_CATEGORY_TYPE_LABELS[selectedCategoryType]}
              </h2>

              {currentSubGroup.length === 0 && !showAddSub && (
                <p className="mb-1 text-[12px] text-text-muted">
                  Essa categoria ainda não tem subcategorias.
                </p>
              )}

              {currentSubGroup.map((sub) => (
                <div
                  key={sub.key}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggingKey(sub.key);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggingKey && draggingKey !== sub.key) {
                      setDragOverKey(sub.key);
                    }
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDragOverKey(null);
                    }
                  }}
                  onDrop={() => {
                    if (draggingKey && draggingKey !== sub.key) {
                      handleReorderSubcategory(draggingKey, sub.key);
                    }
                    setDraggingKey(null);
                    setDragOverKey(null);
                  }}
                  onDragEnd={() => {
                    setDraggingKey(null);
                    setDragOverKey(null);
                  }}
                  className={`group flex max-w-sm cursor-grab items-center gap-2 rounded-xl border px-3.5 py-2 transition-colors active:cursor-grabbing ${
                    dragOverKey === sub.key
                      ? 'border-orange bg-orange/10'
                      : draggingKey === sub.key
                        ? 'border-border/40 bg-bg/30 opacity-50'
                        : 'border-border bg-card'
                  }`}
                >
                  <input
                    value={sub.name}
                    onChange={(e) => handleRenameSubcategory(sub.key, e.target.value)}
                    className="flex-1 bg-transparent text-[13px] text-text outline-none"
                  />
                  {!sub.subcategoryId && (
                    <span className="shrink-0 rounded-full bg-orange/10 px-2 py-0.5 text-[9px] font-bold uppercase text-orange">
                      Novo
                    </span>
                  )}
                  <button
                    type="button"
                    title="Remover subcategoria"
                    onClick={() => requestRemoveSubcategory(sub)}
                    className="shrink-0 text-text-muted/50 opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                  >
                    <MdDeleteOutline size={15} />
                  </button>
                </div>
              ))}

              {showAddSub ? (
                <div className="flex max-w-sm items-center gap-2">
                  <input
                    ref={newSubInputRef}
                    type="text"
                    autoFocus
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSubcategory();
                      }
                      if (e.key === 'Escape') {
                        setShowAddSub(false);
                        setNewSubName('');
                      }
                    }}
                    placeholder="Nome da subcategoria"
                    className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-[13px] text-text outline-none focus:border-orange"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubcategory}
                    disabled={!newSubName.trim()}
                    className="rounded-lg bg-orange px-3 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSub(false);
                      setNewSubName('');
                    }}
                    className="rounded-lg border border-border px-3 py-2 text-[12px] text-text-sub transition-colors hover:bg-bg"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddSub(true)}
                  className="flex max-w-sm items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-[12px] font-semibold text-text-muted transition-colors hover:border-orange hover:text-orange"
                >
                  <MdAdd size={15} />
                  Nova subcategoria
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex w-full max-w-sm flex-col gap-2">
            <h2 className="text-[13px] font-bold text-text">Contas</h2>

            {draftAccounts.length === 0 && !showAddAccount && (
              <p className="mb-1 text-[12px] text-text-muted">
                Nenhuma conta cadastrada.
              </p>
            )}

            {draftAccounts.map((account) => (
              <div
                key={account.key}
                className="group flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2"
              >
                <input
                  value={account.name}
                  onChange={(e) => handleRenameAccount(account.key, e.target.value)}
                  className="flex-1 bg-transparent text-[13px] text-text outline-none"
                />
                {!account.accountId && (
                  <span className="shrink-0 rounded-full bg-orange/10 px-2 py-0.5 text-[9px] font-bold uppercase text-orange">
                    Novo
                  </span>
                )}
                <button
                  type="button"
                  title="Remover conta"
                  onClick={() => requestRemoveAccount(account)}
                  className="shrink-0 text-text-muted/50 opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                >
                  <MdDeleteOutline size={15} />
                </button>
              </div>
            ))}

            {showAddAccount ? (
              <div className="flex items-center gap-2">
                <input
                  ref={newAccountInputRef}
                  type="text"
                  autoFocus
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddAccount();
                    }
                    if (e.key === 'Escape') {
                      setShowAddAccount(false);
                      setNewAccountName('');
                    }
                  }}
                  placeholder="Nome da conta"
                  className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-[13px] text-text outline-none focus:border-orange"
                />
                <button
                  type="button"
                  onClick={handleAddAccount}
                  disabled={!newAccountName.trim()}
                  className="rounded-lg bg-orange px-3 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Adicionar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAccount(false);
                    setNewAccountName('');
                  }}
                  className="rounded-lg border border-border px-3 py-2 text-[12px] text-text-sub transition-colors hover:bg-bg"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddAccount(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-[12px] font-semibold text-text-muted transition-colors hover:border-orange hover:text-orange"
              >
                <MdAdd size={15} />
                Nova conta
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border px-6 py-4">
        <button
          type="button"
          onClick={handleCancel}
          disabled={!dirty || isSaving}
          className="btn-ghost-border"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!dirty || isSaving}
          className="btn-primary"
        >
          {isSaving && <Spinner size={12} />}
          Salvar
        </button>
      </div>

      {removingSub && (
        <ConfirmDeleteModal
          title="Remover subcategoria"
          description={`Remover "${removingSub.name}"? Isso só é aplicado quando você salvar.`}
          onConfirm={handleConfirmRemoveSubcategory}
          onCancel={() => setRemovingSub(null)}
        />
      )}

      {removingAccount && (
        <ConfirmDeleteModal
          title="Remover conta"
          description={`Remover "${removingAccount.name}"? Isso só é aplicado quando você salvar.`}
          onConfirm={handleConfirmRemoveAccount}
          onCancel={() => setRemovingAccount(null)}
        />
      )}

      {blocker.status === 'blocked' && (
        <UnsavedChangesModal onDiscard={blocker.proceed} onCancel={blocker.reset} />
      )}
    </div>
  );
}
