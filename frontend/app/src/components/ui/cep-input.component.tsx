import { IMaskInput } from 'react-imask';

import { FormInput } from './form-input.component';

interface CepInputProps {
  label: string;
  error?: string;
  value: string | undefined;
  onChange: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  name?: string;
}

export function CepInput({ value, onChange, ...rest }: CepInputProps) {
  return (
    <FormInput
      as={IMaskInput}
      mask="00000-000"
      type="tel"
      placeholder="00000-000"
      value={value ?? ''}
      onAccept={(v: string) => onChange(v)}
      {...rest}
    />
  );
}
