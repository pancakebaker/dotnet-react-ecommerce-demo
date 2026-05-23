type CustomerInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  pattern?: string;
  inputMode?: 'email' | 'tel' | 'text';
  autoComplete?: string;
  title?: string;
  error?: string;
  hint?: string;
};

export function CustomerInput({
  label,
  value,
  onChange,
  required = false,
  type = 'text',
  placeholder,
  maxLength,
  pattern,
  inputMode,
  autoComplete,
  title,
  error,
  hint
}: CustomerInputProps) {
  const messageId = `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-message`;

  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        pattern={pattern}
        inputMode={inputMode}
        autoComplete={autoComplete}
        title={title}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? messageId : undefined}
        onChange={event => onChange(event.target.value)}
      />
      {error && <span id={messageId} className="mt-1 block text-xs font-medium text-rose-700">{error}</span>}
      {!error && hint && <span id={messageId} className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}
