import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  MdOutlineBusiness,
  MdOutlineBarChart,
  MdOutlineLocationOn,
  MdOutlineWifi,
  MdOutlineNotes,
  MdOutlineCalendarToday,
} from 'react-icons/md';
import { IMaskInput } from 'react-imask';
import { toast } from 'react-toastify';

import { SaveBar } from '@/components/layout/save-bar.component';
import { FormInput } from '@/components/ui/form-input.component';
import { Section } from '@/components/ui/section.component';
import { BRAZILIAN_STATES } from '@/constants/brazilian-states.const';
import { formatCNPJ } from '@/formatters/formatCnpj';
import { formatDateLong } from '@/formatters/formatDate';
import { formatPhone } from '@/formatters/formatPhone';
import type { Company, SaveCompanyDTO } from '@/models/company.model';
import { useSaveCompanyMutation } from '@/queries/company.queries';

const FORM_ID = 'client-info-form';

type CompanyFormBusiness = Omit<
  NonNullable<SaveCompanyDTO['business']>,
  'revenueRange'
> & {
  revenueRange: NonNullable<SaveCompanyDTO['business']>['revenueRange'] | '';
};

type CompanyFormValues = Omit<SaveCompanyDTO, 'business'> & {
  business: CompanyFormBusiness;
};

function formatCEP(raw: string): string {
  const d = raw.replace(/\D/g, '');
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : raw;
}

function formatCNAE(raw: string): string {
  const d = raw.replace(/\D/g, '');
  return d.length === 7 ? `${d.slice(0, 4)}-${d[4]}/${d.slice(5)}` : raw;
}

function toFormValues(c: Company): CompanyFormValues {
  return {
    companyId: c.companyId,
    displayName: c.displayName,
    companyStage: c.companyStage,
    legalInformation: {
      legalName: c.legalInformation.legalName ?? '',
      tradeName: c.legalInformation.tradeName ?? '',
      documentNumber: formatCNPJ(
        c.legalInformation.documentNumber.replace(/\D/g, ''),
      ),
    },
    contact: {
      email: c.contact.email,
      phone: c.contact.phone ? formatPhone(c.contact.phone) : '',
    },
    business: {
      businessSector: c.business?.businessSector ?? 'imobiliaria',
      customSegment: c.business?.customSegment ?? '',
      cnae: c.business?.cnae ? formatCNAE(c.business.cnae) : '',
      revenueRange: c.business?.revenueRange ?? '',
      quantityOfEmployees: c.business?.quantityOfEmployees,
      quantityOfBrokers: c.business?.quantityOfBrokers,
    },
    location: {
      address: c.location.address ?? '',
      number: c.location.number ?? '',
      complement: c.location.complement ?? '',
      neighborhood: c.location.neighborhood ?? '',
      city: c.location.city,
      state: c.location.state,
      zipCode: c.location.zipCode ? formatCEP(c.location.zipCode) : '',
    },
    social: {
      websiteUrl: c.social?.websiteUrl ?? '',
      instagramUsername: c.social?.instagramUsername ?? '',
      linkedInUsername: c.social?.linkedInUsername ?? '',
    },
    extra: {
      observations: c.extra?.observations ?? '',
    },
    monthlyTaskLimit: c.monthlyTaskLimit,
  };
}

interface Props {
  company: Company;
  onSaved: () => void;
}

export function ClientInfoTab({ company, onSaved }: Props) {
  const saveCompany = useSaveCompanyMutation();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<CompanyFormValues>({
    defaultValues: toFormValues(company),
  });

  const businessSector = useWatch({
    control,
    name: 'business.businessSector',
  });

  useEffect(() => {
    if (businessSector !== 'outro') {
      setValue('business.customSegment', undefined);
    }
  }, [businessSector, setValue]);

  useEffect(() => {
    reset(toFormValues(company));
  }, [company, reset]);

  const onSubmit = ({ business: biz, ...raw }: CompanyFormValues) => {
    const data = {
      ...raw,
      companyId: company.companyId,
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

    saveCompany.mutate(data, {
      onSuccess: () => {
        toast.success('Empresa atualizada!');
        onSaved();
      },
    });
  };

  return (
    <div className="space-y-4 pb-20">
      <form
        id={FORM_ID}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {/* Empresa */}
        <Section icon={MdOutlineBusiness} title="Empresa">
          <div className="space-y-4">
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
            <FormInput
              as="select"
              label="Estágio"
              {...register('companyStage')}
            >
              <option value="comercial">Comercial</option>
              <option value="operacional">Operacional</option>
            </FormInput>
          </div>
        </Section>

        {/* Mercado */}
        <Section icon={MdOutlineBarChart} title="Mercado">
          <div className="space-y-4">
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
                placeholder={
                  businessSector === 'outro' ? 'Ex: Loteamentos' : '—'
                }
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
        </Section>

        {/* Localização */}
        <Section icon={MdOutlineLocationOn} title="Localização">
          <div className="space-y-4">
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
                {...register('location.city', {
                  required: 'Cidade obrigatória',
                })}
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
        </Section>

        {/* Redes sociais */}
        <Section icon={MdOutlineWifi} title="Redes sociais">
          <div className="space-y-4">
            <FormInput
              label="Site"
              type="url"
              placeholder="https://www.empresa.com.br"
              {...register('social.websiteUrl')}
            />
            <div className="form-grid">
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
          </div>
        </Section>

        {/* Plano */}
        <Section icon={MdOutlineCalendarToday} title="Plano">
          <div className="form-grid">
            <FormInput
              label="Limite mensal de tarefas"
              type="number"
              placeholder="Sem limite"
              min="1"
              {...register('monthlyTaskLimit', {
                setValueAs: (v) =>
                  v === '' || v === null ? undefined : Number(v),
              })}
            />
          </div>
          <p className="mt-2 text-[11px] text-text-muted">
            Deixe em branco para não aplicar limite. O contador é zerado no
            início de cada mês.
          </p>
        </Section>

        {/* Observações */}
        <Section icon={MdOutlineNotes} title="Observações">
          <FormInput
            as="textarea"
            label="Observações"
            placeholder="Observações sobre o cliente..."
            className="min-h-32 resize-none"
            {...register('extra.observations')}
          />
        </Section>
      </form>

      {/* Registro — somente leitura */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <MdOutlineCalendarToday size={15} className="text-orange" />
          <p className="text-[13px] font-bold text-text">Registro</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="flex items-center justify-between gap-4 px-5 py-3.5">
            <span className="text-[12px] text-text-muted">Cadastrado em</span>
            <span className="text-right text-[13px] font-medium text-text">
              {formatDateLong(company.createdAt)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 px-5 py-3.5">
            <span className="text-[12px] text-text-muted">Atualizado em</span>
            <span className="text-right text-[13px] font-medium text-text">
              {formatDateLong(company.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      <SaveBar
        isDirty={isDirty}
        isSaving={saveCompany.isPending}
        formId={FORM_ID}
        onDiscard={() => reset(toFormValues(company))}
      />
    </div>
  );
}
