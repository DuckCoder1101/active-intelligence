import type { RefObject } from 'react';
import { useEffect, useId } from 'react';
import { MdCheck, MdClose } from 'react-icons/md';

import type { RecurrenceValue } from './recurrence-select.component';
import {
  EMPTY_RECURRENCE,
  RecurrenceSelect,
} from './recurrence-select.component';

import { FormSelect } from '@/components/ui/form-select.component';
import { MoneyInput } from '@/components/ui/money-input.component';
import { Spinner } from '@/components/ui/spinner.component';
import type { CompanyResume } from '@/models/company.model';
import {
  EDITABLE_TRANSACTION_STATUSES,
  FINANCE_CATEGORY_TYPE_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_CATEGORY_TYPES,
  TRANSACTION_TYPE_LABELS,
} from '@/models/finance.model';
import type {
  EditableTransactionStatus,
  FinanceAccount,
  FinanceCategoryType,
  FinanceSubcategory,
  PaymentMethod,
  Transaction,
  TransactionType,
} from '@/models/finance.model';
import {
  formatCompetencia,
  parseCompetencia,
  toDateInput,
} from '@/utils/date.util';

export type TransactionFieldName =
  | 'dueDate'
  | 'paidDate'
  | 'accrualDate'
  | 'type'
  | 'status'
  | 'category'
  | 'subcategory'
  | 'description'
  | 'company'
  | 'amount'
  | 'paymentMethod'
  | 'installmentIndex'
  | 'account';

export type TransactionFieldRefs = Partial<
  Record<TransactionFieldName, HTMLElement | null>
>;

export interface DraftTransaction {
  transactionId: string;
  dueDate: string;
  paidDate: string;
  accrualDate: string;
  type: TransactionType;
  status: EditableTransactionStatus;
  category: '' | FinanceCategoryType;
  subcategoryId: string;
  description: string;
  companyId: string;
  companyLabel: string;
  amount: number | '';
  paymentMethod: '' | PaymentMethod;
  installmentIndexText: string;
  accountId: string;
  /** Só usado no fluxo de criação — linhas existentes nunca reabrem esse fluxo. */
  recurrence: RecurrenceValue;
}

export function toDraftTransaction(t: Transaction): DraftTransaction {
  return {
    transactionId: t.transactionId,
    dueDate: toDateInput(t.dueDate),
    paidDate: toDateInput(t.paidDate),
    accrualDate: formatCompetencia(t.accrualDate),
    type: t.type,
    status: t.status === 'atrasado' ? 'previsto' : t.status,
    category: t.category,
    subcategoryId: t.subcategoryId ?? '',
    description: t.description ?? '',
    companyId: t.companyId ?? '',
    companyLabel: t.companyName ?? '',
    amount: t.amount,
    paymentMethod: t.paymentMethod,
    installmentIndexText: t.installmentIndex ? String(t.installmentIndex) : '',
    accountId: t.accountId,
    recurrence: EMPTY_RECURRENCE,
  };
}

export function isDraftTransactionDirty(
  draft: DraftTransaction,
  original: DraftTransaction,
): boolean {
  return (Object.keys(draft) as (keyof DraftTransaction)[]).some(
    (key) => draft[key] !== original[key],
  );
}

const cellClass = 'px-2 py-1.5 align-top';

interface Props {
  draft: DraftTransaction;
  /** true só na linha de criação — habilita o seletor de recorrência na célula "Parcela N°". */
  isNewRow?: boolean;
  /** Total do grupo de parcelamento — só quando presente o campo "Parcela N°" fica editável. */
  installmentTotal?: number;
  companies: CompanyResume[];
  subcategories: FinanceSubcategory[];
  accounts: FinanceAccount[];
  isSaving?: boolean;
  /** Registro mutável dos elementos de cada campo — usado pra focar no clique de uma célula ou num erro de validação. */
  fieldRefs: RefObject<TransactionFieldRefs>;
  /** Campo que deve receber foco ao montar a linha. Sem valor, foca a Categoria (fluxo padrão de "novo lançamento"). */
  focusField?: TransactionFieldName;
  errors?: Partial<Record<TransactionFieldName, string>>;
  onChange: (patch: Partial<DraftTransaction>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function EditableTransactionRow({
  draft,
  isNewRow,
  installmentTotal,
  companies,
  subcategories,
  accounts,
  isSaving,
  fieldRefs,
  focusField,
  errors,
  onChange,
  onSave,
  onCancel,
}: Props) {
  const companyListId = useId();
  const availableCategories = TRANSACTION_TYPE_CATEGORY_TYPES[draft.type];
  const availableSubcategories = subcategories.filter(
    (s) => s.categoryType === draft.category,
  );

  const registerField =
    (name: TransactionFieldName) => (node: HTMLElement | null) => {
      fieldRefs.current[name] = node;
    };

  useEffect(() => {
    const target = fieldRefs.current[focusField ?? 'category'];
    target?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnterKey = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleAccrualBlur = () => {
    const parsed = parseCompetencia(draft.accrualDate);
    if (parsed) {
      onChange({ accrualDate: formatCompetencia(parsed) });
    }
  };

  const handleCompanyBlur = () => {
    const matched = companies.find(
      (c) =>
        c.displayName.trim().toLowerCase() ===
        draft.companyLabel.trim().toLowerCase(),
    );
    onChange({ companyId: matched?.companyId ?? '' });
  };

  return (
    <tr className="border-b border-orange/40 bg-orange/5 last:border-0">
      <td className={cellClass}>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Salvar (Enter)"
            tabIndex={-1}
            onClick={onSave}
            disabled={isSaving}
            className="flex h-7 w-7 items-center justify-center rounded-md text-success transition-colors hover:bg-success/10 disabled:opacity-50"
          >
            {isSaving ? <Spinner size={14} /> : <MdCheck size={16} />}
          </button>
          <button
            type="button"
            title="Cancelar (Esc)"
            tabIndex={-1}
            onClick={onCancel}
            disabled={isSaving}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
          >
            <MdClose size={16} />
          </button>
        </div>
      </td>
      <td className={cellClass}>
        <input
          ref={registerField('dueDate')}
          type="date"
          value={draft.dueDate}
          onChange={(e) => onChange({ dueDate: e.target.value })}
          onKeyDown={handleEnterKey}
          title={errors?.dueDate}
          className={`w-32 rounded-md border bg-card px-2 py-1.5 text-sm text-text outline-none focus:border-primary ${errors?.dueDate ? 'border-danger' : 'border-border'}`}
        />
      </td>
      <td className={cellClass}>
        <input
          ref={registerField('paidDate')}
          type="date"
          value={draft.paidDate}
          onChange={(e) => onChange({ paidDate: e.target.value })}
          onKeyDown={handleEnterKey}
          className="w-32 rounded-md border border-border bg-card px-2 py-1.5 text-sm text-text outline-none focus:border-primary"
        />
      </td>
      <td className={cellClass}>
        <input
          ref={registerField('accrualDate')}
          type="text"
          value={draft.accrualDate}
          onChange={(e) => onChange({ accrualDate: e.target.value })}
          onBlur={handleAccrualBlur}
          onKeyDown={handleEnterKey}
          placeholder="MM-AAAA ou JAN 2026"
          title={errors?.accrualDate}
          className={`w-32 rounded-md border bg-card px-2 py-1.5 text-sm text-text outline-none focus:border-primary ${errors?.accrualDate ? 'border-danger' : 'border-border'}`}
        />
      </td>
      <td className={cellClass}>
        <div className="w-28">
          <FormSelect
            ref={registerField('type')}
            onKeyDown={handleEnterKey}
            value={draft.type}
            onChange={(value) => {
              const type = value as TransactionType;
              const patch: Partial<DraftTransaction> = { type };
              if (
                draft.category &&
                !TRANSACTION_TYPE_CATEGORY_TYPES[type].includes(draft.category)
              ) {
                patch.category = '';
                patch.subcategoryId = '';
              }
              onChange(patch);
            }}
          >
            {TRANSACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {TRANSACTION_TYPE_LABELS[t]}
              </option>
            ))}
          </FormSelect>
        </div>
      </td>
      <td className={cellClass}>
        <div className="w-32">
          <FormSelect
            ref={registerField('status')}
            onKeyDown={handleEnterKey}
            value={draft.status}
            onChange={(value) =>
              onChange({ status: value as EditableTransactionStatus })
            }
          >
            {EDITABLE_TRANSACTION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TRANSACTION_STATUS_LABELS[s]}
              </option>
            ))}
          </FormSelect>
        </div>
      </td>
      <td className={cellClass}>
        <div className="w-36">
          <FormSelect
            ref={registerField('category')}
            onKeyDown={handleEnterKey}
            value={draft.category}
            error={errors?.category}
            onChange={(value) =>
              onChange({
                category: value as FinanceCategoryType,
                subcategoryId: '',
              })
            }
          >
            {availableCategories.map((c) => (
              <option key={c} value={c}>
                {FINANCE_CATEGORY_TYPE_LABELS[c]}
              </option>
            ))}
          </FormSelect>
        </div>
      </td>
      <td className={cellClass}>
        <div className="w-36">
          <FormSelect
            ref={registerField('subcategory')}
            onKeyDown={handleEnterKey}
            value={draft.subcategoryId}
            disabled={!draft.category}
            onChange={(value) => onChange({ subcategoryId: value })}
          >
            <option value="">— nenhuma —</option>
            {availableSubcategories.map((s) => (
              <option key={s.subcategoryId} value={s.subcategoryId}>
                {s.name}
              </option>
            ))}
          </FormSelect>
        </div>
      </td>
      <td className={cellClass}>
        <input
          ref={registerField('description')}
          type="text"
          value={draft.description}
          maxLength={200}
          onChange={(e) => onChange({ description: e.target.value })}
          onKeyDown={handleEnterKey}
          className="w-44 rounded-md border border-border bg-card px-2 py-1.5 text-sm text-text outline-none focus:border-primary"
        />
      </td>
      <td className={cellClass}>
        <input
          ref={registerField('company')}
          type="text"
          list={companyListId}
          value={draft.companyLabel}
          onChange={(e) => onChange({ companyLabel: e.target.value })}
          onBlur={handleCompanyBlur}
          onKeyDown={handleEnterKey}
          placeholder="Cliente ou projeto"
          className="w-40 rounded-md border border-border bg-card px-2 py-1.5 text-sm text-text outline-none focus:border-primary"
        />
        <datalist id={companyListId}>
          {companies.map((c) => (
            <option key={c.companyId} value={c.displayName} />
          ))}
        </datalist>
      </td>
      <td className={cellClass}>
        <MoneyInput
          ref={registerField('amount')}
          value={draft.amount}
          onChange={(value) => onChange({ amount: value })}
          onFocus={(e) => e.target.select()}
          onKeyDown={handleEnterKey}
          error={errors?.amount}
          autoWidth
        />
      </td>
      <td className={cellClass}>
        <div className="w-32">
          <FormSelect
            ref={registerField('paymentMethod')}
            onKeyDown={handleEnterKey}
            value={draft.paymentMethod}
            error={errors?.paymentMethod}
            onChange={(value) =>
              onChange({ paymentMethod: value as PaymentMethod })
            }
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </FormSelect>
        </div>
      </td>
      <td className={cellClass}>
        {isNewRow ? (
          <RecurrenceSelect
            compact
            value={draft.recurrence}
            onChange={(recurrence) => onChange({ recurrence })}
          />
        ) : installmentTotal ? (
          <div className="flex w-20 items-center gap-1">
            <input
              ref={registerField('installmentIndex')}
              type="text"
              inputMode="numeric"
              value={draft.installmentIndexText}
              onChange={(e) =>
                onChange({
                  installmentIndexText: e.target.value.replace(/\D/g, ''),
                })
              }
              onKeyDown={handleEnterKey}
              className="w-10 rounded-md border border-border bg-card px-2 py-1.5 text-sm text-text outline-none focus:border-primary"
            />
            <span className="text-text-muted">/{installmentTotal}</span>
          </div>
        ) : (
          <span className="whitespace-nowrap text-text-sub">—</span>
        )}
      </td>
      <td className={cellClass}>
        <div className="w-36">
          <FormSelect
            ref={registerField('account')}
            onKeyDown={handleEnterKey}
            value={draft.accountId}
            error={errors?.account}
            onChange={(value) => onChange({ accountId: value })}
          >
            {accounts.map((a) => (
              <option key={a.accountId} value={a.accountId}>
                {a.name}
              </option>
            ))}
          </FormSelect>
        </div>
      </td>
    </tr>
  );
}
