import { useCallback, useMemo, useRef, useState } from 'react';

/* ------------------------------- validators ------------------------------- */

export const validators = {
  required:
    (message = 'This field is required.') =>
    (value) => {
      if (value === undefined || value === null) return message;
      if (typeof value === 'string' && value.trim() === '') return message;
      if (Array.isArray(value) && value.length === 0) return message;
      if (typeof value === 'boolean' && value === false) return message;
      return null;
    },
  minLength: (length, message) => (value) =>
    value && String(value).trim().length < length
      ? message || `Please enter at least ${length} characters.`
      : null,
  maxLength: (length, message) => (value) =>
    value && String(value).length > length
      ? message || `Please use ${length} characters or fewer.`
      : null,
  email:
    (message = 'Please enter a valid email address.') =>
    (value) =>
      value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim()) ? message : null,
  phone:
    (message = 'Please enter a valid phone number.') =>
    (value) => {
      if (!value) return null;
      const digits = String(value).replace(/[^\d]/g, '');
      if (digits.length < 7 || digits.length > 15) return message;
      return /^[+()\-\s\d.]+$/.test(String(value)) ? null : message;
    },
  min: (minimum, message) => (value) =>
    value !== '' && Number(value) < minimum ? message || `Must be at least ${minimum}.` : null,
  max: (maximum, message) => (value) =>
    value !== '' && Number(value) > maximum ? message || `Must be ${maximum} or fewer.` : null,
  url:
    (message = 'Enter a valid URL or a path starting with /.') =>
    (value) => {
      if (!value) return null;
      const text = String(value).trim();
      if (text.startsWith('/') || text.startsWith('#')) return null;
      if (/^(mailto|tel):/i.test(text)) return null;
      try {
        // eslint-disable-next-line no-new
        new URL(text);
        return null;
      } catch {
        return message;
      }
    },
  futureDate:
    (message = 'Please choose a date in the future.') =>
    (value) => {
      if (!value) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const chosen = new Date(`${value}T00:00:00`);
      return chosen < today ? message : null;
    },
  matches: (getOther, message) => (value, values) =>
    value !== getOther(values) ? message : null,
  strongPassword: () => (value) => {
    if (!value) return null;
    if (value.length < 8) return 'Passwords must be at least 8 characters.';
    if (!/[a-z]/.test(value)) return 'Include at least one lowercase letter.';
    if (!/[A-Z]/.test(value)) return 'Include at least one uppercase letter.';
    if (!/\d/.test(value)) return 'Include at least one number.';
    return null;
  },
};

export const runRules = (value, rules = [], values = {}) => {
  for (const rule of rules) {
    const message = rule(value, values);
    if (message) return message;
  }
  return null;
};

/* --------------------------------- hook ---------------------------------- */

/**
 * Lightweight form state with per-field validation, touched tracking and
 * submit handling. Server-side field errors can be merged in after a failed
 * request so the user sees them on the correct inputs.
 */
export const useForm = ({ initialValues = {}, rules = {}, onSubmit }) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Timestamp used by the server's bot heuristics (submitted-too-fast check).
  const renderedAt = useRef(Date.now());

  const validateField = useCallback(
    (name, value, allValues) => runRules(value, rules[name] || [], allValues || values),
    [rules, values],
  );

  const validateAll = useCallback(
    (allValues) => {
      const nextErrors = {};
      for (const name of Object.keys(rules)) {
        const message = runRules(allValues[name], rules[name], allValues);
        if (message) nextErrors[name] = message;
      }
      return nextErrors;
    },
    [rules],
  );

  const setValue = useCallback(
    (name, value) => {
      setValues((previous) => {
        const next = { ...previous, [name]: value };
        setErrors((currentErrors) => {
          if (!currentErrors[name]) return currentErrors;
          const message = runRules(value, rules[name] || [], next);
          const updated = { ...currentErrors };
          if (message) updated[name] = message;
          else delete updated[name];
          return updated;
        });
        return next;
      });
      setSubmitError(null);
    },
    [rules],
  );

  const setManyValues = useCallback((patch) => {
    setValues((previous) => ({ ...previous, ...patch }));
  }, []);

  const handleChange = useCallback(
    (event) => {
      const { name, type, value, checked } = event.target;
      setValue(name, type === 'checkbox' ? checked : value);
    },
    [setValue],
  );

  const handleBlur = useCallback(
    (event) => {
      const { name } = event.target;
      setTouched((previous) => ({ ...previous, [name]: true }));
      const message = validateField(name, values[name], values);
      setErrors((previous) => {
        const updated = { ...previous };
        if (message) updated[name] = message;
        else delete updated[name];
        return updated;
      });
    },
    [validateField, values],
  );

  const reset = useCallback(
    (nextValues = initialValues) => {
      setValues(nextValues);
      setErrors({});
      setTouched({});
      setSubmitError(null);
      setSubmitted(false);
      renderedAt.current = Date.now();
    },
    [initialValues],
  );

  const handleSubmit = useCallback(
    async (event) => {
      event?.preventDefault?.();
      setSubmitError(null);

      const nextErrors = validateAll(values);
      setErrors(nextErrors);
      setTouched(Object.fromEntries(Object.keys(rules).map((key) => [key, true])));

      if (Object.keys(nextErrors).length > 0) {
        // Move focus to the first invalid field for keyboard and screen-reader users.
        const firstField = Object.keys(nextErrors)[0];
        const element = document.querySelector(`[name="${CSS.escape(firstField)}"]`);
        element?.focus?.();
        element?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
        return false;
      }

      setSubmitting(true);
      try {
        // `_hp` is forwarded as-is: only a bot ever fills the hidden honeypot,
        // and the server rejects the submission when it arrives non-empty.
        await onSubmit({ ...values, _hp: values._hp || '', _ts: renderedAt.current }, { reset });
        setSubmitted(true);
        return true;
      } catch (error) {
        const fieldErrors = error?.fieldErrors || {};
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          const firstField = Object.keys(fieldErrors)[0];
          document.querySelector(`[name="${CSS.escape(firstField)}"]`)?.focus?.();
        }
        setSubmitError(error?.message || 'Something went wrong. Please try again.');
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [onSubmit, reset, rules, validateAll, values],
  );

  const fieldProps = useCallback(
    (name) => ({
      name,
      value: values[name] ?? '',
      onChange: handleChange,
      onBlur: handleBlur,
      error: touched[name] || submitted ? errors[name] : errors[name],
    }),
    [errors, handleBlur, handleChange, submitted, touched, values],
  );

  const checkboxProps = useCallback(
    (name) => ({
      name,
      checked: Boolean(values[name]),
      onChange: handleChange,
      onBlur: handleBlur,
      error: errors[name],
    }),
    [errors, handleBlur, handleChange, values],
  );

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  return {
    values,
    errors,
    touched,
    submitting,
    submitError,
    submitted,
    isValid,
    renderedAt: renderedAt.current,
    setValue,
    setManyValues,
    setErrors,
    handleChange,
    handleBlur,
    handleSubmit,
    fieldProps,
    checkboxProps,
    reset,
  };
};

export default useForm;
