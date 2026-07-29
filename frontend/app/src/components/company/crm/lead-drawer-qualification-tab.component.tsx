import { Controller, useFormContext, useWatch } from 'react-hook-form';

import type { FormValues } from './lead-drawer.component';

import { FormInput } from '@/components/ui/form-input.component';
import { FormSelect } from '@/components/ui/form-select.component';
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  TEMPERATURES,
  TEMPERATURE_LABELS,
} from '@/models/lead.model';

export function LeadQualificationTab() {
  const { register, control } = useFormContext<FormValues>();

  const decidesAlone = useWatch({ control, name: 'decidesAlone' });

  return (
    <div className="space-y-4">
      <Controller
        name="paymentMethod"
        control={control}
        render={({ field }) => (
          <FormSelect label="Forma de pagamento" {...field}>
            <option value="">Selecione...</option>
            {PAYMENT_METHODS.map((p) => (
              <option key={p} value={p}>
                {PAYMENT_METHOD_LABELS[p]}
              </option>
            ))}
          </FormSelect>
        )}
      />

      <label className="flex items-center gap-2 text-[13px] text-text">
        <input
          type="checkbox"
          {...register('hasApprovedOrSimulatedCredit')}
          className="h-4 w-4 rounded border-border accent-orange"
        />
        Tem crédito aprovado ou simulado?
      </label>

      <label className="flex items-center gap-2 text-[13px] text-text">
        <input
          type="checkbox"
          {...register('decidesAlone')}
          className="h-4 w-4 rounded border-border accent-orange"
        />
        Decide sozinho?
      </label>
      {!decidesAlone && (
        <FormInput label="Decide com quem?" {...register('decidesWith')} />
      )}

      <label className="flex items-center gap-2 text-[13px] text-text">
        <input
          type="checkbox"
          {...register('consultedOtherRealtor')}
          className="h-4 w-4 rounded border-border accent-orange"
        />
        Já consultou outro corretor?
      </label>

      <Controller
        name="temperature"
        control={control}
        render={({ field }) => (
          <FormSelect label="Temperatura" {...field}>
            <option value="">Selecione...</option>
            {TEMPERATURES.map((t) => (
              <option key={t} value={t}>
                {TEMPERATURE_LABELS[t]}
              </option>
            ))}
          </FormSelect>
        )}
      />
    </div>
  );
}
