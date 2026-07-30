import { Controller, useFormContext, useWatch } from 'react-hook-form';

import type { FormValues } from './form.component';

import { FormInput } from '@/components/ui/form-input.component';
import { FormSelect } from '@/components/ui/form-select.component';
import { PhoneInput } from '@/components/ui/phone-input.component';
import {
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPES,
  REAL_ESTATE_PURPOSE_LABELS,
  REAL_ESTATE_PURPOSES,
} from '@/models/real-estate.model';

export function RealEstateIdentificationTab() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<FormValues>();

  const propertyType = useWatch({ control, name: 'propertyType' });
  const description = useWatch({ control, name: 'description' });

  return (
    <div className="space-y-4">
      <FormInput
        label="Título (opcional, máx. 60 caracteres)"
        maxLength={60}
        {...register('title')}
      />

      <FormInput
        as="textarea"
        label={`Descrição (opcional, máx. 2500 caracteres) — ${description.length}/2500`}
        rows={4}
        maxLength={2500}
        className="min-h-24 resize-none"
        {...register('description', {
          maxLength: {
            value: 2500,
            message: 'Descrição deve ter no máximo 2500 caracteres',
          },
        })}
        error={errors.description?.message}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub">
            Tipo de imóvel *
          </p>
          <Controller
            name="propertyType"
            control={control}
            rules={{ required: 'Tipo de imóvel obrigatório' }}
            render={({ field }) => (
              <FormSelect error={errors.propertyType?.message} {...field}>
                <option value="">Selecione...</option>
                {PROPERTY_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {PROPERTY_TYPE_LABELS[value]}
                  </option>
                ))}
              </FormSelect>
            )}
          />
        </div>
        {propertyType === 'outro' && (
          <FormInput label="Qual tipo?" {...register('propertyTypeOther')} />
        )}
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub">
          Finalidade *
        </p>
        <Controller
          name="purposes"
          control={control}
          rules={{
            validate: (v) =>
              v.length > 0 || 'Selecione ao menos uma finalidade',
          }}
          render={({ field }) => (
            <div className="flex flex-wrap gap-1.5">
              {REAL_ESTATE_PURPOSES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    field.onChange(
                      field.value.includes(value)
                        ? field.value.filter((p) => p !== value)
                        : [...field.value, value],
                    )
                  }
                  className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                    field.value.includes(value)
                      ? 'bg-orange text-white'
                      : 'bg-bg text-text-sub hover:bg-border'
                  }`}
                >
                  {REAL_ESTATE_PURPOSE_LABELS[value]}
                </button>
              ))}
            </div>
          )}
        />
        {errors.purposes?.message && (
          <span className="mt-1.5 block text-[11px] text-danger">
            {errors.purposes.message}
          </span>
        )}
      </div>

      <FormInput
        as="textarea"
        label="Observações internas"
        rows={2}
        className="min-h-16 resize-none"
        {...register('internalNotes')}
      />

      <div className="border-t border-border pt-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.5px] text-text-sub">
          Proprietário
        </p>
        <div className="space-y-4">
          <FormInput
            label="Nome *"
            error={errors.ownerName?.message}
            {...register('ownerName', {
              required: 'Nome do proprietário obrigatório',
            })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="ownerPhone"
              control={control}
              rules={{ required: 'Telefone do proprietário obrigatório' }}
              render={({ field }) => (
                <PhoneInput
                  label="Telefone *"
                  error={errors.ownerPhone?.message}
                  {...field}
                />
              )}
            />
            <FormInput
              label="E-mail"
              type="email"
              error={errors.ownerEmail?.message}
              {...register('ownerEmail', {
                validate: (v) =>
                  !v ||
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ||
                  'E-mail inválido',
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
