import { useSuspenseQuery } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { MdAdd, MdDeleteOutline, MdEdit } from 'react-icons/md';
import { toast } from 'react-toastify';

import { CreateAccountModal } from '@/components/finances/create-account-modal.component';
import type {
  DraftTransaction,
  TransactionFieldName,
  TransactionFieldRefs,
} from '@/components/finances/editable-transaction-row.component';
import {
  EditableTransactionRow,
  isDraftTransactionDirty,
  toDraftTransaction,
} from '@/components/finances/editable-transaction-row.component';
import type { PeriodValue } from '@/components/finances/period-filter.component';
import {
  currentMonthPeriod,
  isWithinPeriod,
  PeriodFilter,
} from '@/components/finances/period-filter.component';
import { EMPTY_RECURRENCE } from '@/components/finances/recurrence-select.component';
import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import { UnsavedChangesModal } from '@/components/settings/unsaved-changes-modal.component';
import { Badge } from '@/components/ui/badge.component';
import { FormSelect } from '@/components/ui/form-select.component';
import { formatCurrency } from '@/formatters/formatCurrency';
import { formatDateShort, formatMonthYear } from '@/formatters/formatDate';
import {
  FINANCE_CATEGORY_TYPE_LABELS,
  FINANCE_CATEGORY_TYPES,
  PAYMENT_METHOD_LABELS,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_TYPE_CATEGORY_TYPES,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
} from '@/models/finance.model';
import type {
  FinanceCategoryType,
  PaymentMethod,
  Transaction,
  TransactionStatus,
  TransactionType,
} from '@/models/finance.model';
import { companiesQueryOptions } from '@/queries/company.queries';
import {
  financeAccountsQueryOptions,
  financeSubcategoriesQueryOptions,
  transactionsQueryOptions,
  useDeleteTransactionMutation,
  useMarkTransactionPaidMutation,
  useSaveTransactionMutation,
  useUnmarkTransactionPaidMutation,
} from '@/queries/finance.queries';
import {
  formatCompetencia,
  fromDateInput,
  parseCompetencia,
  toDateInput,
} from '@/utils/date.util';

const STATUS_BADGE_VARIANT: Record<
  TransactionStatus,
  'default' | 'success' | 'danger'
> = {
  previsto: 'default',
  realizado: 'success',
  atrasado: 'danger',
};

function installmentLabel(t: Transaction): string {
  return t.installmentIndex && t.installmentTotal
    ? `${t.installmentIndex}/${t.installmentTotal}`
    : '—';
}

const NEW_ROW_ID = '__new__';

function emptyDraft(defaultType: TransactionType = 'saida'): DraftTransaction {
  return {
    transactionId: NEW_ROW_ID,
    dueDate: toDateInput(Date.now()),
    paidDate: '',
    accrualDate: formatCompetencia(Date.now()),
    type: defaultType,
    status: 'previsto',
    category: '',
    subcategoryId: '',
    description: '',
    companyId: '',
    companyLabel: '',
    amount: '',
    paymentMethod: '',
    installmentIndexText: '',
    accountId: '',
    recurrence: EMPTY_RECURRENCE,
  };
}

/** Depois de criar um lançamento, a próxima linha nova herda tipo/competência/forma de
 * pagamento/conta do anterior — normalmente se repetem num lote de lançamentos seguidos. */
function nextDraftAfterCreate(prev: DraftTransaction): DraftTransaction {
  return {
    ...emptyDraft(prev.type),
    accrualDate: prev.accrualDate,
    paymentMethod: prev.paymentMethod,
    accountId: prev.accountId,
  };
}

interface Props {
  /** Título mostrado acima da tabela — só usado nas visões de Contas a Pagar/Receber. */
  title?: string;
  /** Trava o tipo (some com o filtro de Tipo e o filtro de categoria só mostra as desse tipo). */
  presetType?: TransactionType;
  /**
   * Visão "Contas a Pagar/Receber": mostra só previsto/atrasado (nunca realizado),
   * some com a opção "Realizado" no filtro de Status, ordena por vencimento e
   * mostra os cards de resumo (Em aberto / Vencido / A vencer).
   */
  pendingOnly?: boolean;
}

export function FinanceTransactionsTab({
  title,
  presetType,
  pendingOnly,
}: Props = {}) {
  const { data: transactions } = useSuspenseQuery(transactionsQueryOptions());
  const { data: companies } = useSuspenseQuery(companiesQueryOptions());
  const { data: subcategories } = useSuspenseQuery(
    financeSubcategoriesQueryOptions(),
  );
  const { data: accounts } = useSuspenseQuery(financeAccountsQueryOptions());

  const saveTransaction = useSaveTransactionMutation();
  const markTransactionPaid = useMarkTransactionPaidMutation();
  const unmarkTransactionPaid = useUnmarkTransactionPaidMutation();
  const deleteTransaction = useDeleteTransactionMutation();

  const [filterType, setFilterType] = useState<'' | TransactionType>(
    presetType ?? '',
  );
  const [filterStatus, setFilterStatus] = useState<'' | TransactionStatus>('');
  const [filterCategory, setFilterCategory] = useState<
    '' | FinanceCategoryType
  >('');
  const [period, setPeriod] = useState<PeriodValue>(currentMonthPeriod());
  const [search, setSearch] = useState('');

  const categoryOptions = presetType
    ? TRANSACTION_TYPE_CATEGORY_TYPES[presetType]
    : FINANCE_CATEGORY_TYPES;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    // Contas a Pagar/Receber: atrasado sempre aparece, período só recorta previsto/realizado —
    // um item vencido não deve sumir só porque a janela mudou de mês.
    const inPeriod = (t: Transaction) =>
      pendingOnly
        ? t.status === 'atrasado' || isWithinPeriod(t.dueDate, period)
        : isWithinPeriod(t.accrualDate, period);
    const result = transactions
      .filter((t) => !presetType || t.type === presetType)
      .filter((t) => !pendingOnly || t.status !== 'realizado')
      .filter((t) => !filterType || t.type === filterType)
      .filter((t) => !filterStatus || t.status === filterStatus)
      .filter((t) => !filterCategory || t.category === filterCategory)
      .filter(inPeriod)
      .filter(
        (t) =>
          !term ||
          t.companyName?.toLowerCase().includes(term) ||
          FINANCE_CATEGORY_TYPE_LABELS[t.category]
            .toLowerCase()
            .includes(term) ||
          t.subcategoryName?.toLowerCase().includes(term) ||
          t.description?.toLowerCase().includes(term),
      );
    return pendingOnly
      ? [...result].sort((a, b) => a.dueDate - b.dueDate)
      : result;
  }, [
    transactions,
    presetType,
    pendingOnly,
    filterType,
    filterStatus,
    filterCategory,
    period,
    search,
  ]);

  const summary = useMemo(() => {
    if (!pendingOnly) {
      return null;
    }
    const overdue = filtered.filter((t) => t.status === 'atrasado');
    const upcoming = filtered.filter((t) => t.status === 'previsto');
    const sum = (list: Transaction[]) =>
      list.reduce((acc, t) => acc + t.amount, 0);
    return {
      open: { count: filtered.length, total: sum(filtered) },
      overdue: { count: overdue.length, total: sum(overdue) },
      upcoming: { count: upcoming.length, total: sum(upcoming) },
    };
  }, [filtered, pendingOnly]);

  // --- Edição inline (uma linha por vez) ---

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftTransaction | null>(null);
  const [newRowSeq, setNewRowSeq] = useState(0);
  const [newRowBaseline, setNewRowBaseline] = useState<DraftTransaction>(
    emptyDraft(presetType),
  );
  const [focusField, setFocusField] = useState<
    TransactionFieldName | undefined
  >();
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<TransactionFieldName, string>>
  >({});
  const fieldRefs = useRef<TransactionFieldRefs>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [deletingTransaction, setDeletingTransaction] =
    useState<Transaction | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const startAdd = () => {
    const base = emptyDraft(presetType);
    setEditingId(NEW_ROW_ID);
    setNewRowBaseline(base);
    setDraft(base);
    setFocusField(undefined);
    setFieldErrors({});
    setNewRowSeq((s) => s + 1);
  };

  const startEdit = (t: Transaction, field?: TransactionFieldName) => {
    setEditingId(t.transactionId);
    setDraft(toDraftTransaction(t));
    setFocusField(field);
    setFieldErrors({});
  };

  const clearEditing = () => {
    setEditingId(null);
    setDraft(null);
    setShowDiscardConfirm(false);
    setFieldErrors({});
  };

  const requestCancel = () => {
    if (
      editingId === NEW_ROW_ID &&
      draft &&
      isDraftTransactionDirty(draft, newRowBaseline)
    ) {
      setShowDiscardConfirm(true);
      return;
    }
    clearEditing();
  };

  const updateDraft = (patch: Partial<DraftTransaction>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
    if (Object.keys(fieldErrors).length > 0) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        if ('category' in patch) {
          delete next.category;
        }
        if ('paymentMethod' in patch) {
          delete next.paymentMethod;
        }
        if ('accountId' in patch) {
          delete next.account;
        }
        if ('amount' in patch) {
          delete next.amount;
        }
        if ('accrualDate' in patch) {
          delete next.accrualDate;
        }
        if ('dueDate' in patch) {
          delete next.dueDate;
        }
        return next;
      });
    }
  };

  const handleSave = async () => {
    if (!draft || !editingId) {
      return;
    }

    const accrualDate = parseCompetencia(draft.accrualDate);
    const errors: Partial<Record<TransactionFieldName, string>> = {};
    if (!accrualDate) {
      errors.accrualDate = 'Competência inválida';
    }
    if (!draft.category) {
      errors.category = 'Obrigatório';
    }
    if (!draft.amount) {
      errors.amount = 'Obrigatório';
    }
    if (!draft.paymentMethod) {
      errors.paymentMethod = 'Obrigatório';
    }
    if (!draft.accountId) {
      errors.account = 'Obrigatório';
    }
    if (!draft.dueDate) {
      errors.dueDate = 'Obrigatório';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const focusOrder: TransactionFieldName[] = [
        'dueDate',
        'accrualDate',
        'category',
        'amount',
        'paymentMethod',
        'account',
      ];
      const firstInvalid = focusOrder.find((f) => errors[f]);
      if (firstInvalid) {
        fieldRefs.current[firstInvalid]?.focus();
      }
      return;
    }
    if (!accrualDate) {
      return;
    }
    setFieldErrors({});

    const matchedCompany = companies.find(
      (c) =>
        c.displayName.trim().toLowerCase() ===
        draft.companyLabel.trim().toLowerCase(),
    );

    if (
      editingId === NEW_ROW_ID &&
      draft.recurrence.mode === 'parcelado' &&
      !draft.recurrence.installmentsText
    ) {
      toast.error('Informe o número de parcelas.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId === NEW_ROW_ID) {
        const created = await saveTransaction.mutateAsync({
          type: draft.type,
          category: draft.category as FinanceCategoryType,
          subcategoryId: draft.subcategoryId || undefined,
          companyId: matchedCompany?.companyId,
          companyName: matchedCompany
            ? undefined
            : draft.companyLabel.trim() || undefined,
          amount: Number(draft.amount),
          paymentMethod: draft.paymentMethod as PaymentMethod,
          accountId: draft.accountId,
          dueDate: fromDateInput(draft.dueDate),
          accrualDate,
          description: draft.description.trim() || undefined,
          installments:
            draft.recurrence.mode === 'parcelado'
              ? Number(draft.recurrence.installmentsText)
              : undefined,
          isRecurring:
            draft.recurrence.mode === 'recorrente' ? true : undefined,
          recurrenceEndDate:
            draft.recurrence.mode === 'recorrente' &&
            draft.recurrence.recurrenceEndDate
              ? fromDateInput(draft.recurrence.recurrenceEndDate)
              : undefined,
        });
        if (draft.status === 'realizado') {
          const createdTx = Array.isArray(created) ? created[0] : created;
          await markTransactionPaid.mutateAsync({
            transactionId: createdTx.transactionId,
            paidDate: draft.paidDate
              ? fromDateInput(draft.paidDate)
              : Date.now(),
          });
        }
        toast.success('Lançamento criado!');
        const next = nextDraftAfterCreate(draft);
        setNewRowBaseline(next);
        setDraft(next);
        setNewRowSeq((s) => s + 1);
      } else {
        const source = transactions.find((t) => t.transactionId === editingId)!;
        await saveTransaction.mutateAsync({
          transactionId: editingId,
          type: draft.type,
          category: draft.category as FinanceCategoryType,
          subcategoryId: draft.subcategoryId || undefined,
          companyId: matchedCompany?.companyId,
          companyName: matchedCompany
            ? undefined
            : draft.companyLabel.trim() || undefined,
          amount: Number(draft.amount),
          paymentMethod: draft.paymentMethod as PaymentMethod,
          accountId: draft.accountId,
          dueDate: fromDateInput(draft.dueDate),
          accrualDate,
          description: draft.description.trim() || undefined,
          installmentIndex: draft.installmentIndexText
            ? Number(draft.installmentIndexText)
            : undefined,
        });

        const sourceStatus =
          source.status === 'atrasado' ? 'previsto' : source.status;
        if (
          draft.status === 'realizado' &&
          (sourceStatus !== 'realizado' ||
            draft.paidDate !== toDateInput(source.paidDate))
        ) {
          await markTransactionPaid.mutateAsync({
            transactionId: editingId,
            paidDate: draft.paidDate
              ? fromDateInput(draft.paidDate)
              : Date.now(),
          });
        } else if (
          draft.status === 'previsto' &&
          sourceStatus === 'realizado'
        ) {
          await unmarkTransactionPaid.mutateAsync(editingId);
        }
        toast.success('Lançamento atualizado!');
        clearEditing();
      }
    } catch {
      toast.error('Não foi possível salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTransaction) {
      return;
    }
    try {
      await deleteTransaction.mutateAsync(deletingTransaction.transactionId);
      toast.success('Lançamento excluído!');
      setDeletingTransaction(null);
    } catch {
      toast.error('Não foi possível excluir. Tente novamente.');
    }
  };

  return (
    <div className="space-y-4">
      {title && <h2 className="text-[15px] font-bold text-text">{title}</h2>}

      {summary && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Em aberto
            </p>
            <p className="mt-1 text-xl font-semibold text-text">
              {formatCurrency(summary.open.total)}
            </p>
            <p className="text-[11px] text-text-muted">
              {summary.open.count}{' '}
              {summary.open.count === 1 ? 'lançamento' : 'lançamentos'}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Vencido
            </p>
            <p className="mt-1 text-xl font-semibold text-danger">
              {formatCurrency(summary.overdue.total)}
            </p>
            <p className="text-[11px] text-text-muted">
              {summary.overdue.count}{' '}
              {summary.overdue.count === 1 ? 'lançamento' : 'lançamentos'}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              A vencer
            </p>
            <p className="mt-1 text-xl font-semibold text-text">
              {formatCurrency(summary.upcoming.total)}
            </p>
            <p className="text-[11px] text-text-muted">
              {summary.upcoming.count}{' '}
              {summary.upcoming.count === 1 ? 'lançamento' : 'lançamentos'}
            </p>
          </div>
        </div>
      )}

      {!editingId && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            {!presetType && (
              <div className="flex flex-col gap-1">
                <span className="form-label">Tipo</span>
                <FormSelect
                  value={filterType}
                  onChange={(value) =>
                    setFilterType(value as '' | TransactionType)
                  }
                >
                  <option value="">Todos</option>
                  {TRANSACTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TRANSACTION_TYPE_LABELS[t]}
                    </option>
                  ))}
                </FormSelect>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <span className="form-label">Status</span>
              <FormSelect
                value={filterStatus}
                onChange={(value) =>
                  setFilterStatus(value as '' | TransactionStatus)
                }
              >
                <option value="">Todos</option>
                <option value="previsto">Previsto</option>
                {!pendingOnly && <option value="realizado">Realizado</option>}
                <option value="atrasado">Atrasado</option>
              </FormSelect>
            </div>

            <div className="flex flex-col gap-1">
              <span className="form-label">Categoria</span>
              <FormSelect
                value={filterCategory}
                onChange={(value) =>
                  setFilterCategory(value as '' | FinanceCategoryType)
                }
              >
                <option value="">Todas</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {FINANCE_CATEGORY_TYPE_LABELS[c]}
                  </option>
                ))}
              </FormSelect>
            </div>

            <PeriodFilter value={period} onChange={setPeriod} />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente"
              className="rounded-md border border-border bg-card px-3 py-2 text-sm text-text outline-none transition-colors focus:border-orange"
            />
          </div>

          {pendingOnly ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary shrink-0 px-4"
            >
              <MdAdd size={16} />
              {presetType === 'entrada'
                ? 'Criar Conta a Receber'
                : 'Criar Conta a Pagar'}
            </button>
          ) : (
            <button onClick={startAdd} className="btn-primary shrink-0 px-4">
              <MdAdd size={16} />
              Novo lançamento
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border bg-bg/50 text-[11px] uppercase tracking-wide text-text-muted">
              <th className="whitespace-nowrap px-2 py-2.5 font-semibold"></th>
              <th className="whitespace-nowrap px-4 py-2.5 font-semibold">
                Vencimento
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 font-semibold">
                Data do pagamento
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 font-semibold">
                Competência
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 font-semibold">
                Tipo
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 font-semibold">
                Status
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 font-semibold">
                Categoria
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 font-semibold">
                Subcategoria
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 font-semibold">
                Descrição
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 font-semibold">
                Cliente / Projeto
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 font-semibold">
                Valor
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 font-semibold">
                Forma de pagamento
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 font-semibold">
                Parcela N°
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 font-semibold">
                Conta
              </th>
            </tr>
          </thead>
          <tbody>
            {editingId === NEW_ROW_ID && draft && (
              <EditableTransactionRow
                key={`new-${newRowSeq}`}
                draft={draft}
                isNewRow
                companies={companies}
                subcategories={subcategories}
                accounts={accounts}
                isSaving={isSaving}
                fieldRefs={fieldRefs}
                focusField={focusField}
                errors={fieldErrors}
                onChange={updateDraft}
                onSave={() => void handleSave()}
                onCancel={requestCancel}
              />
            )}

            {filtered.length === 0 && editingId !== NEW_ROW_ID && (
              <tr>
                <td
                  colSpan={14}
                  className="px-4 py-10 text-center text-text-muted"
                >
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            )}

            {filtered.map((t) =>
              t.transactionId === editingId && draft ? (
                <EditableTransactionRow
                  key={t.transactionId}
                  draft={draft}
                  installmentTotal={t.installmentTotal}
                  companies={companies}
                  subcategories={subcategories}
                  accounts={accounts}
                  isSaving={isSaving}
                  fieldRefs={fieldRefs}
                  focusField={focusField}
                  errors={fieldErrors}
                  onChange={updateDraft}
                  onSave={() => void handleSave()}
                  onCancel={requestCancel}
                />
              ) : (
                <tr
                  key={t.transactionId}
                  className="group border-b border-border last:border-0 transition-colors hover:bg-bg/60"
                >
                  <td className="whitespace-nowrap px-2 py-2.5">
                    {!editingId && (
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          title="Editar"
                          onClick={() => startEdit(t)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-orange/10 hover:text-orange"
                        >
                          <MdEdit size={14} />
                        </button>
                        <button
                          type="button"
                          title="Excluir"
                          onClick={() => setDeletingTransaction(t)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                        >
                          <MdDeleteOutline size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td
                    onClick={() => startEdit(t, 'dueDate')}
                    className="cursor-pointer whitespace-nowrap px-4 py-2.5 text-text-sub"
                  >
                    {formatDateShort(t.dueDate)}
                  </td>
                  <td
                    onClick={() => startEdit(t, 'paidDate')}
                    className="cursor-pointer whitespace-nowrap px-4 py-2.5 text-text-sub"
                  >
                    {t.paidDate ? formatDateShort(t.paidDate) : '—'}
                  </td>
                  <td
                    onClick={() => startEdit(t, 'accrualDate')}
                    className="cursor-pointer whitespace-nowrap px-4 py-2.5 text-text-sub"
                  >
                    {formatMonthYear(t.accrualDate)}
                  </td>
                  <td
                    onClick={() => startEdit(t, 'type')}
                    className="cursor-pointer whitespace-nowrap px-4 py-2.5 text-text-sub"
                  >
                    {TRANSACTION_TYPE_LABELS[t.type]}
                  </td>
                  <td
                    onClick={() => startEdit(t, 'status')}
                    className="cursor-pointer px-4 py-2.5"
                  >
                    <div className="flex items-center gap-1.5">
                      <Badge variant={STATUS_BADGE_VARIANT[t.status]}>
                        {TRANSACTION_STATUS_LABELS[t.status]}
                      </Badge>
                      {t.origin !== 'manual' && (
                        <span title="Criado via Contas a Pagar/Receber">
                          <Badge variant="default">Contas</Badge>
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    onClick={() => startEdit(t, 'category')}
                    className="cursor-pointer whitespace-nowrap px-4 py-2.5 text-text"
                  >
                    {FINANCE_CATEGORY_TYPE_LABELS[t.category]}
                  </td>
                  <td
                    onClick={() => startEdit(t, 'subcategory')}
                    className="cursor-pointer whitespace-nowrap px-4 py-2.5 text-text-sub"
                  >
                    {t.subcategoryName ?? '—'}
                  </td>
                  <td
                    onClick={() => startEdit(t, 'description')}
                    className="cursor-pointer px-4 py-2.5 text-text-sub"
                  >
                    {t.description ?? '—'}
                  </td>
                  <td
                    onClick={() => startEdit(t, 'company')}
                    className="cursor-pointer whitespace-nowrap px-4 py-2.5 text-text-sub"
                  >
                    {t.companyName ?? '—'}
                  </td>
                  <td
                    onClick={() => startEdit(t, 'amount')}
                    className={[
                      'cursor-pointer whitespace-nowrap px-4 py-2.5 font-semibold',
                      t.type === 'entrada' ? 'text-success' : 'text-danger',
                    ].join(' ')}
                  >
                    {t.type === 'entrada' ? '+ ' : '- '}
                    {formatCurrency(t.amount)}
                  </td>
                  <td
                    onClick={() => startEdit(t, 'paymentMethod')}
                    className="cursor-pointer whitespace-nowrap px-4 py-2.5 text-text-sub"
                  >
                    {PAYMENT_METHOD_LABELS[t.paymentMethod]}
                  </td>
                  <td
                    onClick={() => startEdit(t, 'installmentIndex')}
                    className="cursor-pointer whitespace-nowrap px-4 py-2.5 text-text-sub"
                  >
                    {installmentLabel(t)}
                  </td>
                  <td
                    onClick={() => startEdit(t, 'account')}
                    className="cursor-pointer whitespace-nowrap px-4 py-2.5 text-text-sub"
                  >
                    {t.accountName}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {showDiscardConfirm && (
        <UnsavedChangesModal
          description="Você tem um lançamento não salvo. Se sair agora, ele será perdido."
          onDiscard={clearEditing}
          onCancel={() => setShowDiscardConfirm(false)}
        />
      )}

      {deletingTransaction && (
        <ConfirmDeleteModal
          title="Excluir lançamento"
          description={`Excluir "${FINANCE_CATEGORY_TYPE_LABELS[deletingTransaction.category]}"? Esta ação não pode ser desfeita.`}
          isDeleting={deleteTransaction.isPending}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeletingTransaction(null)}
        />
      )}

      {showCreateModal && presetType && (
        <CreateAccountModal
          type={presetType}
          companies={companies}
          subcategories={subcategories}
          accounts={accounts}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
