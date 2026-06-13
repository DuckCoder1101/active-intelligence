import { forwardRef, useState } from 'react';
import { MdOutlineVisibility, MdOutlineVisibilityOff } from 'react-icons/md';

import { FormInput } from '@components/form-input.component';

interface PasswordInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label: string;
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <FormInput
        ref={ref}
        type={visible ? 'text' : 'password'}
        rightSlot={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="text-text-muted transition-colors hover:text-text-sub"
            tabIndex={-1}
            aria-label={visible ? 'Esconder senha' : 'Mostrar senha'}
          >
            {visible ? (
              <MdOutlineVisibility size={18} />
            ) : (
              <MdOutlineVisibilityOff size={18} />
            )}
          </button>
        }
        {...props}
      />
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
