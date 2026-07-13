import { useSuspenseQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { MdAdd } from 'react-icons/md';

import { TransactionModal } from '@/components/finance/transaction-modal.component';
import { Badge } from '@/components/ui/badge.component';
import { formatCurrency } from '@/formatters/formatCurrency';
import { formatDateShort } from '@/formatters/formatDate';
import {
  PAYMENT_METHOD_LABELS,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
} from '@/models/finance.model';
import type {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '@/models/finance.model';
import { companiesQueryOptions } from '@/queries/company.queries';
import {
  financeAccountsQueryOptions,
  financeCategoriesQueryOptions,
  transactionsQueryOptions,
} from '@/queries/finance.queries';

const STATUS_BADGE_VARIANT: Record<
  TransactionStatus,
  'default' | 'success' | 'danger'
> = {
  previsto: 'default',
  realizado: 'success',
  atrasado: 'danger',
};

export function FinanceTransactionsTab() {
  const { data: transactions } = useSuspenseQuery(transactionsQueryOptions());
  const { data: companies } = useSuspenseQuery(companiesQueryOptions());
  const { data: categories } = useSuspenseQuery(financeCategoriesQueryOptions());
  const { data: accounts } = useSuspenseQuery(financeAccountsQueryOptions());

  const [filterType, setFilterType] = useState<'' | TransactionType>('');
  const [filterStatus, setFilterStatus] = useState<'' | TransactionStatus>('');
  const [search, setSearch] = useState('');

  const [selectedTransaction, setSelectedTransaction] = useState<
    Transaction | undefined
  >(undefined);
  const [showModal, setShowModal] = useState(false);

  const openNew = () => {
    setSelectedTransaction(undefined);
    setShowModal(true);
  };

  const openTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return transactions
      .filter((t) => !filterType || t.type === filterType)
      .filter((t) => !filterStatus || t.status === filterStatus)
      .filter(
        (t) =>
          !term ||
          t.companyName?.toLowerCase().includes(term) ||
          t.categoryName.toLowerCase().includes(term) ||
          t.description?.toLowerCase().includes(term),
      );
  }, [transactions, filterType, filterStatus, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <span className="form-label">Tipo</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as '' | TransactionType)}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm text-text outline-none transition-colors focus:border-orange"
            >
              <option value="">Todos</option>
              {TRANSACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TRANSACTION_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="form-label">Status</span>
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as '' | TransactionStatus)
              }
              className="rounded-md border border-border bg-card px-3 py-2 text-sm text-text outline-none transition-colors focus:border-orange"
            >
              <option value="">Todos</option>
              <option value="previsto">Previsto</option>
              <option value="realizado">Realizado</option>
              <option value="atrasado">Atrasado</option>
            </select>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente"
            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-text outline-none transition-colors focus:border-orange"
          />
        </div>

        <button onClick={openNew} className="btn-primary shrink-0 px-4">
          <MdAdd size={16} />
          Novo lançamento
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border bg-bg/50 text-[11px] uppercase tracking-wide text-text-muted">
              <th className="px-4 py-2.5 font-semibold">Data</th>
              <th className="px-4 py-2.5 font-semibold">Categoria</th>
              <th className="px-4 py-2.5 font-semibold">Cliente</th>
              <th className="px-4 py-2.5 font-semibold">Valor</th>
              <th className="px-4 py-2.5 font-semibold">Forma</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            )}
            {filtered.map((t) => (
              <tr
                key={t.transactionId}
                onClick={() => openTransaction(t)}
                className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-bg/60"
              >
                <td className="whitespace-nowrap px-4 py-2.5 text-text-sub">
                  {formatDateShort(t.dueDate)}
                </td>
                <td className="px-4 py-2.5 text-text">
                  {t.categoryName}
                  {t.subcategory && (
                    <span className="text-text-muted"> — {t.subcategory}</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-text-sub">
                  {t.companyName ?? '—'}
                </td>
                <td
                  className={[
                    'whitespace-nowrap px-4 py-2.5 font-semibold',
                    t.type === 'entrada' ? 'text-success' : 'text-danger',
                  ].join(' ')}
                >
                  {t.type === 'entrada' ? '+ ' : '- '}
                  {formatCurrency(t.amount)}
                </td>
                <td className="px-4 py-2.5 text-text-sub">
                  {PAYMENT_METHOD_LABELS[t.paymentMethod]}
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant={STATUS_BADGE_VARIANT[t.status]}>
                    {TRANSACTION_STATUS_LABELS[t.status]}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <TransactionModal
          transaction={selectedTransaction}
          companies={companies}
          categories={categories}
          accounts={accounts}
          onClose={() => setShowModal(false)}
          onSaved={() => setShowModal(false)}
          onDeleted={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

