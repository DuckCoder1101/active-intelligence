import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { MdAdd, MdDelete } from 'react-icons/md';

import { MAX_PRICE, type FormValues } from './lead-drawer.component';

import { FormInput } from '@/components/ui/form-input.component';
import { formatCurrency } from '@/formatters/formatCurrency';
import {
  LEAD_PREFERENCE_GROUPS,
  LEAD_PREFERENCE_LABELS,
} from '@/models/lead.model';

export function LeadProfileTab() {
  const {
    register,
    control,
    setValue,
    clearErrors,
    formState: { errors },
  } = useFormContext<FormValues>();

  const {
    fields: neighborhoodFields,
    append: appendNeighborhood,
    remove: removeNeighborhood,
  } = useFieldArray({ control, name: 'neighborhoods' });

  const priceMin = useWatch({ control, name: 'priceMin' });
  const priceMax = useWatch({ control, name: 'priceMax' });

  const setPriceMin = (value: number) => {
    setValue('priceMin', value);
    clearErrors('priceMax');
  };

  const setPriceMax = (value: number) => {
    setValue('priceMax', value);
    clearErrors('priceMax');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Cidade" {...register('city')} />
        <FormInput label="Estado" {...register('state')} />
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub">
          Bairros
        </p>
        <div className="space-y-2">
          {neighborhoodFields.map((field, i) => (
            <div key={field.id} className="flex items-center gap-2">
              <input
                {...register(`neighborhoods.${i}.value` as const)}
                placeholder="Nome do bairro"
                className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-text outline-none focus:border-orange"
              />
              {i === neighborhoodFields.length - 1 ? (
                <button
                  type="button"
                  onClick={() => appendNeighborhood({ value: '' })}
                  title="Adicionar bairro"
                  className="shrink-0 rounded-md border border-border p-2 text-text-sub transition-colors hover:border-orange hover:text-orange disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <MdAdd size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => removeNeighborhood(i)}
                  title="Remover bairro"
                  className="shrink-0 rounded-md border border-border p-2 text-text-sub transition-colors hover:border-danger hover:text-danger"
                >
                  <MdDelete size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-[13px] text-text">
        <input
          type="checkbox"
          {...register('acceptsNearbyNeighborhoods')}
          className="h-4 w-4 rounded border-border accent-orange"
        />
        Aceita bairros próximos?
      </label>

      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub">
          Faixa de valores
        </p>
        <div className="mb-2 flex items-center justify-between text-[12px] text-text-sub">
          <span>{formatCurrency(priceMin)}</span>
          <span>{formatCurrency(priceMax)}</span>
        </div>
        <div className="relative h-6">
          <input
            type="range"
            min={0}
            max={MAX_PRICE}
            step={10_000}
            value={priceMin}
            onChange={(e) =>
              setPriceMin(Math.min(Number(e.target.value), priceMax))
            }
            className="pointer-events-auto absolute inset-x-0 top-1/2 h-1 w-full -translate-y-1/2 appearance-none bg-transparent accent-orange"
          />
          <input
            type="range"
            min={0}
            max={MAX_PRICE}
            step={10_000}
            value={priceMax}
            onChange={(e) =>
              setPriceMax(Math.max(Number(e.target.value), priceMin))
            }
            className="pointer-events-auto absolute inset-x-0 top-1/2 h-1 w-full -translate-y-1/2 appearance-none bg-transparent accent-orange"
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <FormInput
            label="Valor mínimo"
            type="number"
            value={priceMin}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPriceMin(Number(e.target.value) || 0)
            }
          />
          <FormInput
            label="Valor máximo"
            type="number"
            value={priceMax}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPriceMax(Number(e.target.value) || 0)
            }
            error={errors.priceMax?.message}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Tamanho do imóvel (m²)"
          type="number"
          {...register('propertySizeM2')}
        />
        <FormInput label="Andar" type="number" {...register('floor')} />
        <FormInput label="Quartos" type="number" {...register('bedrooms')} />
        <FormInput label="Suítes" type="number" {...register('suites')} />
        <FormInput label="Vagas" type="number" {...register('parkingSpots')} />
      </div>

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub">
          Preferências e diferenciais
        </p>
        <Controller
          name="preferences"
          control={control}
          render={({ field }) => (
            <div className="space-y-4">
              {LEAD_PREFERENCE_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="mb-1.5 text-[11px] font-semibold text-text-sub">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {group.preferences.map((pref) => (
                      <label
                        key={pref}
                        className="flex items-center gap-2 text-[12px] text-text"
                      >
                        <input
                          type="checkbox"
                          checked={field.value.includes(pref)}
                          onChange={() =>
                            field.onChange(
                              field.value.includes(pref)
                                ? field.value.filter((p) => p !== pref)
                                : [...field.value, pref],
                            )
                          }
                          className="h-3.5 w-3.5 shrink-0 rounded border-border accent-orange"
                        />
                        <span className="truncate">
                          {LEAD_PREFERENCE_LABELS[pref]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        />
      </div>
    </div>
  );
}
