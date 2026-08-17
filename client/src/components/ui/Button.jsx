import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

const isExternal = (href) =>
  typeof href === 'string' && (/^https?:\/\//i.test(href) || /^(mailto|tel):/i.test(href));

/**
 * One button component for the whole app. Renders a <button>, a react-router
 * <Link> or an <a> depending on the props, so navigation is never faked with
 * click handlers and links always work with middle-click and screen readers.
 */
const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      block = false,
      loading = false,
      disabled = false,
      icon,
      iconRight,
      to,
      href,
      type = 'button',
      className = '',
      ...rest
    },
    ref,
  ) => {
    const classes = [
      'btn',
      `btn--${variant}`,
      size !== 'md' ? `btn--${size}` : '',
      block ? 'btn--block' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const content = (
      <>
        {loading ? <span className="btn__spinner" aria-hidden="true" /> : null}
        {!loading && icon ? <Icon name={icon} size={size === 'sm' ? 15 : 18} /> : null}
        <span>{children}</span>
        {!loading && iconRight ? <Icon name={iconRight} size={size === 'sm' ? 15 : 18} /> : null}
      </>
    );

    if (to && !disabled && !loading) {
      // Hash-only links must not go through the router.
      if (to.startsWith('#')) {
        return (
          <a ref={ref} href={to} className={classes} {...rest}>
            {content}
          </a>
        );
      }
      return (
        <Link ref={ref} to={to} className={classes} {...rest}>
          {content}
        </Link>
      );
    }

    if (href && !disabled && !loading) {
      const external = isExternal(href);
      return (
        <a
          ref={ref}
          href={href}
          className={classes}
          {...(external && !/^(mailto|tel):/i.test(href)
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
          {...rest}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...rest}
      >
        {content}
      </button>
    );
  },
);

Button.displayName = 'Button';
export default Button;
