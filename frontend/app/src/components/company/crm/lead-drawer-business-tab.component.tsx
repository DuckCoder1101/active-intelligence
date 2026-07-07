import { useFormContext, useWatch } from 'react-hook-form';

import type { FormValues } from './lead-drawer.component';

import { FormInput } from '@/components/ui/form-input.component';
import { FormSelect } from '@/components/ui/form-select.component';
import {
  BUSINESS_TYPES,
  BUSINESS_TYPE_LABELS,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  PURPOSES,
  PURPOSE_LABELS,
} from '@/models/lead.model';

export function LeadBusinessTab() {
  const { register, control } = useFormContext<FormValues>();

  const businessType = useWatch({ control, name: 'businessType' });
  const propertyType = useWatch({ control, name: 'propertyType' });

  return (
    <div className="space-y-4">
      <FormSelect label="Tipo do negócio *" {...register('businessType')}>
        {BUSINESS_TYPES.map((t) => (
          <option key={t} value={t}>
            {BUSINESS_TYPE_LABELS[t]}
          </option>
        ))}
      </FormSelect>
      {businessType === 'outro' && (
        <FormInput
          label="Especifique o tipo de negócio"
          {...register('businessTypeOther')}
        />
      )}

      <FormSelect label="Tipo do imóvel" {...register('propertyType')}>
        <option value="">Selecione...</option>
        {PROPERTY_TYPES.map((t) => (
          <option key={t} value={t}>
            {PROPERTY_TYPE_LABELS[t]}
          </option>
        ))}
      </FormSelect>
      {propertyType === 'outro' && (
        <FormInput
          label="Especifique o tipo de imóvel"
          {...register('propertyTypeOther')}
        />
      )}

      <FormSelect label="Finalidade" {...register('purpose')}>
        <option value="">Selecione...</option>
        {PURPOSES.map((p) => (
          <option key={p} value={p}>
            {PURPOSE_LABELS[p]}
          </option>
        ))}
      </FormSelect>
    </div>
  );
}
