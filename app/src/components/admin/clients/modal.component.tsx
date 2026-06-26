import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { IMaskInput } from 'react-imask';
import { MdDelete } from 'react-icons/md';

import { Modal } from '@/components/layout/modal.component';
import { Tabs } from '@/components/ui/tabs.component';
import { FormInput } from '@/components/ui/form-input.component';
import { Spinner } from '@/components/ui/spinner.component';
import { CompanyMembersTab } from './client/members-tab.component';

import CompanyService from '@/services/company.service';
import AdminService from '@/services/admin.service';
import UserService from '@/services/user.service';

import { useHandleError } from '@/hooks/useHandleError.util';
import { useSnackbar } from '@/contexts/snackbar.context';
import { firstTabWithError } from '@/utils/firstTabWithError.util';

import type { DefaultValues, FieldErrors } from 'react-hook-form';
import type { Company, SaveCompanyDTO } from '@/models/company.model';
import { BRAZILIAN_STATES } from '@/constants/brazilian-states.const';

const FORM_ID = 'company-form';

type CompanyFormValues = Omit<SaveCompanyDTO, 'business'> & {
  ownerEmail?: string;
  business: NonNullable<SaveCompanyDTO['business']>;
};

const defaultValues: DefaultValues<CompanyFormValues> = {
  companyStage: 'comercial',
  business: {
    businessSector: 'imobiliaria',
  },
  location: {
    state: 'SP',
  },
};

interface CompanyModalProps {
  company?: Company | null;
  onClose: () => void;
  onSaved: () => void;
  onDelete?: () => void;
}

export function CompanyModal({
  company,
  onClose,
  onSaved,
  onDelete,
}: CompanyModalProps) {
  const [activeTab, setActiveTab] = useState('empresa');
  const [isSaving, setIsSaving] = useState(false);
  const handleError = useHandleError();
  const { pushSnackbar } = useSnackbar();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CompanyFormValues>({ defaultValues });

  const businessSector = watch('business.businessSector');

  useEffect(() => {
    if (businessSector !== 'outro') {
      setValue('business.customSegment', undefined);
    }
  }, [businessSector, setValue]);

  useEffect(() => {
    setActiveTab('empresa');
    reset(company ?? defaultValues);
  }, [company, reset]);

  const onSubmit = async ({
    ownerEmail,
    business: biz,
    ...raw
  }: CompanyFormValues) => {
    const data = {
      ...raw,
      companyId: company?.companyId,
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
    } as SaveCompanyDTO;

    setIsSaving(true);
    try {
      await CompanyService.saveCompany(data);
      if (!company && ownerEmail) {
        try {
          await AdminService.inviteAdmin(ownerEmail);
          await UserService.sendRecoverPasswordEmail(ownerEmail);
        } catch (err) {
          handleError(err);
        }
      }
      pushSnackbar({
        type: 'success',
        message: company ? 'Empresa atualizada!' : 'Empresa cadastrada!',
      });
      onSaved();
    } catch (err) {
      handleError(err);
    } finally {
      setIsSaving(false);
    }
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
      ...(!company ? { convite: !!errs.ownerEmail } : {}),
    });
    if (tab) setActiveTab(tab);
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
    convite: !!errors.ownerEmail,
  };

  const TABS = [
    { id: 'empresa', label: 'Empresa', hasError: tabErrors.empresa },
    { id: 'mercado', label: 'Mercado', hasError: tabErrors.mercado },
    {
      id: 'localizacao',
      label: 'Localização',
      hasError: tabErrors.localizacao,
    },
    { id: 'redes', label: 'Redes', hasError: tabErrors.redes },
    {
      id: 'observacoes',
      label: 'Observações',
      hasError: tabErrors.observacoes,
    },
    ...(company
      ? [{ id: 'membros', label: 'Membros' }]
      : [{ id: 'convite', label: 'Convite', hasError: tabErrors.convite }]),
  ];

  const footer = (
    <div className="flex items-center gap-3">
      {company && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="btn-danger"
        >
          <MdDelete size={16} />
          Excluir
        </button>
      )}
      <div className="ml-auto flex gap-3">
        <button type="button" onClick={onClose} className="btn-ghost">
          Cancelar
        </button>
        <button
          form={FORM_ID}
          type="submit"
          disabled={isSaving}
          className="btn-primary"
        >
          {isSaving && <Spinner size={12} />}
          Salvar
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      title={company ? 'Editar empresa' : 'Novo cliente'}
      onClose={onClose}
      footer={footer}
    >
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
                valueAsNumber: true,
              })}
            />
            <FormInput
              label="Nº de corretores"
              type="number"
              min={0}
              placeholder="0"
              {...register('business.quantityOfBrokers', {
                valueAsNumber: true,
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
                required: 'CEP obrigatório',
                validate: (v) =>
                  v.replace(/\D/g, '').length === 8 || 'CEP deve ter 8 dígitos',
              }}
              render={({ field }) => (
                <FormInput
                  as={IMaskInput}
                  mask="00000-000"
                  label="CEP *"
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
              {...register('monthlyTaskLimit', { valueAsNumber: true })}
            />
            <p className="mt-1.5 text-[11px] text-text-muted">
              Máximo de tarefas que o cliente pode criar por mês. Deixe em branco para ilimitado.
            </p>
          </div>
        </div>

        {/* Convite — somente cadastro */}
        {!company && (
          <div className={activeTab === 'convite' ? 'space-y-4' : 'hidden'}>
            <p className="text-[13px] text-text-sub">
              O responsável receberá um convite por e-mail para acessar o
              sistema como owner desta empresa.
            </p>
            <FormInput
              label="E-mail do responsável *"
              type="email"
              placeholder="responsavel@empresa.com"
              error={errors.ownerEmail?.message}
              {...register('ownerEmail', {
                required: 'E-mail do responsável obrigatório',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'E-mail inválido',
                },
              })}
            />
          </div>
        )}
      </form>

      {/* Membros — somente edição, fora do form */}
      {company && activeTab === 'membros' && (
        <CompanyMembersTab companyId={company.companyId} />
      )}
    </Modal>
  );
}
