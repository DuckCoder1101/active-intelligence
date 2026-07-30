import { IMaskInput } from 'react-imask';

import { FormInput } from './form-input.component';

interface CpfInputProps {
  label: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  name?: string;
}

export function CpfInput({ value, onChange, ...rest }: CpfInputProps) {
  return (
    <FormInput
      as={IMaskInput}
      mask="000.000.000-00"
      type="tel"
      placeholder="000.000.000-00"
      value={value}
      onAccept={(v: string) => onChange(v)}
      {...rest}
    />
  );
}
