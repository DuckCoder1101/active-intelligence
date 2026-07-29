import { Controller, useFormContext, useWatch } from 'react-hook-form';

import type { FormValues } from './form.component';

import { CepInput } from '@/components/ui/cep-input.component';
import { FormInput } from '@/components/ui/form-input.component';
import { FormSelect } from '@/components/ui/form-select.component';
import { MoneyInput } from '@/components/ui/money-input.component';
import { BRAZILIAN_STATES } from '@/constants/brazilian-states.const';

export function RealEstateLocationTab() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<FormValues>();

  const hasCondominium = useWatch({ control, name: 'hasCondominium' });

  return (
    <div className="space-y-4">
      <FormInput
        label="Endereço *"
        error={errors.address?.message}
        {...register('address', { required: 'Endereço obrigatório' })}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Número" {...register('addressNumber')} />
        <FormInput label="Complemento" {...register('complement')} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormInput
          label="Bairro *"
          error={errors.neighborhood?.message}
          {...register('neighborhood', { required: 'Bairro obrigatório' })}
        />
        <FormInput
          label="Região"
          placeholder="Ex: Zona Leste"
          {...register('region')}
        />
        <Controller
          name="zipCode"
          control={control}
          rules={{
            validate: (v) =>
              !v ||
              v.replace(/\D/g, '').length === 8 ||
              'CEP deve ter 8 dígitos',
          }}
          render={({ field }) => (
            <CepInput label="CEP" error={errors.zipCode?.message} {...field} />
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Cidade *"
          error={errors.city?.message}
          {...register('city', { required: 'Cidade obrigatória' })}
        />
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub">
            Estado *
          </p>
          <Controller
            name="state"
            control={control}
            rules={{ required: 'Estado obrigatório' }}
            render={({ field }) => (
              <FormSelect error={errors.state?.message} {...field}>
                <option value="">Selecione...</option>
                {BRAZILIAN_STATES.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </FormSelect>
            )}
          />
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <label className="flex items-center gap-2 text-[13px] font-semibold text-text">
          <input
            type="checkbox"
            {...register('hasCondominium')}
            className="h-4 w-4 rounded border-border accent-orange"
          />
          Pertence a um condomínio?
        </label>
        {hasCondominium && (
          <div className="mt-3 grid grid-cols-2 gap-4">
            <FormInput
              label="Nome do condomínio"
              {...register('condominiumName')}
            />
            <Controller
              name="condominiumFee"
              control={control}
              render={({ field }) => (
                <MoneyInput
                  label="Taxa de condomínio"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            <FormInput
              label="Bloco"
              placeholder="Ex: Bloco B"
              {...register('block')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
