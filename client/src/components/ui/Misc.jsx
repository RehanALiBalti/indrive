import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

/* --------------------------------- Badge --------------------------------- */

export const Badge = ({ children, variant = 'default', icon }) => (
  <span className={`badge ${variant !== 'default' ? `badge--${variant}` : ''}`.trim()}>
    {icon ? <Icon name={icon} size={13} /> : null}
    {children}
  </span>
);

/* --------------------------------- Alert --------------------------------- */

const ALERT_ICON = { error: 'alert', success: 'check', warning: 'alert', info: 'globe' };

export const Alert = ({ variant = 'info', title, children }) => (
  <div className={`alert alert--${variant}`} role={variant === 'error' ? 'alert' : 'status'}>
    <span className="alert__icon">
      <Icon name={ALERT_ICON[variant] || 'globe'} />
    </span>
    <div>
      {title ? <strong>{title}</strong> : null}
      {children}
    </div>
  </div>
);

/* -------------------------------- Rating --------------------------------- */

export const Rating = ({ value = 5, max = 5 }) => (
  <span className="rating" role="img" aria-label={`${value} out of ${max} stars`}>
    {Array.from({ length: max }, (_, index) => (
      <Icon key={index} name="star" size={16} style={{ opacity: index < Math.round(value) ? 1 : 0.25 }} />
    ))}
  </span>
);

/* ------------------------------ Breadcrumbs ------------------------------ */

export const Breadcrumbs = ({ items = [], dark = false }) => {
  if (items.length < 2) return null;
  return (
    <nav className={`breadcrumbs ${dark ? 'breadcrumbs--dark' : ''}`.trim()} aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.href || item.label}>
              {isLast ? (
                <span aria-current="page">{item.label}</span>
              ) : (
                <>
                  <Link to={item.href}>{item.label}</Link>
                  <span className="breadcrumbs__sep" aria-hidden="true">
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

/* ------------------------------- Pagination ------------------------------ */

export const Pagination = ({ meta, onChange }) => {
  if (!meta || meta.totalPages <= 1) return null;
  const { page, totalPages, total, limit } = meta;

  const pages = [];
  const window = 1;
  for (let index = 1; index <= totalPages; index += 1) {
    if (index === 1 || index === totalPages || Math.abs(index - page) <= window) pages.push(index);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="pagination__btn"
        onClick={() => onChange(page - 1)}
        disabled={!meta.hasPrev}
        aria-label="Previous page"
      >
        <Icon name="chevronLeft" size={16} />
      </button>

      {pages.map((item, index) =>
        item === '…' ? (
          // eslint-disable-next-line react/no-array-index-key
          <span key={`gap-${index}`} className="pagination__info" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className="pagination__btn"
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className="pagination__btn"
        onClick={() => onChange(page + 1)}
        disabled={!meta.hasNext}
        aria-label="Next page"
      >
        <Icon name="chevronRight" size={16} />
      </button>

      <span className="pagination__info">
        {from}–{to} of {total}
      </span>
    </nav>
  );
};

/* ---------------------------------- Tabs --------------------------------- */

export const Tabs = ({ tabs = [], active, onChange, label = 'Sections' }) => (
  <div className="tabs" role="tablist" aria-label={label}>
    {tabs.map((tab) => (
      <button
        key={tab.value}
        type="button"
        role="tab"
        id={`tab-${tab.value}`}
        aria-selected={active === tab.value}
        aria-controls={`panel-${tab.value}`}
        className="tab"
        onClick={() => onChange(tab.value)}
      >
        {tab.icon ? <Icon name={tab.icon} size={16} /> : null}
        {tab.label}
      </button>
    ))}
  </div>
);

/* -------------------------------- Avatar --------------------------------- */

export const Avatar = ({ src, name = '', size = 44 }) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  if (src) {
    return (
      <img className="avatar" src={src} alt={name} width={size} height={size} loading="lazy" style={{ width: size, height: size }} />
    );
  }
  return (
    <span className="avatar" style={{ width: size, height: size }} aria-hidden="true">
      {initials || '·'}
    </span>
  );
};

export default Badge;
