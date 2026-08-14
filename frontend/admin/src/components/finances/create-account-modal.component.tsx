import { useId, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { MdClose } from 'react-icons/md';
import { toast } from 'react-toastify';

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
  FINANCE_CATEGORY_TYPE_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  TRANSACTION_TYPE_CATEGORY_TYPES,
} from '@/models/finance.model';
import type {
  FinanceAccount,
  FinanceCategoryType,
  FinanceSubcategory,
  PaymentMethod,
  TransactionType,
} from '@/models/finance.model';
import {
  usePullCompanyContractMutation,
  useSaveTransactionMutation,
} from '@/queries/finance.queries';
import {
  fromDateInput,
  fromMonthInput,
  toDateInput,
  toMonthInput,
} from '@/utils/date.util';

interface FormValues {
  companyLabel: string;
  companyId: string;
  category: '' | FinanceCategoryType;
  subcategoryId: string;
  amount: number | '';
  paymentMethod: '' | PaymentMethod;
  accountId: string;
  dueDate: string;
  competencia: string;
  description: string;
  recurrence: RecurrenceValue;
}

function defaultValues(): FormValues {
  return {
    companyLabel: '',
    companyId: '',
    category: '',
    subcategoryId: '',
    amount: '',
    paymentMethod: '',
    accountId: '',
    dueDate: toDateInput(Date.now()),
    competencia: toMonthInput(Date.now()),
    description: '',
    recurrence: EMPTY_RECURRENCE,
  };
}

/** dia clampeado ao último dia válido do mês de `monthStartMs`. */
function dueDateForMonth(monthStartMs: number, day: number): number {
  const d = new Date(monthStartMs);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    Math.min(day, lastDay),
    12,
  ).getTime();
}

interface Props {
  type: TransactionType;
  companies: CompanyResume[];
  subcategories: FinanceSubcategory[];
  accounts: FinanceAccount[];
  onClose: () => void;
  onCreated: () => void;
}

export function CreateAccountModal({
  type,
  companies,
  subcategories,
  accounts,
  onClose,
  onCreated,
}: Props) {
  const companyListId = useId();
  const saveTransaction = useSaveTransactionMutation();
  const pullContract = usePullCompanyContractMutation();

  const [matchedCompany, setMatchedCompany] = useState<
    CompanyResume | undefined
  >();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: defaultValues() });

  const category = useWatch({ control, name: 'category' });
  const availableCategories = TRANSACTION_TYPE_CATEGORY_TYPES[type];
  const availableSubcategories = subcategories.filter(
    (s) => s.categoryType === category,
  );

  const handleCompanyBlur = () => {
    const label = getValues('companyLabel').trim().toLowerCase();
    const matched = companies.find(
      (c) => c.displayName.trim().toLowerCase() === label,
    );
    setMatchedCompany(matched);
    setValue('companyId', matched?.companyId ?? '');
  };

  const handlePullContract = () => {
    if (!matchedCompany) {
      return;
    }
    pullContract.mutate(matchedCompany.companyId, {
      onSuccess: (summary) => {
        setValue('category', summary.category);
        setValue('subcategoryId', summary.subcategoryId);

        if (summary.contractType === 'mrr' && summary.mrr) {
          setValue('amount', summary.mrr.monthlyValue);
          setValue('paymentMethod', summary.mrr.paymentMethod);
          const firstDue = dueDateForMonth(
            summary.mrr.startDate,
            summary.mrr.dueDay,
          );
          setValue('dueDate', toDateInput(firstDue));
          setValue('competencia', toMonthInput(summary.mrr.startDate));
          setValue('recurrence', {
            mode: 'recorrente',
            installmentsText: '',
            recurrenceEndDate: summary.mrr.endDate
              ? toDateInput(summary.mrr.endDate)
              : '',
          });
        } else if (summary.contractType === 'tcv' && summary.tcv) {
          setValue('dueDate', toDateInput(summary.tcv.startDate));
          setValue('competencia', toMonthInput(summary.tcv.startDate));
          if (summary.tcv.paymentType === 'parcelado') {
            setValue(
              'amount',
              summary.tcv.installmentValue ??
                summary.tcv.totalValue / (summary.tcv.installments ?? 1),
            );
            setValue('paymentMethod', summary.tcv.paymentMethod ?? '');
            setValue('recurrence', {
              mode: 'parcelado',
              installmentsText: String(summary.tcv.installments ?? ''),
              recurrenceEndDate: '',
            });
          } else {
            setValue('amount', summary.tcv.totalValue);
            setValue('paymentMethod', summary.tcv.paymentMethod ?? '');
            setValue('recurrence', EMPTY_RECURRENCE);
          }
        }

        toast.success('Dados do contrato aplicados — revise antes de salvar.');
      },
      onError: (err) => {
        toast.error(
          err instanceof Error
            ? err.message
            : 'Não foi possível ler o contrato.',
        );
      },
    });
  };

  const onSubmit = (values: FormValues) => {
    if (
      values.recurrence.mode === 'parcelado' &&
      !values.recurrence.installmentsText
    ) {
      toast.error('Informe o número de parcelas.');
      return;
    }

    saveTransaction.mutate(
      {
        type,
        category: values.category as FinanceCategoryType,
        subcategoryId: values.subcategoryId || undefined,
        companyId: values.companyId || undefined,
        companyName: values.companyId
          ? undefined
          : values.companyLabel.trim() || undefined,
        amount: Number(values.amount),
        paymentMethod: values.paymentMethod as PaymentMethod,
        accountId: values.accountId,
        dueDate: fromDateInput(values.dueDate),
        accrualDate: fromMonthInput(values.competencia),
        description: values.description.trim() || undefined,
        installments:
          values.recurrence.mode === 'parcelado'
            ? Number(values.recurrence.installmentsText)
            : undefined,
        isRecurring: values.recurrence.mode === 'recorrente' ? true : undefined,
        recurrenceEndDate:
          values.recurrence.mode === 'recorrente' &&
          values.recurrence.recurrenceEndDate
            ? fromDateInput(values.recurrence.recurrenceEndDate)
            : undefined,
        origin: 'contas',
      },
      {
        onSuccess: (created) => {
          const count = Array.isArray(created) ? created.length : 1;
          toast.success(
            count > 1 ? `${count} lançamentos criados!` : 'Lançamento criado!',
          );
          onCreated();
        },
      },
    );
  };

  return (
    <div
      className="modal-overlay bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-[15px] font-bold text-text">
            {type === 'entrada'
              ? 'Criar Conta a Receber'
              : 'Criar Conta a Pagar'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted transition-colors hover:text-text"
          >
            <MdClose size={20} />
          </button>
        </div>

        <form
          id="create-account-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 space-y-4 overflow-y-auto p-6"
        >
          <div className="flex flex-col gap-1.5">
            <span className="form-label">Cliente / Projeto</span>
            <input
              type="text"
              list={companyListId}
              placeholder="Cliente ou projeto"
              className="rounded-md border border-border bg-card px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
              {...register('companyLabel', { onBlur: handleCompanyBlur })}
            />
            <datalist id={companyListId}>
              {companies.map((c) => (
                <option key={c.companyId} value={c.displayName} />
              ))}
            </datalist>
          </div>

          {type === 'entrada' && matchedCompany && (
            <button
              type="button"
              onClick={handlePullContract}
              disabled={pullContract.isPending}
              className="btn-ghost-border w-full justify-center"
            >
              {pullContract.isPending && <Spinner size={12} />}
              Puxar dados do contrato do cliente
            </button>
          )}

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
                  {...field}
                >
                  <option value="">— nenhuma —</option>
                  {availableSubcategories.map((s) => (
                    <option key={s.subcategoryId} value={s.subcategoryId}>
                      {s.name}
                    </option>
                  ))}
                </FormSelect>
              )}
            />
          </div>

          <div className="form-grid">
            <Controller
              name="amount"
              control={control}
              rules={{ required: 'Valor obrigatório' }}
              render={({ field }) => (
                <MoneyInput
                  label="Valor *"
                  error={errors.amount?.message}
                  {...field}
                />
              )}
            />

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
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </option>
                  ))}
                </FormSelect>
              )}
            />
          </div>

          <div className="form-grid">
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
                  {accounts.map((a) => (
                    <option key={a.accountId} value={a.accountId}>
                      {a.name}
                    </option>
                  ))}
                </FormSelect>
              )}
            />

            <div className="flex flex-col gap-1.5">
              <span className="form-label">Data de vencimento *</span>
              <input
                type="date"
                className="rounded-md border border-border bg-card px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
                {...register('dueDate', { required: true })}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="flex flex-col gap-1.5">
              <span className="form-label">Competência</span>
              <input
                type="month"
                className="rounded-md border border-border bg-card px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
                {...register('competencia')}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="form-label">Descrição</span>
              <input
                type="text"
                maxLength={200}
                className="rounded-md border border-border bg-card px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
                {...register('description')}
              />
            </div>
          </div>

          <Controller
            name="recurrence"
            control={control}
            render={({ field }) => (
              <RecurrenceSelect value={field.value} onChange={field.onChange} />
            )}
          />
        </form>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button type="button" onClick={onClose} className="btn-ghost-border">
            Cancelar
          </button>
          <button
            type="submit"
            form="create-account-form"
            disabled={saveTransaction.isPending}
            className="btn-primary"
          >
            {saveTransaction.isPending && <Spinner size={12} />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
