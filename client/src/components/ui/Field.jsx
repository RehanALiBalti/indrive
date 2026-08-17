import { useId, useState } from 'react';
import Icon from './Icon.jsx';

const FieldShell = ({ id, label, error, hint, required, optional, children, className = '' }) => (
  <div className={`field ${error ? 'field--invalid' : ''} ${className}`.trim()}>
    {label ? (
      <label className="field__label" htmlFor={id}>
        {label}
        {required ? (
          <span className="field__required" aria-hidden="true">
            *
          </span>
        ) : null}
        {optional ? <span className="field__optional">(optional)</span> : null}
      </label>
    ) : null}
    {children}
    {error ? (
      <span className="field__error" id={`${id}-error`} role="alert">
        <Icon name="alert" size={15} />
        {error}
      </span>
    ) : null}
    {hint && !error ? (
      <span className="field__hint" id={`${id}-hint`}>
        {hint}
      </span>
    ) : null}
  </div>
);

const describedBy = (id, error, hint) =>
  [error ? `${id}-error` : null, hint && !error ? `${id}-hint` : null].filter(Boolean).join(' ') ||
  undefined;

export const Input = ({
  label,
  error,
  hint,
  required,
  optional,
  className,
  id: providedId,
  type = 'text',
  ...rest
}) => {
  const generatedId = useId();
  const id = providedId || `${rest.name || 'input'}-${generatedId}`;
  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      optional={optional}
      className={className}
    >
      <input
        id={id}
        type={type}
        className="input"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy(id, error, hint)}
        aria-required={required || undefined}
        {...rest}
      />
    </FieldShell>
  );
};

export const PasswordInput = ({ label, error, hint, required, id: providedId, ...rest }) => {
  const generatedId = useId();
  const id = providedId || `${rest.name || 'password'}-${generatedId}`;
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <div className="field__affix">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className="input"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy(id, error, hint)}
          aria-required={required || undefined}
          {...rest}
        />
        <button
          type="button"
          className="field__affix-btn"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </FieldShell>
  );
};

export const Textarea = ({
  label,
  error,
  hint,
  required,
  optional,
  className,
  rows = 5,
  id: providedId,
  ...rest
}) => {
  const generatedId = useId();
  const id = providedId || `${rest.name || 'textarea'}-${generatedId}`;
  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      optional={optional}
      className={className}
    >
      <textarea
        id={id}
        rows={rows}
        className="textarea"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy(id, error, hint)}
        aria-required={required || undefined}
        {...rest}
      />
    </FieldShell>
  );
};

export const Select = ({
  label,
  error,
  hint,
  required,
  optional,
  className,
  options = [],
  placeholder,
  children,
  id: providedId,
  ...rest
}) => {
  const generatedId = useId();
  const id = providedId || `${rest.name || 'select'}-${generatedId}`;
  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      optional={optional}
      className={className}
    >
      <select
        id={id}
        className="select"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy(id, error, hint)}
        aria-required={required || undefined}
        {...rest}
      >
        {placeholder ? (
          <option value="" disabled={required}>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) =>
          typeof option === 'string' ? (
            <option key={option} value={option}>
              {option}
            </option>
          ) : (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ),
        )}
        {children}
      </select>
    </FieldShell>
  );
};

/** Native date input with a sensible minimum so past dates cannot be chosen. */
export const DateInput = ({ min, ...rest }) => {
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`;
  return <Input type="date" min={min ?? iso} {...rest} />;
};

export const TimeInput = (props) => <Input type="time" step="300" {...props} />;

export const NumberInput = ({ min = 0, max = 99, ...rest }) => (
  <Input type="number" inputMode="numeric" min={min} max={max} {...rest} />
);

export const Checkbox = ({ label, error, name, checked, onChange, onBlur, id: providedId, ...rest }) => {
  const generatedId = useId();
  const id = providedId || `${name}-${generatedId}`;
  return (
    <div className="field">
      <label className={`check ${error ? 'check--invalid' : ''}`.trim()} htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          name={name}
          checked={Boolean(checked)}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        />
        <span>{label}</span>
      </label>
      {error ? (
        <span className="field__error" id={`${id}-error`} role="alert">
          <Icon name="alert" size={15} />
          {error}
        </span>
      ) : null}
    </div>
  );
};

export const RadioGroup = ({ label, name, value, options = [], onChange, error, hint }) => {
  const id = useId();
  return (
    <fieldset className={`field ${error ? 'field--invalid' : ''}`.trim()} style={{ border: 0, padding: 0 }}>
      {label ? <legend className="field__label">{label}</legend> : null}
      <div className="chip-row" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <label key={option.value} className="check" htmlFor={`${id}-${option.value}`}>
            <input
              id={`${id}-${option.value}`}
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={onChange}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {error ? (
        <span className="field__error" role="alert">
          <Icon name="alert" size={15} />
          {error}
        </span>
      ) : null}
      {hint && !error ? <span className="field__hint">{hint}</span> : null}
    </fieldset>
  );
};

/** Hidden honeypot input. Bots fill it in; real users never see it. */
export const Honeypot = ({ value = '', onChange }) => {
  const id = useId();
  return (
    <div className="hp-field" aria-hidden="true">
      <label htmlFor={`company-website-${id}`}>Leave this field empty</label>
      <input
        id={`company-website-${id}`}
        name="_hp"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default Input;
