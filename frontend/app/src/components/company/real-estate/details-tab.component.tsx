import { Controller, useFormContext, useWatch } from 'react-hook-form';

import type { FormValues } from './form.component';

import { FormInput } from '@/components/ui/form-input.component';
import { FormSelect } from '@/components/ui/form-select.component';
import { MoneyInput } from '@/components/ui/money-input.component';
import {
  FURNISHINGS_LABELS,
  FURNISHINGS_OPTIONS,
  REAL_ESTATE_CONDITION_LABELS,
  REAL_ESTATE_CONDITIONS,
} from '@/models/real-estate.model';

export function RealEstateDetailsTab() {
  const { register, control } = useFormContext<FormValues>();

  const purposes = useWatch({ control, name: 'purposes' });
  const showSalePrice = purposes.includes('venda');
  const showRentPrice = purposes.includes('locacao');

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-text-sub">
        Características
      </p>

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Área útil (m²)"
          type="number"
          {...register('usableAreaM2')}
        />
        <FormInput
          label="Área total (m²)"
          type="number"
          {...register('totalAreaM2')}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormInput label="Quartos" type="number" {...register('bedrooms')} />
        <FormInput label="Suítes" type="number" {...register('suites')} />
        <FormInput label="Banheiros" type="number" {...register('bathrooms')} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormInput label="Vagas" type="number" {...register('parkingSpots')} />
        <FormInput label="Andar" type="number" {...register('floor')} />
        <FormInput
          label="Andares do prédio"
          type="number"
          {...register('buildingFloors')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub">
            Situação
          </p>
          <Controller
            name="condition"
            control={control}
            render={({ field }) => (
              <FormSelect {...field}>
                <option value="">Não informado</option>
                {REAL_ESTATE_CONDITIONS.map((value) => (
                  <option key={value} value={value}>
                    {REAL_ESTATE_CONDITION_LABELS[value]}
                  </option>
                ))}
              </FormSelect>
            )}
          />
        </div>
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub">
            Mobiliado
          </p>
          <Controller
            name="furnishings"
            control={control}
            render={({ field }) => (
              <FormSelect {...field}>
                {FURNISHINGS_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {FURNISHINGS_LABELS[value]}
                  </option>
                ))}
              </FormSelect>
            )}
          />
        </div>
      </div>

      <p className="border-t border-border pt-4 text-[11px] font-bold uppercase tracking-[0.5px] text-text-sub">
        Valores
      </p>

      <div className="grid grid-cols-2 gap-4">
        {showSalePrice && (
          <Controller
            name="salePrice"
            control={control}
            render={({ field }) => (
              <MoneyInput
                label="Preço de venda"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        )}
        {showRentPrice && (
          <Controller
            name="rentPrice"
            control={control}
            render={({ field }) => (
              <MoneyInput
                label="Preço de locação"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        )}
        <Controller
          name="iptuValue"
          control={control}
          render={({ field }) => (
            <MoneyInput
              label="IPTU"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-[13px] text-text">
          <input
            type="checkbox"
            {...register('acceptsFinancing')}
            className="h-4 w-4 rounded border-border accent-orange"
          />
          Aceita financiamento
        </label>
        <label className="flex items-center gap-2 text-[13px] text-text">
          <input
            type="checkbox"
            {...register('acceptsExchange')}
            className="h-4 w-4 rounded border-border accent-orange"
          />
          Aceita permuta
        </label>
        <label className="flex items-center gap-2 text-[13px] text-text">
          <input
            type="checkbox"
            {...register('negotiable')}
            className="h-4 w-4 rounded border-border accent-orange"
          />
          Valor negociável
        </label>
      </div>
    </div>
  );
}
