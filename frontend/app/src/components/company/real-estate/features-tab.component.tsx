import { Controller, useFormContext } from 'react-hook-form';

import type { FormValues } from './form.component';

import {
  PROPERTY_FEATURE_GROUPS,
  PROPERTY_FEATURE_LABELS,
} from '@/models/real-estate.model';

export function RealEstateFeaturesTab() {
  const { control } = useFormContext<FormValues>();

  return (
    <Controller
      name="features"
      control={control}
      render={({ field }) => (
        <div className="space-y-4">
          {PROPERTY_FEATURE_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 text-[11px] font-semibold text-text-sub">
                {group.label}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {group.features.map((feature) => (
                  <label
                    key={feature}
                    className="flex items-center gap-2 text-[12px] text-text"
                  >
                    <input
                      type="checkbox"
                      checked={field.value.includes(feature)}
                      onChange={() =>
                        field.onChange(
                          field.value.includes(feature)
                            ? field.value.filter((f) => f !== feature)
                            : [...field.value, feature],
                        )
                      }
                      className="h-3.5 w-3.5 shrink-0 rounded border-border accent-orange"
                    />
                    <span className="truncate">
                      {PROPERTY_FEATURE_LABELS[feature]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    />
  );
}
