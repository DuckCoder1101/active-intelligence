import { IMaskInput } from 'react-imask';

import { FormInput } from './form-input.component';

interface CnpjInputProps {
  label: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  name?: string;
}

export function CnpjInput({ value, onChange, ...rest }: CnpjInputProps) {
  return (
    <FormInput
      as={IMaskInput}
      mask="00.000.000/0000-00"
      type="tel"
      placeholder="00.000.000/0000-00"
      value={value}
      onAccept={(v: string) => onChange(v)}
      {...rest}
    />
  );
}
