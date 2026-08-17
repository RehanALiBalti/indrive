import { Link } from 'react-router-dom';
import Icon from '../../components/ui/Icon.jsx';
import { Badge, Pagination } from '../../components/ui/Misc.jsx';
import { AsyncContent, SkeletonRows } from '../../components/ui/States.jsx';
import { formatDateTime } from '../../lib/format.js';

export const StatusBadge = ({ status }) => {
  const map = {
    published: { variant: 'success', label: 'Published' },
    draft: { variant: 'warning', label: 'Draft' },
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'default', label: 'Inactive' },
    disabled: { variant: 'danger', label: 'Disabled' },
    new: { variant: 'info', label: 'New' },
    in_progress: { variant: 'warning', label: 'In progress' },
    resolved: { variant: 'success', label: 'Resolved' },
    archived: { variant: 'default', label: 'Archived' },
    spam: { variant: 'danger', label: 'Spam' },
    subscribed: { variant: 'success', label: 'Subscribed' },
    unsubscribed: { variant: 'default', label: 'Unsubscribed' },
  };
  const config = map[status] || { variant: 'default', label: status || '—' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const dateTime = (value) => formatDateTime(value) || '—';

/**
 * Responsive admin list.
 *
 * Renders a real table on tablet and desktop and a stacked card list on phones
 * — CMS screens have to be usable on a phone, and a horizontally scrolling
 * table is not.
 */
const AdminTable = ({
  state,
  columns,
  rowKey = (row) => row.id,
  actions,
  onPageChange,
  emptyTitle = 'Nothing here yet',
  emptyText = 'Create your first record to get started.',
  emptyAction,
  sort,
  onSortChange,
}) => (
  <>
    <AsyncContent
      state={state}
      skeleton={
        <div style={{ padding: 'var(--space-5)' }}>
          <SkeletonRows rows={6} />
        </div>
      }
      emptyTitle={emptyTitle}
      emptyText={emptyText}
      emptyAction={emptyAction}
    >
      {(rows) => (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} style={column.width ? { width: column.width } : undefined}>
                      {column.sortable && onSortChange ? (
                        <button type="button" onClick={() => onSortChange(column.sortKey || column.key)}>
                          {column.label}
                          {sort?.by === (column.sortKey || column.key) ? (
                            <Icon name={sort.dir === 'asc' ? 'chevronDown' : 'chevronDown'} size={13} />
                          ) : null}
                        </button>
                      ) : (
                        column.label
                      )}
                    </th>
                  ))}
                  {actions ? <th aria-label="Actions" /> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={rowKey(row)}>
                    {columns.map((column) => (
                      <td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? '—'}</td>
                    ))}
                    {actions ? (
                      <td>
                        <div className="admin-table__actions">{actions(row)}</div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-cards">
            {rows.map((row) => (
              <div className="admin-card" key={`card-${rowKey(row)}`}>
                {columns.map((column) => (
                  <div className="admin-card__row" key={column.key}>
                    <span style={{ color: 'var(--slate-500)' }}>{column.label}</span>
                    <span style={{ textAlign: 'right', minWidth: 0 }}>
                      {column.render ? column.render(row) : row[column.key] ?? '—'}
                    </span>
                  </div>
                ))}
                {actions ? <div className="admin-table__actions">{actions(row)}</div> : null}
              </div>
            ))}
          </div>
        </>
      )}
    </AsyncContent>

    {state.meta && onPageChange ? (
      <div style={{ padding: 'var(--space-4) var(--space-5)' }}>
        <Pagination meta={state.meta} onChange={onPageChange} />
      </div>
    ) : null}
  </>
);

export const IconButton = ({ icon, label, onClick, to, href, danger = false, disabled = false }) => {
  const className = `icon-btn ${danger ? 'icon-btn--danger' : ''}`.trim();
  const content = <Icon name={icon} size={17} />;

  if (to) {
    return (
      <Link className={className} to={to} title={label} aria-label={label}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a className={className} href={href} title={label} aria-label={label} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }
  return (
    <button type="button" className={className} onClick={onClick} title={label} aria-label={label} disabled={disabled}>
      {content}
    </button>
  );
};

export default AdminTable;
