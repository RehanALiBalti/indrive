import { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';
import Button from './Button.jsx';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal dialog: focus is trapped inside, Escape closes it, body
 * scrolling is locked and focus returns to the trigger on close.
 */
const Modal = ({ open, onClose, title, children, footer, wide = false, closeOnOverlay = true }) => {
  const dialogRef = useRef(null);
  const previousFocus = useRef(null);
  const titleId = useId();

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll(FOCUSABLE);
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return undefined;

    previousFocus.current = document.activeElement;
    document.body.classList.add('is-locked');

    const timer = setTimeout(() => {
      const focusable = dialogRef.current?.querySelectorAll(FOCUSABLE);
      (focusable?.[0] || dialogRef.current)?.focus();
    }, 20);

    return () => {
      clearTimeout(timer);
      document.body.classList.remove('is-locked');
      previousFocus.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (closeOnOverlay && event.target === event.currentTarget) onClose?.();
      }}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={`modal ${wide ? 'modal--wide' : ''}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
      >
        <div className="modal__header">
          {title ? (
            <h2 className="modal__title" id={titleId}>
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close dialog">
            <Icon name="close" />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer ? <div className="modal__footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
};

/** Destructive-action confirmation used across the admin CMS. */
export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  pending = false,
}) => (
  <Modal
    open={open}
    onClose={pending ? () => {} : onClose}
    title={title}
    footer={
      <>
        <Button variant="outline" onClick={onClose} disabled={pending}>
          {cancelLabel}
        </Button>
        <Button variant={variant} onClick={onConfirm} loading={pending}>
          {confirmLabel}
        </Button>
      </>
    }
  >
    <p style={{ color: 'var(--color-text-muted)', lineHeight: 'var(--leading-relaxed)' }}>
      {message || 'This action cannot be undone.'}
    </p>
  </Modal>
);

export default Modal;
