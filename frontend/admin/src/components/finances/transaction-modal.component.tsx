import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { MdCheckCircleOutline, MdClose, MdDelete } from 'react-icons/md';
import { toast } from 'react-toastify';

import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import { FormInput } from '@/components/ui/form-input.component';
import { FormSelect } from '@/components/ui/form-select.component';
import { MoneyInput } from '@/components/ui/money-input.component';
import { Spinner } from '@/components/ui/spinner.component';
import type { CompanyResume } from '@/models/company.model';
import {
  FINANCE_CATEGORY_TYPE_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_CATEGORY_TYPES,
  TRANSACTION_TYPE_LABELS,
} from '@/models/finance.model';
import type {
  FinanceAccount,
  FinanceCategoryType,
  FinanceSubcategory,
  PaymentMethod,
  SaveTransactionDTO,
  Transaction,
  TransactionType,
} from '@/models/finance.model';
import {
  useDeleteTransactionMutation,
  useMarkTransactionPaidMutation,
  useSaveTransactionMutation,
} from '@/queries/finance.queries';
import { fromDateInput, toDateInput } from '@/utils/date.util';

interface FormValues {
  type: TransactionType;
  category: '' | FinanceCategoryType;
  subcategoryId: string;
  companyId: string;
  amount: number | '';
  paymentMethod: '' | PaymentMethod;
  accountId: string;
  dueDate: string;
  description: string;
}

function defaultValues(transaction?: Transaction): FormValues {
  return {
    type: transaction?.type ?? 'saida',
    category: transaction?.category ?? '',
    subcategoryId: transaction?.subcategoryId ?? '',
    companyId: transaction?.companyId ?? '',
    amount: transaction?.amount ?? '',
    paymentMethod: transaction?.paymentMethod ?? '',
    accountId: transaction?.accountId ?? '',
    dueDate: toDateInput(transaction?.dueDate) || new Date().toISOString().split('T')[0],
    description: transaction?.description ?? '',
  };
}

interface Props {
  transaction?: Transaction;
  companies: CompanyResume[];
  subcategories: FinanceSubcategory[];
  accounts: FinanceAccount[];
  onClose: () => void;
  onSaved: (transaction: Transaction) => void;
  onDeleted: (transactionId: string) => void;
}

export function TransactionModal({
  transaction,
  companies,
  subcategories,
  accounts,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const isEditing = !!transaction;
  const saveTransaction = useSaveTransactionMutation();
  const markPaid = useMarkTransactionPaidMutation();
  const deleteTransaction = useDeleteTransactionMutation();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: defaultValues(transaction) });

  const type = useWatch({ control, name: 'type' });
  const category = useWatch({ control, name: 'category' });

  const availableCategories = TRANSACTION_TYPE_CATEGORY_TYPES[type];
  const availableSubcategories = useMemo(
    () => subcategories.filter((s) => s.categoryType === category),
    [subcategories, category],
  );

  const canMarkPaid =
    isEditing && (transaction.status === 'previsto' || transaction.status === 'atrasado');

  const onSubmit = (values: FormValues) => {
    const dto: SaveTransactionDTO = {
      ...(transaction?.transactionId
        ? { transactionId: transaction.transactionId }
        : {}),
      type: values.type,
      category: values.category as FinanceCategoryType,
      subcategoryId: values.subcategoryId || undefined,
      companyId: values.companyId || undefined,
      amount: Number(values.amount),
      paymentMethod: values.paymentMethod as PaymentMethod,
      accountId: values.accountId,
      dueDate: fromDateInput(values.dueDate),
      description: values.description.trim() || undefined,
    };

    saveTransaction.mutate(dto, {
      onSuccess: (saved) => {
        toast.success(isEditing ? 'Lançamento atualizado!' : 'Lançamento criado!');
        onSaved(saved);
      },
    });
  };

  const handleMarkPaid = () => {
    if (!transaction) {
      return;
    }
    markPaid.mutate(transaction.transactionId, {
      onSuccess: (updated) => {
        toast.success('Baixa registrada!');
        onSaved(updated);
      },
    });
  };

  const handleDelete = () => {
    if (!transaction) {
      return;
    }
    deleteTransaction.mutate(transaction.transactionId, {
      onSuccess: () => {
        toast.success('Lançamento excluído!');
        onDeleted(transaction.transactionId);
      },
    });
  };

  return (
    <>
      <div
        className="modal-overlay bg-black/50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-[15px] font-bold text-text">
              {isEditing ? 'Detalhes do lançamento' : 'Novo lançamento'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-text-muted transition-colors hover:text-text"
            >
              <MdClose size={20} />
            </button>
          </div>

          {/* Body */}
          <form
            id="transaction-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 space-y-4 overflow-y-auto p-6"
          >
            <div className="form-grid">
              <Controller
                name="type"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <FormSelect
                    label="Tipo *"
                    {...field}
                    onChange={(value) => {
                      field.onChange(value);
                      if (
                        !TRANSACTION_TYPE_CATEGORY_TYPES[
                          value as TransactionType
                        ].includes(category as FinanceCategoryType)
                      ) {
                        setValue('category', '');
                        setValue('subcategoryId', '');
                      }
                    }}
                  >
                    {TRANSACTION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {TRANSACTION_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </FormSelect>
                )}
              />

              <Controller
                name="amount"
                control={control}
                rules={{ required: 'Valor obrigatório' }}
                render={({ field }) => (
                  <MoneyInput
                    label="Valor (R$) *"
                    error={errors.amount?.message}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>

            <div className="form-grid">
              <Controller
                name="category"
                control={control}
                rules={{ required: 'Categoria obrigatória' }}
                render={({ field }) => (
                  <FormSelect
                    label="Categoria *"
                    error={errors.category?.message}
                    {...field}
                    onChange={(value) => {
                      field.onChange(value);
                      setValue('subcategoryId', '');
                    }}
                  >
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>
                        {FINANCE_CATEGORY_TYPE_LABELS[c]}
                      </option>
                    ))}
                  </FormSelect>
                )}
              />

              <Controller
                name="subcategoryId"
                control={control}
                render={({ field }) => (
                  <FormSelect
                    label="Subcategoria"
                    disabled={!category}
                    placeholder={category ? 'Selecione...' : 'Escolha a categoria primeiro'}
                    {...field}
                  >
                    {availableSubcategories.map((s) => (
                      <option key={s.subcategoryId} value={s.subcategoryId}>
                        {s.name}
                      </option>
                    ))}
                  </FormSelect>
                )}
              />
            </div>

            <Controller
              name="companyId"
              control={control}
              render={({ field }) => (
                <FormSelect label="Cliente" {...field}>
                  <option value="">— sem cliente —</option>
                  {companies.map((c) => (
                    <option key={c.companyId} value={c.companyId}>
                      {c.displayName}
                    </option>
                  ))}
                </FormSelect>
              )}
            />

            <div className="form-grid">
              <Controller
                name="paymentMethod"
                control={control}
                rules={{ required: 'Forma de pagamento obrigatória' }}
                render={({ field }) => (
                  <FormSelect
                    label="Forma de pagamento *"
                    error={errors.paymentMethod?.message}
                    {...field}
                  >
                    <option value="">Selecione...</option>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {PAYMENT_METHOD_LABELS[m]}
                      </option>
                    ))}
                  </FormSelect>
                )}
              />

              <Controller
                name="accountId"
                control={control}
                rules={{ required: 'Conta obrigatória' }}
                render={({ field }) => (
                  <FormSelect
                    label="Conta *"
                    error={errors.accountId?.message}
                    {...field}
                  >
                    <option value="">Selecione...</option>
                    {accounts.map((a) => (
                      <option key={a.accountId} value={a.accountId}>
                        {a.name}
                      </option>
                    ))}
                  </FormSelect>
                )}
              />
            </div>

            <FormInput
              label={type === 'entrada' ? 'Data prevista de recebimento *' : 'Data prevista de pagamento *'}
              type="date"
              error={errors.dueDate?.message}
              {...register('dueDate', { required: 'Data obrigatória' })}
            />

            <FormInput
              as="textarea"
              label="Descrição"
              className="min-h-20 resize-none"
              {...register('description')}
            />

            {canMarkPaid && (
              <button
                type="button"
                onClick={handleMarkPaid}
                disabled={markPaid.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-[12px] font-semibold text-success transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                {markPaid.isPending ? (
                  <Spinner size={12} />
                ) : (
                  <MdCheckCircleOutline size={15} />
                )}
                Dar baixa neste lançamento
              </button>
            )}
          </form>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <div>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn-danger"
                >
                  <MdDelete size={15} />
                  Excluir
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-ghost-border">
                Cancelar
              </button>
              <button
                type="submit"
                form="transaction-form"
                disabled={saveTransaction.isPending}
                className="btn-primary"
              >
                {saveTransaction.isPending && <Spinner size={12} />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && transaction && (
        <ConfirmDeleteModal
          title="Excluir lançamento"
          description={`Excluir "${FINANCE_CATEGORY_TYPE_LABELS[transaction.category]}"? Esta ação não pode ser desfeita.`}
          isDeleting={deleteTransaction.isPending}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}
