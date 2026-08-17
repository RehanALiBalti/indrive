import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const ICONS = {
  success: (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M7.6 13.4 4.2 10l-1.2 1.2 4.6 4.6L17.4 6 16.2 4.8z" fill="currentColor" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 1.7 1 17.3h18L10 1.7Zm0 5.3a.9.9 0 0 1 .9.9v3.6a.9.9 0 1 1-1.8 0V7.9a.9.9 0 0 1 .9-.9Zm0 8.4a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2Z"
        fill="currentColor"
      />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 1a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm.9 13.5h-1.8V9h1.8v5.5Zm0-7.2h-1.8V5.5h1.8v1.8Z"
        fill="currentColor"
      />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 1a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm.9 13.5h-1.8v-1.8h1.8v1.8Zm0-3.6h-1.8V5.5h1.8v5.4Z"
        fill="currentColor"
      />
    </svg>
  ),
};

let nextId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, { variant = 'info', title, duration = 5500, action } = {}) => {
      nextId += 1;
      const id = nextId;
      setToasts((current) => [...current.slice(-3), { id, message, variant, title, action }]);
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const store = timers.current;
    return () => {
      store.forEach((timer) => clearTimeout(timer));
      store.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      toast: push,
      success: (message, options) => push(message, { ...options, variant: 'success' }),
      error: (message, options) => push(message, { ...options, variant: 'error', duration: 8000 }),
      info: (message, options) => push(message, { ...options, variant: 'info' }),
      warning: (message, options) => push(message, { ...options, variant: 'warning' }),
      dismiss,
    }),
    [dismiss, push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="region" aria-label="Notifications">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`toast toast--${item.variant}`}
            role={item.variant === 'error' ? 'alert' : 'status'}
            aria-live={item.variant === 'error' ? 'assertive' : 'polite'}
          >
            <span className="toast__icon">{ICONS[item.variant]}</span>
            <div className="toast__body">
              {item.title ? <strong className="toast__title">{item.title}</strong> : null}
              <span className="toast__message">{item.message}</span>
              {item.action ? (
                <button type="button" className="toast__action" onClick={item.action.onClick}>
                  {item.action.label}
                </button>
              ) : null}
            </div>
            <button
              type="button"
              className="toast__close"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path
                  d="M15.3 5.9 14.1 4.7 10 8.8 5.9 4.7 4.7 5.9 8.8 10l-4.1 4.1 1.2 1.2L10 11.2l4.1 4.1 1.2-1.2L11.2 10z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>.');
  return context;
};

export default ToastContext;
