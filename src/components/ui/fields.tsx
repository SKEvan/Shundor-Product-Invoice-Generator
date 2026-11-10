import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';

const INPUT_CLASS =
  'w-full rounded-xl border-0 bg-white px-3 py-2.5 text-base text-gray-900 ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:outline-none sm:text-sm';

interface FieldWrapperProps {
  id: string;
  label: string;
  hint?: string;
  invalid?: boolean;
  className?: string;
  children: ReactNode;
}

function FieldWrapper({ id, label, hint, invalid, className = '', children }: FieldWrapperProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-gray-600">
        {label}
      </label>
      {children}
      {hint && <p className={`mt-1 text-xs ${invalid ? 'text-red-600' : 'text-gray-500'}`}>{hint}</p>}
    </div>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  invalid?: boolean;
}

export function TextField({ label, value, onChange, hint, invalid, className, ...props }: TextFieldProps) {
  const id = useId();
  return (
    <FieldWrapper id={id} label={label} hint={hint} invalid={invalid} className={className}>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${INPUT_CLASS} ${invalid ? 'ring-red-400' : ''}`}
        {...props}
      />
    </FieldWrapper>
  );
}

interface NumberFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  invalid?: boolean;
}

/** Shows an empty box instead of "0" so the owner can type straight away. */
export function NumberField({ label, value, onChange, hint, invalid, className, ...props }: NumberFieldProps) {
  const id = useId();
  return (
    <FieldWrapper id={id} label={label} hint={hint} invalid={invalid} className={className}>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        value={value === 0 ? '' : value}
        placeholder="0"
        onChange={(event) => onChange(event.target.value === '' ? 0 : Math.max(0, Number(event.target.value)))}
        onFocus={(event) => event.target.select()}
        className={`${INPUT_CLASS} ${invalid ? 'ring-red-400' : ''}`}
        {...props}
      />
    </FieldWrapper>
  );
}

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}

export function TextAreaField({ label, value, onChange, hint, className, ...props }: TextAreaFieldProps) {
  const id = useId();
  return (
    <FieldWrapper id={id} label={label} hint={hint} className={className}>
      <textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} className={INPUT_CLASS} {...props} />
    </FieldWrapper>
  );
}
