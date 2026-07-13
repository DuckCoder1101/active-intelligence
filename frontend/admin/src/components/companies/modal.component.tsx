import { useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type { DefaultValues, FieldErrors } from 'react-hook-form';
import { IMaskInput } from 'react-imask';
import { toast } from 'react-toastify';

import {
  buildFinancialPayload,
  defaultFinancialFormValues,
  type FinancialFormValues,
} from '@/components/companies/company/admin-tab.component';
import { Modal } from '@/components/layout/modal.component';
import { FormInput } from '@/components/ui/form-input.component';
import { FormSelect } from '@/components/ui/form-select.component';
import { MultiSelect } from '@/components/ui/multi-select.component';
import { Spinner } from '@/components/ui/spinner.component';
import { Tabs } from '@/components/ui/tabs.component';
import { BRAZILIAN_STATES } from '@/constants/brazilian-states.const';
import { useAuth } from '@/contexts/auth.context';
import type { SaveCompanyDTO } from '@/models/company.model';
import { adminsQueryOptions } from '@/queries/admin.queries';
import { useSaveCompanyMutation } from '@/queries/company.queries';
import {
  contractedServicesQueryOptions,
  useSaveContractedServiceMutation,
} from '@/queries/contracted-service.queries';
import AdminService from '@/services/admin.service';
import UserService from '@/services/user.service';
import type { RouteAccessLevel } from '@/types/route-access.type';
import { checkRouteAccess } from '@/utils/checkRouteAccess.util';
import { firstTabWithError } from '@/utils/firstTabWithError.util';
import { mapFirebaseError } from '@/utils/mapFirebaseError.util';

const FORM_ID = 'company-form';

const FINANCIAL_TAB_ACCESS: RouteAccessLevel = {
  minAccessLevel: 'admin',
  permissions: ['manage-finance'],
};

type CompanyFormValues = Omit<SaveCompanyDTO, 'business' | 'financial'> & {
  ownerEmail?: string;
  business: NonNullable<SaveCompanyDTO['business']>;
  financial: FinancialFormValues;
};

const defaultValues: DefaultValues<CompanyFormValues> = {
  companyStage: 'comercial',
  business: {
    businessSector: 'imobiliaria',
  },
  location: {
    state: 'SP',
  },
  financial: defaultFinancialFormValues,
};

interface CompanyModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export function CreateCompanyModal({ onClose, onSaved }: CompanyModalProps) {
  const [activeTab, setActiveTab] = useState('empresa');
  const saveCompany = useSaveCompanyMutation();
  const saveContractedService = useSaveContractedServiceMutation();
  const { claims } = useAuth();
  const canViewFinancial = checkRouteAccess(claims, FINANCIAL_TAB_ACCESS);
  const { data: contractedServices } = useSuspenseQuery(
    contractedServicesQueryOptions(),
  );
  const { data: admins } = useSuspenseQuery(adminsQueryOptions());

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CompanyFormValues>({ defaultValues });

  const businessSector = useWatch({
    control,
    name: 'business.businessSector',
  });
  const contractType = useWatch({ control, name: 'financial.contractType' });
  const tcvPaymentType = useWatch({
    control,
    name: 'financial.tcv.paymentType',
  });

  useEffect(() => {
    if (businessSector !== 'outro') {
      setValue('business.customSegment', undefined);
    }
  }, [businessSector, setValue]);

  const onSubmit = ({
    ownerEmail,
    business: biz,
    financial,
    ...raw
  }: CompanyFormValues) => {
    const data = {
      ...raw,
      business: {
        ...biz,
        customSegment:
          biz.businessSector === 'outro'
            ? biz.customSegment || undefined
            : undefined,
        revenueRange: biz.revenueRange || undefined,
      },
      social:
        raw.social?.websiteUrl ||
        raw.social?.instagramUsername ||
        raw.social?.linkedInUsername
          ? raw.social
          : undefined,
      extra: raw.extra?.observations ? raw.extra : undefined,
      financial: buildFinancialPayload(financial),
    } as SaveCompanyDTO;

    saveCompany.mutate(data, {
      onSuccess: async () => {
        if (ownerEmail) {
          try {
            await AdminService.inviteAdmin(ownerEmail);
            await UserService.sendRecoverPasswordEmail(ownerEmail);
          } catch (err) {
            toast.error(mapFirebaseError(err));
          }
        }
        toast.success('Empresa cadastrada!');
        onSaved();
      },
    });
  };

  const onError = (errs: FieldErrors<CompanyFormValues>) => {
    const tab = firstTabWithError({
      empresa: !!(
        errs.displayName ||
        errs.legalInformation ||
        errs.contact ||
        errs.companyStage
      ),
      mercado: !!errs.business,
      localizacao: !!errs.location,
      redes: !!errs.social,
      observacoes: !!errs.extra,
      administrativo: !!errs.financial,
    });
    if (tab) {
      setActiveTab(tab);
    }
  };

  const tabErrors = {
    empresa: !!(
      errors.displayName ||
      errors.legalInformation ||
      errors.contact ||
      errors.companyStage
    ),
    mercado: !!errors.business,
    localizacao: !!errors.location,
    redes: !!errors.social,
    observacoes: !!errors.extra,
    administrativo: !!errors.financial,
  };

  const TABS = [
    {
      id: 'empresa',
      label: 'Empresa',
      hasError: tabErrors.empresa,
    },
    {
      id: 'mercado',
      label: 'Mercado',
      hasError: tabErrors.mercado,
    },
    {
      id: 'localizacao',
      label: 'Localização',
      hasError: tabErrors.localizacao,
    },
    {
      id: 'redes',
      label: 'Redes',
      hasError: tabErrors.redes,
    },
    {
      id: 'observacoes',
      label: 'Observações',
      hasError: tabErrors.observacoes,
    },
    ...(canViewFinancial
      ? [
          {
            id: 'administrativo',
            label: 'Administrativo',
            hasError: tabErrors.administrativo,
          },
        ]
      : []),
  ];

  const footer = (
    <div className="flex items-center gap-3">
      <div className="ml-auto flex gap-3">
        <button type="button" onClick={onClose} className="btn-ghost">
          Cancelar
        </button>
        <button
          form={FORM_ID}
          type="submit"
          disabled={saveCompany.isPending}
          className="btn-primary"
        >
          {saveCompany.isPending && <Spinner size={12} />}
          Salvar
        </button>
      </div>
    </div>
  );

  return (
    <Modal title={'Cadastra empresa'} onClose={onClose} footer={footer}>
      <div className="mb-5">
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit, onError)}>
        {/* Empresa */}
        <div className={activeTab === 'empresa' ? 'space-y-4' : 'hidden'}>
          <FormInput
            label="Nome de exibição *"
            placeholder="Nome do cliente"
            error={errors.displayName?.message}
            {...register('displayName', {
              required: 'Nome de exibição obrigatório',
            })}
          />
          <div className="form-grid">
            <FormInput
              label="Razão social"
              placeholder="Razão social"
              {...register('legalInformation.legalName')}
            />
            <FormInput
              label="Nome fantasia"
              placeholder="Nome fantasia"
              {...register('legalInformation.tradeName')}
            />
          </div>
          <Controller
            name="legalInformation.documentNumber"
            control={control}
            rules={{
              required: 'CNPJ obrigatório',
              validate: (v) =>
                v.replace(/\D/g, '').length === 14 ||
                'CNPJ deve ter 14 dígitos',
            }}
            render={({ field }) => (
              <FormInput
                as={IMaskInput}
                mask="00.000.000/0000-00"
                label="CNPJ *"
                type="tel"
                placeholder="00.000.000/0000-00"
                error={errors.legalInformation?.documentNumber?.message}
                {...field}
                onAccept={(value: string) => field.onChange(value)}
              />
            )}
          />
          <div className="form-grid">
            <FormInput
              label="E-mail *"
              type="email"
              placeholder="email@empresa.com"
              error={errors.contact?.email?.message}
              {...register('contact.email', {
                required: 'E-mail obrigatório',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'E-mail inválido',
                },
              })}
            />
            <Controller
              name="contact.phone"
              control={control}
              rules={{ required: 'Telefone obrigatório' }}
              render={({ field }) => (
                <FormInput
                  as={IMaskInput}
                  mask={[
                    { mask: '(00) 0000-0000' },
                    { mask: '(00) 00000-0000' },
                  ]}
                  label="Telefone *"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  error={errors.contact?.phone?.message}
                  {...field}
                  onAccept={(value: string) => field.onChange(value)}
                />
              )}
            />
          </div>
          <FormInput as="select" label="Estágio" {...register('companyStage')}>
            <option value="comercial">Comercial</option>
            <option value="operacional">Operacional</option>
          </FormInput>
        </div>

        {/* Mercado */}
        <div className={activeTab === 'mercado' ? 'space-y-4' : 'hidden'}>
          <div className="form-grid">
            <FormInput
              as="select"
              label="Setor de atuação"
              {...register('business.businessSector')}
            >
              <option value="imobiliaria">Imobiliária</option>
              <option value="construtora">Construtora</option>
              <option value="incorporadora">Incorporadora</option>
              <option value="corretor_autonomo">Corretor Autônomo</option>
              <option value="outro">Outro</option>
            </FormInput>
            <FormInput
              label="Segmento personalizado"
              placeholder={businessSector === 'outro' ? 'Ex: Loteamentos' : '—'}
              disabled={businessSector !== 'outro'}
              className={
                businessSector !== 'outro'
                  ? 'cursor-not-allowed opacity-50'
                  : ''
              }
              {...register('business.customSegment')}
            />
          </div>
          <div className="form-grid">
            <Controller
              name="business.cnae"
              control={control}
              render={({ field }) => (
                <FormInput
                  as={IMaskInput}
                  mask="0000-0/00"
                  label="CNAE"
                  type="tel"
                  placeholder="0000-0/00"
                  {...field}
                  onAccept={(value: string) => field.onChange(value)}
                />
              )}
            />
            <FormInput
              as="select"
              label="Faixa de faturamento"
              {...register('business.revenueRange')}
            >
              <option value="">Não informado</option>
              <option value="UpTo500K">Até R$ 500K</option>
              <option value="From500KTo2M">R$ 500K a R$ 2M</option>
              <option value="From2MTo5M">R$ 2M a R$ 5M</option>
              <option value="From5MTo10M">R$ 5M a R$ 10M</option>
              <option value="From10MTo30M">R$ 10M a R$ 30M</option>
              <option value="From30MTo100M">R$ 30M a R$ 100M</option>
              <option value="Above100M">Acima de R$ 100M</option>
            </FormInput>
          </div>
          <div className="form-grid">
            <FormInput
              label="Nº de funcionários"
              type="number"
              min={0}
              placeholder="0"
              {...register('business.quantityOfEmployees', {
                setValueAs: (v) =>
                  v === '' || v === null ? undefined : Number(v),
              })}
            />
            <FormInput
              label="Nº de corretores"
              type="number"
              min={0}
              placeholder="0"
              {...register('business.quantityOfBrokers', {
                setValueAs: (v) =>
                  v === '' || v === null ? undefined : Number(v),
              })}
            />
          </div>
        </div>

        {/* Localização */}
        <div className={activeTab === 'localizacao' ? 'space-y-4' : 'hidden'}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <FormInput
                label="Endereço"
                placeholder="Rua, Avenida..."
                {...register('location.address')}
              />
            </div>
            <FormInput
              label="Número"
              placeholder="000"
              {...register('location.number')}
            />
          </div>
          <div className="form-grid">
            <FormInput
              label="Complemento"
              placeholder="Apto, Sala..."
              {...register('location.complement')}
            />
            <FormInput
              label="Bairro"
              placeholder="Bairro"
              {...register('location.neighborhood')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Controller
              name="location.zipCode"
              control={control}
              rules={{
                validate: (v) =>
                  !v ||
                  v.replace(/\D/g, '').length === 8 ||
                  'CEP deve ter 8 dígitos',
              }}
              render={({ field }) => (
                <FormInput
                  as={IMaskInput}
                  mask="00000-000"
                  label="CEP"
                  type="tel"
                  placeholder="00000-000"
                  error={errors.location?.zipCode?.message}
                  {...field}
                  onAccept={(value: string) => field.onChange(value)}
                />
              )}
            />
            <FormInput
              label="Cidade *"
              placeholder="Cidade"
              error={errors.location?.city?.message}
              {...register('location.city', { required: 'Cidade obrigatória' })}
            />
            <FormInput
              as="select"
              label="Estado *"
              {...register('location.state', {
                required: 'Estado obrigatório',
              })}
            >
              {BRAZILIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </FormInput>
          </div>
        </div>

        {/* Redes */}
        <div className={activeTab === 'redes' ? 'space-y-4' : 'hidden'}>
          <FormInput
            label="Site"
            type="url"
            placeholder="https://www.empresa.com.br"
            {...register('social.websiteUrl')}
          />
          <FormInput
            label="Instagram"
            placeholder="@usuario"
            {...register('social.instagramUsername')}
          />
          <FormInput
            label="LinkedIn"
            placeholder="usuario ou URL do perfil"
            {...register('social.linkedInUsername')}
          />
        </div>

        {/* Observações */}
        <div className={activeTab === 'observacoes' ? 'space-y-4' : 'hidden'}>
          <FormInput
            as="textarea"
            label="Observações"
            placeholder="Observações sobre o cliente..."
            className="min-h-40 resize-none"
            {...register('extra.observations')}
          />
          <div className="mt-4">
            <FormInput
              label="Limite mensal de tarefas (opcional)"
              type="number"
              placeholder="Sem limite"
              min="1"
              {...register('monthlyTaskLimit', {
                setValueAs: (v) =>
                  v === '' || v === null ? undefined : Number(v),
              })}
            />
            <p className="mt-1.5 text-[11px] text-text-muted">
              Máximo de tarefas que o cliente pode criar por mês. Deixe em
              branco para ilimitado.
            </p>
          </div>
        </div>

        {/* Administrativo */}
        {canViewFinancial && (
          <div
            className={activeTab === 'administrativo' ? 'space-y-4' : 'hidden'}
          >
            <Controller
              name="financial.contractedServiceIds"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  label="Serviço contratado"
                  options={contractedServices.map((s) => ({
                    value: s.serviceId,
                    label: s.name,
                  }))}
                  selected={field.value}
                  onChange={field.onChange}
                  createLabel="Adicionar novo serviço"
                  onCreateOption={async (name) => {
                    const created =
                      await saveContractedService.mutateAsync(name);
                    return created.serviceId;
                  }}
                />
              )}
            />

            <FormSelect
              label="Tipo de contrato"
              {...register('financial.contractType')}
            >
              <option value="">Selecione...</option>
              <option value="mrr">Recorrente (MRR)</option>
              <option value="tcv">Fechado (TCV)</option>
            </FormSelect>

            {contractType === 'mrr' && (
              <div className="space-y-4 border-t border-border pt-4">
                <div className="form-grid">
                  <FormInput
                    label="Valor mensal (R$) *"
                    type="number"
                    min="0"
                    step="0.01"
                    error={errors.financial?.mrr?.monthlyValue?.message}
                    {...register('financial.mrr.monthlyValue', {
                      required: 'Valor mensal obrigatório',
                      setValueAs: (v) => (v === '' ? '' : Number(v)),
                    })}
                  />
                  <FormSelect
                    label="Forma de pagamento *"
                    error={errors.financial?.mrr?.paymentMethod?.message}
                    {...register('financial.mrr.paymentMethod', {
                      required: 'Forma de pagamento obrigatória',
                    })}
                  >
                    <option value="">Selecione...</option>
                    <option value="pix">PIX</option>
                    <option value="boleto">Boleto</option>
                    <option value="cartao">Cartão</option>
                  </FormSelect>
                </div>
                <div className="form-grid">
                  <FormInput
                    label="Dia de vencimento *"
                    type="number"
                    min="1"
                    max="31"
                    error={errors.financial?.mrr?.dueDay?.message}
                    {...register('financial.mrr.dueDay', {
                      required: 'Dia de vencimento obrigatório',
                      setValueAs: (v) => (v === '' ? '' : Number(v)),
                    })}
                  />
                  <FormInput
                    label="Fidelidade (meses)"
                    type="number"
                    min="0"
                    placeholder="Sem fidelidade"
                    {...register('financial.mrr.loyaltyMonths', {
                      setValueAs: (v) => (v === '' ? '' : Number(v)),
                    })}
                  />
                </div>
                <div className="form-grid">
                  <FormInput
                    label="Data de início *"
                    type="date"
                    error={errors.financial?.mrr?.startDate?.message}
                    {...register('financial.mrr.startDate', {
                      required: 'Data de início obrigatória',
                    })}
                  />
                  <FormInput
                    label="Data de término"
                    type="date"
                    {...register('financial.mrr.endDate')}
                  />
                </div>
              </div>
            )}

            {contractType === 'tcv' && (
              <div className="space-y-4 border-t border-border pt-4">
                <FormInput
                  label="Valor total do contrato (R$) *"
                  type="number"
                  min="0"
                  step="0.01"
                  error={errors.financial?.tcv?.totalValue?.message}
                  {...register('financial.tcv.totalValue', {
                    required: 'Valor total obrigatório',
                    setValueAs: (v) => (v === '' ? '' : Number(v)),
                  })}
                />
                <FormSelect
                  label="Forma de pagamento *"
                  error={errors.financial?.tcv?.paymentType?.message}
                  {...register('financial.tcv.paymentType', {
                    required: 'Forma de pagamento obrigatória',
                  })}
                >
                  <option value="">Selecione...</option>
                  <option value="avista">À vista</option>
                  <option value="parcelado">Parcelado</option>
                </FormSelect>

                {tcvPaymentType === 'avista' && (
                  <FormSelect
                    label="Método (à vista) *"
                    error={errors.financial?.tcv?.paymentMethod?.message}
                    {...register('financial.tcv.paymentMethod', {
                      required: 'Método de pagamento obrigatório',
                    })}
                  >
                    <option value="">Selecione...</option>
                    <option value="pix">PIX</option>
                    <option value="cartao">Cartão</option>
                    <option value="boleto">Boleto</option>
                  </FormSelect>
                )}

                {tcvPaymentType === 'parcelado' && (
                  <div className="form-grid">
                    <FormInput
                      label="Número de parcelas *"
                      type="number"
                      min="1"
                      error={errors.financial?.tcv?.installments?.message}
                      {...register('financial.tcv.installments', {
                        required: 'Número de parcelas obrigatório',
                        setValueAs: (v) => (v === '' ? '' : Number(v)),
                      })}
                    />
                    <FormInput
                      label="Valor por parcela (R$) *"
                      type="number"
                      min="0"
                      step="0.01"
                      error={errors.financial?.tcv?.installmentValue?.message}
                      {...register('financial.tcv.installmentValue', {
                        required: 'Valor por parcela obrigatório',
                        setValueAs: (v) => (v === '' ? '' : Number(v)),
                      })}
                    />
                  </div>
                )}

                <div className="form-grid">
                  <FormInput
                    label="Data de início *"
                    type="date"
                    error={errors.financial?.tcv?.startDate?.message}
                    {...register('financial.tcv.startDate', {
                      required: 'Data de início obrigatória',
                    })}
                  />
                  <FormInput
                    label="Data de término *"
                    type="date"
                    error={errors.financial?.tcv?.endDate?.message}
                    {...register('financial.tcv.endDate', {
                      required: 'Data de término obrigatória',
                    })}
                  />
                </div>
              </div>
            )}

            <FormSelect
              label="Responsável administrativo"
              {...register('financial.administrativeResponsibleUid')}
            >
              <option value="">Não definido</option>
              {admins.map((admin) => (
                <option key={admin.uid} value={admin.uid}>
                  {admin.name}
                </option>
              ))}
            </FormSelect>
          </div>
        )}
      </form>
    </Modal>
  );
}
