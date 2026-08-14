import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { MdClose, MdDelete } from 'react-icons/md';
import { toast } from 'react-toastify';

import { ConfirmDeleteModal } from '@/components/layout/confirm-delete-modal.component';
import { CnpjInput } from '@/components/ui/cnpj-input.component';
import { CpfInput } from '@/components/ui/cpf-input.component';
import { FormInput } from '@/components/ui/form-input.component';
import { FormSelect } from '@/components/ui/form-select.component';
import { Spinner } from '@/components/ui/spinner.component';
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPES,
  HOLDER_DOCUMENT_TYPE_LABELS,
  HOLDER_DOCUMENT_TYPES,
} from '@/models/finance.model';
import type {
  AccountType,
  FinanceAccount,
  HolderDocumentType,
  SaveFinanceAccountDTO,
} from '@/models/finance.model';
import {
  useDeleteFinanceAccountMutation,
  useSaveFinanceAccountMutation,
} from '@/queries/finance.queries';

interface FormValues {
  name: string;
  bankCode: string;
  bankName: string;
  agency: string;
  agencyDigit: string;
  accountNumber: string;
  accountDigit: string;
  accountType: '' | AccountType;
  holderName: string;
  holderDocumentType: '' | HolderDocumentType;
  holderDocument: string;
  pixKey: string;
  asaasWalletId: string;
}

function defaultValues(account?: FinanceAccount): FormValues {
  return {
    name: account?.name ?? '',
    bankCode: account?.bankCode ?? '',
    bankName: account?.bankName ?? '',
    agency: account?.agency ?? '',
    agencyDigit: account?.agencyDigit ?? '',
    accountNumber: account?.accountNumber ?? '',
    accountDigit: account?.accountDigit ?? '',
    accountType: account?.accountType ?? '',
    holderName: account?.holderName ?? '',
    holderDocumentType: account?.holderDocumentType ?? '',
    holderDocument: account?.holderDocument ?? '',
    pixKey: account?.pixKey ?? '',
    asaasWalletId: account?.asaasWalletId ?? '',
  };
}

interface Props {
  account?: FinanceAccount;
  onClose: () => void;
  onSaved: (account: FinanceAccount) => void;
  onDeleted: (accountId: string) => void;
}

export function BankAccountModal({ account, onClose, onSaved, onDeleted }: Props) {
  const isEditing = !!account;
  const saveAccount = useSaveFinanceAccountMutation();
  const deleteAccount = useDeleteFinanceAccountMutation();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: defaultValues(account) });

  const holderDocumentType = useWatch({ control, name: 'holderDocumentType' });

  const onSubmit = (values: FormValues) => {
    const dto: SaveFinanceAccountDTO = {
      ...(account?.accountId ? { accountId: account.accountId } : {}),
      name: values.name.trim(),
      bankCode: values.bankCode.trim() || undefined,
      bankName: values.bankName.trim() || undefined,
      agency: values.agency.trim() || undefined,
      agencyDigit: values.agencyDigit.trim() || undefined,
      accountNumber: values.accountNumber.trim() || undefined,
      accountDigit: values.accountDigit.trim() || undefined,
      accountType: (values.accountType as AccountType) || undefined,
      holderName: values.holderName.trim() || undefined,
      holderDocumentType: (values.holderDocumentType as HolderDocumentType) || undefined,
      holderDocument: values.holderDocument || undefined,
      pixKey: values.pixKey.trim() || undefined,
      asaasWalletId: values.asaasWalletId.trim() || undefined,
    };

    saveAccount.mutate(dto, {
      onSuccess: (saved) => {
        toast.success(isEditing ? 'Conta atualizada!' : 'Conta criada!');
        onSaved(saved);
      },
    });
  };

  const handleDelete = () => {
    if (!account) {
      return;
    }
    deleteAccount.mutate(account.accountId, {
      onSuccess: () => {
        toast.success('Conta excluída!');
        onDeleted(account.accountId);
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
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-[15px] font-bold text-text">
              {isEditing ? 'Detalhes da conta bancária' : 'Nova conta bancária'}
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
            id="bank-account-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 space-y-5 overflow-y-auto p-6"
          >
            <FormInput
              label="Nome da conta *"
              error={errors.name?.message}
              {...register('name', { required: 'Nome obrigatório' })}
            />

            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
                Dados bancários
              </h3>

              <div className="form-grid">
                <FormInput
                  label="Código do banco"
                  error={errors.bankCode?.message}
                  {...register('bankCode')}
                />
                <FormInput
                  label="Nome do banco"
                  error={errors.bankName?.message}
                  {...register('bankName')}
                />
              </div>

              <div className="form-grid">
                <FormInput
                  label="Agência"
                  error={errors.agency?.message}
                  {...register('agency')}
                />
                <FormInput label="Dígito da agência" {...register('agencyDigit')} />
              </div>

              <div className="form-grid">
                <FormInput
                  label="Conta"
                  error={errors.accountNumber?.message}
                  {...register('accountNumber')}
                />
                <FormInput label="Dígito da conta" {...register('accountDigit')} />
              </div>

              <Controller
                name="accountType"
                control={control}
                render={({ field }) => (
                  <FormSelect
                    label="Tipo de conta"
                    error={errors.accountType?.message}
                    {...field}
                  >
                    <option value="">— não informado —</option>
                    {ACCOUNT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {ACCOUNT_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </FormSelect>
                )}
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
                Titular
              </h3>

              <FormInput
                label="Nome do titular"
                error={errors.holderName?.message}
                {...register('holderName')}
              />

              <div className="form-grid">
                <Controller
                  name="holderDocumentType"
                  control={control}
                  render={({ field }) => (
                    <FormSelect label="Tipo de documento" {...field}>
                      <option value="">— não informado —</option>
                      {HOLDER_DOCUMENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {HOLDER_DOCUMENT_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </FormSelect>
                  )}
                />

                <Controller
                  name="holderDocument"
                  control={control}
                  render={({ field }) =>
                    holderDocumentType === 'cnpj' ? (
                      <CnpjInput
                        label="CNPJ"
                        error={errors.holderDocument?.message}
                        {...field}
                      />
                    ) : (
                      <CpfInput
                        label="CPF"
                        error={errors.holderDocument?.message}
                        {...field}
                      />
                    )
                  }
                />
              </div>

              <FormInput label="Chave PIX" {...register('pixKey')} />
            </div>

            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
                Asaas
              </h3>
              <FormInput label="Wallet ID" {...register('asaasWalletId')} />
              <p className="text-[11px] text-text-muted">
                Id da carteira (subconta) Asaas vinculada a esta conta. A chave de API
                fica em Configurações → Integrações e vale pra todas as contas.
              </p>
            </div>
          </form>

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
                form="bank-account-form"
                disabled={saveAccount.isPending}
                className="btn-primary"
              >
                {saveAccount.isPending && <Spinner size={12} />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && account && (
        <ConfirmDeleteModal
          title="Excluir conta bancária"
          description={`Excluir "${account.name}"? Esta ação não pode ser desfeita.`}
          isDeleting={deleteAccount.isPending}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}
