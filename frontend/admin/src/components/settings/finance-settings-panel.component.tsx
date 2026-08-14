import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { MdAdd, MdDeleteOutline } from 'react-icons/md';
import { toast } from 'react-toastify';

import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import { BankAccountModal } from '@/components/settings/bank-account-modal.component';
import { Spinner } from '@/components/ui/spinner.component';
import {
  FINANCE_CATEGORY_TYPES,
  FINANCE_CATEGORY_TYPE_LABELS,
} from '@/models/finance.model';
import type { FinanceAccount, FinanceCategoryType } from '@/models/finance.model';
import {
  financeAccountsQueryOptions,
  financeSubcategoriesQueryOptions,
  useDeleteFinanceSubcategoryMutation,
  useSaveFinanceSubcategoryMutation,
} from '@/queries/finance.queries';
import type {
  DraftSubcategoriesByCategory,
  DraftSubcategory,
} from '@/utils/finance-settings-draft.util';
import {
  isSubcategoriesDirty,
  newKey,
  toDraftSubcategoriesByCategory,
} from '@/utils/finance-settings-draft.util';

type Section = 'subcategories' | 'accounts';

interface RemovingSubcategory {
  categoryType: FinanceCategoryType;
  key: string;
  name: string;
}

interface Props {
  onDirtyChange?: (dirty: boolean) => void;
}

export function FinanceSettingsPanel({ onDirtyChange }: Props) {
  const queryClient = useQueryClient();
  const { data: subcategories } = useSuspenseQuery(financeSubcategoriesQueryOptions());
  const { data: accounts } = useSuspenseQuery(financeAccountsQueryOptions());

  const saveSubcategory = useSaveFinanceSubcategoryMutation();
  const deleteSubcategory = useDeleteFinanceSubcategoryMutation();

  const [section, setSection] = useState<Section>('subcategories');
  const [selectedCategoryType, setSelectedCategoryType] =
    useState<FinanceCategoryType>('receitaRecorrente');

  const [originalSubs, setOriginalSubs] = useState<DraftSubcategoriesByCategory>(
    () => toDraftSubcategoriesByCategory(subcategories),
  );
  const [draftSubs, setDraftSubs] = useState<DraftSubcategoriesByCategory>(
    () => toDraftSubcategoriesByCategory(subcategories),
  );
  const [removedSubcategoryIds, setRemovedSubcategoryIds] = useState<string[]>([]);

  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const [showAddSub, setShowAddSub] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [removingSub, setRemovingSub] = useState<RemovingSubcategory | null>(null);

  const newSubInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);

  const [editingAccount, setEditingAccount] = useState<FinanceAccount | undefined>(
    undefined,
  );
  const [showAccountModal, setShowAccountModal] = useState(false);

  const dirty = isSubcategoriesDirty(draftSubs, originalSubs, removedSubcategoryIds);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  function resetSubcategoriesDraft(source: typeof subcategories) {
    const fresh = toDraftSubcategoriesByCategory(source);
    setOriginalSubs(fresh);
    setDraftSubs(fresh);
    setRemovedSubcategoryIds([]);
  }

  const handleCancel = () => {
    resetSubcategoriesDraft(subcategories);
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

  const openNewAccount = () => {
    setEditingAccount(undefined);
    setShowAccountModal(true);
  };

  const openAccount = (account: FinanceAccount) => {
    setEditingAccount(account);
    setShowAccountModal(true);
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

      toast.success('Configurações salvas!');
      const freshSubs = await queryClient.fetchQuery(financeSubcategoriesQueryOptions());
      resetSubcategoriesDraft(freshSubs);
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
            Subcategorias e contas bancárias usadas nos lançamentos do módulo Financeiro.
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
        {section === 'subcategories' && (
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
        )}

        {section === 'accounts' && (
          <div className="flex w-full max-w-sm flex-col gap-2">
            <h2 className="text-[13px] font-bold text-text">Contas bancárias</h2>

            {accounts.length === 0 && (
              <p className="mb-1 text-[12px] text-text-muted">
                Nenhuma conta cadastrada.
              </p>
            )}

            {accounts.map((account) => (
              <button
                key={account.accountId}
                type="button"
                onClick={() => openAccount(account)}
                className="flex flex-col items-start gap-0.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-left transition-colors hover:border-orange"
              >
                <span className="text-[13px] font-semibold text-text">
                  {account.name}
                </span>
                <span className="text-[11px] text-text-muted">
                  {account.bankName
                    ? `${account.bankName} · Ag. ${account.agency} · Cc. ${account.accountNumber}`
                    : 'Dados bancários pendentes de preenchimento'}
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={openNewAccount}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-[12px] font-semibold text-text-muted transition-colors hover:border-orange hover:text-orange"
            >
              <MdAdd size={15} />
              Nova conta bancária
            </button>
          </div>
        )}
      </div>

      {section !== 'accounts' && (
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
      )}

      {removingSub && (
        <ConfirmDeleteModal
          title="Remover subcategoria"
          description={`Remover "${removingSub.name}"? Isso só é aplicado quando você salvar.`}
          onConfirm={handleConfirmRemoveSubcategory}
          onCancel={() => setRemovingSub(null)}
        />
      )}

      {showAccountModal && (
        <BankAccountModal
          account={editingAccount}
          onClose={() => setShowAccountModal(false)}
          onSaved={() => setShowAccountModal(false)}
          onDeleted={() => setShowAccountModal(false)}
        />
      )}
    </div>
  );
}
