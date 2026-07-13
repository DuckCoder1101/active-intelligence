import { useSuspenseQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  MdOutlineDescription,
  MdOutlineMiscellaneousServices,
  MdOutlinePersonOutline,
} from 'react-icons/md';
import { toast } from 'react-toastify';

import { SaveBar } from '@/components/layout/save-bar.component';
import { FormInput } from '@/components/ui/form-input.component';
import { FormSelect } from '@/components/ui/form-select.component';
import { MultiSelect } from '@/components/ui/multi-select.component';
import { Section } from '@/components/ui/section.component';
import type {
  Company,
  FinancialPaymentMethod,
  SaveCompanyDTO,
  TcvPaymentType,
} from '@/models/company.model';
import { adminsQueryOptions } from '@/queries/admin.queries';
import { useSaveCompanyMutation } from '@/queries/company.queries';
import {
  contractedServicesQueryOptions,
  useSaveContractedServiceMutation,
} from '@/queries/contracted-service.queries';

const FORM_ID = 'client-financial-form';

export interface FinancialFormValues {
  contractedServiceIds: string[];
  contractType: '' | 'mrr' | 'tcv';
  administrativeResponsibleUid: string;
  mrr: {
    monthlyValue: number | '';
    paymentMethod: '' | FinancialPaymentMethod;
    dueDay: number | '';
    loyaltyMonths: number | '';
    startDate: string;
    endDate: string;
  };
  tcv: {
    totalValue: number | '';
    paymentType: '' | TcvPaymentType;
    paymentMethod: '' | FinancialPaymentMethod;
    installments: number | '';
    installmentValue: number | '';
    startDate: string;
    endDate: string;
  };
}

export const defaultFinancialFormValues: FinancialFormValues = {
  contractedServiceIds: [],
  contractType: '',
  administrativeResponsibleUid: '',
  mrr: {
    monthlyValue: '',
    paymentMethod: '',
    dueDay: '',
    loyaltyMonths: '',
    startDate: '',
    endDate: '',
  },
  tcv: {
    totalValue: '',
    paymentType: '',
    paymentMethod: '',
    installments: '',
    installmentValue: '',
    startDate: '',
    endDate: '',
  },
};

function toDateInput(ms?: number): string {
  return ms ? new Date(ms).toISOString().split('T')[0] : '';
}

function fromDateInput(value: string): number {
  return new Date(`${value}T12:00:00`).getTime();
}

export function buildFinancialPayload(
  values: FinancialFormValues,
): NonNullable<SaveCompanyDTO['financial']> {
  return {
    contractedServiceIds: values.contractedServiceIds,
    contractType: values.contractType || undefined,
    administrativeResponsibleUid:
      values.administrativeResponsibleUid || undefined,
    mrr:
      values.contractType === 'mrr'
        ? {
            monthlyValue: Number(values.mrr.monthlyValue),
            paymentMethod: values.mrr.paymentMethod as FinancialPaymentMethod,
            dueDay: Number(values.mrr.dueDay),
            loyaltyMonths: values.mrr.loyaltyMonths
              ? Number(values.mrr.loyaltyMonths)
              : undefined,
            startDate: fromDateInput(values.mrr.startDate),
            endDate: values.mrr.endDate
              ? fromDateInput(values.mrr.endDate)
              : undefined,
          }
        : undefined,
    tcv:
      values.contractType === 'tcv'
        ? {
            totalValue: Number(values.tcv.totalValue),
            paymentType: values.tcv.paymentType as TcvPaymentType,
            paymentMethod:
              values.tcv.paymentType === 'avista'
                ? (values.tcv.paymentMethod as FinancialPaymentMethod)
                : undefined,
            installments:
              values.tcv.paymentType === 'parcelado'
                ? Number(values.tcv.installments)
                : undefined,
            installmentValue:
              values.tcv.paymentType === 'parcelado'
                ? Number(values.tcv.installmentValue)
                : undefined,
            startDate: fromDateInput(values.tcv.startDate),
            endDate: fromDateInput(values.tcv.endDate),
          }
        : undefined,
  };
}

function toFormValues(c: Company): FinancialFormValues {
  const f = c.financial;
  return {
    contractedServiceIds: f?.contractedServiceIds ?? [],
    contractType: f?.contractType ?? '',
    administrativeResponsibleUid: f?.administrativeResponsibleUid ?? '',
    mrr: {
      monthlyValue: f?.mrr?.monthlyValue ?? '',
      paymentMethod: f?.mrr?.paymentMethod ?? '',
      dueDay: f?.mrr?.dueDay ?? '',
      loyaltyMonths: f?.mrr?.loyaltyMonths ?? '',
      startDate: toDateInput(f?.mrr?.startDate),
      endDate: toDateInput(f?.mrr?.endDate),
    },
    tcv: {
      totalValue: f?.tcv?.totalValue ?? '',
      paymentType: f?.tcv?.paymentType ?? '',
      paymentMethod: f?.tcv?.paymentMethod ?? '',
      installments: f?.tcv?.installments ?? '',
      installmentValue: f?.tcv?.installmentValue ?? '',
      startDate: toDateInput(f?.tcv?.startDate),
      endDate: toDateInput(f?.tcv?.endDate),
    },
  };
}

interface Props {
  company: Company;
  onSaved: () => void;
}

export function ClientFinancialTab({ company, onSaved }: Props) {
  const saveCompany = useSaveCompanyMutation();
  const saveContractedService = useSaveContractedServiceMutation();
  const { data: contractedServices } = useSuspenseQuery(
    contractedServicesQueryOptions(),
  );
  const { data: admins } = useSuspenseQuery(adminsQueryOptions());

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FinancialFormValues>({
    defaultValues: toFormValues(company),
  });

  const contractType = useWatch({ control, name: 'contractType' });
  const tcvPaymentType = useWatch({ control, name: 'tcv.paymentType' });

  useEffect(() => {
    reset(toFormValues(company));
  }, [company, reset]);

  const onSubmit = (values: FinancialFormValues) => {
    const data: SaveCompanyDTO = {
      companyId: company.companyId,
      displayName: company.displayName,
      companyStage: company.companyStage,
      legalInformation: company.legalInformation,
      contact: company.contact,
      business: company.business,
      location: company.location,
      social: company.social,
      extra: company.extra,
      monthlyTaskLimit: company.monthlyTaskLimit,
      financial: buildFinancialPayload(values),
    } as SaveCompanyDTO;

    saveCompany.mutate(data, {
      onSuccess: () => {
        toast.success('Dados administrativos atualizados!');
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
        <Section icon={MdOutlineMiscellaneousServices} title="Serviços">
          <Controller
            name="contractedServiceIds"
            control={control}
            render={({ field }) => (
              <MultiSelect
                label="Serviços contratados"
                options={contractedServices.map((s) => ({
                  value: s.serviceId,
                  label: s.name,
                }))}
                selected={field.value}
                onChange={field.onChange}
                createLabel="Adicionar novo serviço"
                onCreateOption={async (name) => {
                  const created = await saveContractedService.mutateAsync(name);
                  return created.serviceId;
                }}
              />
            )}
          />
        </Section>

        <Section icon={MdOutlineDescription} title="Contrato">
          <div className="space-y-4">
            <FormSelect
              label="Tipo de contrato *"
              {...register('contractType', {
                required: true,
              })}
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
                    error={errors.mrr?.monthlyValue?.message}
                    {...register('mrr.monthlyValue', {
                      required: 'Valor mensal obrigatório',
                      setValueAs: (v) => (v === '' ? '' : Number(v)),
                    })}
                  />
                  <FormSelect
                    label="Forma de pagamento *"
                    error={errors.mrr?.paymentMethod?.message}
                    {...register('mrr.paymentMethod', {
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
                    error={errors.mrr?.dueDay?.message}
                    {...register('mrr.dueDay', {
                      required: 'Dia de vencimento obrigatório',
                      setValueAs: (v) => (v === '' ? '' : Number(v)),
                    })}
                  />
                  <FormInput
                    label="Fidelidade (meses)"
                    type="number"
                    min="0"
                    placeholder="Sem fidelidade"
                    {...register('mrr.loyaltyMonths', {
                      setValueAs: (v) => (v === '' ? '' : Number(v)),
                    })}
                  />
                </div>
                <div className="form-grid">
                  <FormInput
                    label="Data de início *"
                    type="date"
                    error={errors.mrr?.startDate?.message}
                    {...register('mrr.startDate', {
                      required: 'Data de início obrigatória',
                    })}
                  />
                  <FormInput
                    label="Data de término"
                    type="date"
                    {...register('mrr.endDate')}
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
                  error={errors.tcv?.totalValue?.message}
                  {...register('tcv.totalValue', {
                    required: 'Valor total obrigatório',
                    setValueAs: (v) => (v === '' ? '' : Number(v)),
                  })}
                />
                <FormSelect
                  label="Forma de pagamento *"
                  error={errors.tcv?.paymentType?.message}
                  {...register('tcv.paymentType', {
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
                    error={errors.tcv?.paymentMethod?.message}
                    {...register('tcv.paymentMethod', {
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
                      error={errors.tcv?.installments?.message}
                      {...register('tcv.installments', {
                        required: 'Número de parcelas obrigatório',
                        setValueAs: (v) => (v === '' ? '' : Number(v)),
                      })}
                    />
                    <FormInput
                      label="Valor por parcela (R$) *"
                      type="number"
                      min="0"
                      step="0.01"
                      error={errors.tcv?.installmentValue?.message}
                      {...register('tcv.installmentValue', {
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
                    error={errors.tcv?.startDate?.message}
                    {...register('tcv.startDate', {
                      required: 'Data de início obrigatória',
                    })}
                  />
                  <FormInput
                    label="Data de término *"
                    type="date"
                    error={errors.tcv?.endDate?.message}
                    {...register('tcv.endDate', {
                      required: 'Data de término obrigatória',
                    })}
                  />
                </div>
              </div>
            )}
          </div>
        </Section>

        <Section icon={MdOutlinePersonOutline} title="Responsável">
          <FormSelect
            label="Responsável administrativo"
            {...register('administrativeResponsibleUid')}
          >
            <option value="">Não definido</option>
            {admins.map((admin) => (
              <option key={admin.uid} value={admin.uid}>
                {admin.name}
              </option>
            ))}
          </FormSelect>
        </Section>
      </form>

      <SaveBar
        isDirty={isDirty}
        isSaving={saveCompany.isPending}
        formId={FORM_ID}
        onDiscard={() => reset(toFormValues(company))}
      />
    </div>
  );
}
