import { Controller, useFormContext } from 'react-hook-form';

import type { FormValues } from './form.component';

import { FormInput } from '@/components/ui/form-input.component';
import { FormSelect } from '@/components/ui/form-select.component';
import {
  DOCUMENTATION_STATUS_LABELS,
  DOCUMENTATION_STATUSES,
} from '@/models/real-estate.model';

export function RealEstateDocumentationTab() {
  const { register, control } = useFormContext<FormValues>();

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-text-sub">
        Documentação
      </p>

      <div className="grid grid-cols-2 gap-4">
        <FormInput label="Matrícula" {...register('registryNumber')} />
        <FormInput label="Número do IPTU" {...register('iptuNumber')} />
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.5px] text-text-sub">
          Situação documental
        </p>
        <Controller
          name="documentationStatus"
          control={control}
          render={({ field }) => (
            <FormSelect {...field}>
              <option value="">Não informado</option>
              {DOCUMENTATION_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {DOCUMENTATION_STATUS_LABELS[value]}
                </option>
              ))}
            </FormSelect>
          )}
        />
      </div>

      <p className="border-t border-border pt-4 text-[11px] font-bold uppercase tracking-[0.5px] text-text-sub">
        Publicação
      </p>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-[13px] text-text">
          <input
            type="checkbox"
            {...register('visibleOnWebsite')}
            className="h-4 w-4 rounded border-border accent-orange"
          />
          Visível no site
        </label>
        <label className="flex items-center gap-2 text-[13px] text-text">
          <input
            type="checkbox"
            {...register('featured')}
            className="h-4 w-4 rounded border-border accent-orange"
          />
          Destaque
        </label>
      </div>

      <FormInput
        as="textarea"
        label="Descrição pública"
        rows={4}
        className="min-h-24 resize-none"
        {...register('publicDescription')}
      />
    </div>
  );
}
