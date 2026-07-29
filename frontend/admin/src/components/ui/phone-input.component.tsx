import { IMaskInput } from 'react-imask';

import { FormInput } from './form-input.component';

const PHONE_MASK = [{ mask: '(00) 0000-0000' }, { mask: '(00) 00000-0000' }];

interface PhoneInputProps {
  label: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  name?: string;
}

export function PhoneInput({ value, onChange, ...rest }: PhoneInputProps) {
  return (
    <FormInput
      as={IMaskInput}
      mask={PHONE_MASK}
      type="tel"
      placeholder="(00) 00000-0000"
      value={value}
      onAccept={(v: string) => onChange(v)}
      {...rest}
    />
  );
}
