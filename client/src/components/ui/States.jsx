import Icon from './Icon.jsx';
import Button from './Button.jsx';

/** Inline spinner with an accessible label. */
export const Loading = ({ label = 'Loading…', compact = false }) => (
  <div className={compact ? 'state-block state-block--plain' : 'state-block'} role="status" aria-live="polite">
    <span className="spinner" aria-hidden="true" />
    <span className="state-block__text">{label}</span>
  </div>
);

/** Full-height loader used while a lazily-loaded route is fetched. */
export const RouteLoading = () => (
  <div className="route-loader" role="status" aria-live="polite">
    <span className="spinner" aria-hidden="true" />
    <span className="sr-only">Loading page…</span>
  </div>
);

export const ErrorState = ({
  error,
  title = 'We could not load this content',
  onRetry,
  compact = false,
}) => {
  const message =
    error?.status === 0
      ? 'We could not reach the server. Please check your connection and try again.'
      : error?.message || 'An unexpected error occurred. Please try again.';

  return (
    <div className={`state-block state-block--error ${compact ? 'state-block--compact' : ''}`.trim()} role="alert">
      <span className="state-block__icon">
        <Icon name="alert" />
      </span>
      <span className="state-block__title">{title}</span>
      <span className="state-block__text">{message}</span>
      {onRetry ? (
        <Button variant="outline" size="sm" icon="refresh" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
};

export const EmptyState = ({
  title = 'Nothing here yet',
  message = 'There is no content to show at the moment.',
  icon = 'search',
  action,
}) => (
  <div className="state-block">
    <span className="state-block__icon">
      <Icon name={icon} />
    </span>
    <span className="state-block__title">{title}</span>
    <span className="state-block__text">{message}</span>
    {action ? (
      <Button variant="outline" size="sm" to={action.to} href={action.href} onClick={action.onClick}>
        {action.label}
      </Button>
    ) : null}
  </div>
);

export const SkeletonText = ({ width = '100%', height = 14 }) => (
  <span className="skeleton" style={{ display: 'block', width, height }} aria-hidden="true" />
);

export const SkeletonCard = () => (
  <div className="skeleton-card" aria-hidden="true">
    <div className="skeleton skeleton-card__media" />
    <div className="skeleton-card__body">
      <SkeletonText width="45%" height={12} />
      <SkeletonText width="80%" height={20} />
      <SkeletonText />
      <SkeletonText width="70%" />
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 3, columns = 3 }) => (
  <div className={`grid grid--${columns}`} aria-hidden="true">
    {Array.from({ length: count }, (_, index) => (
      <SkeletonCard key={index} />
    ))}
  </div>
);

export const SkeletonRows = ({ rows = 5 }) => (
  <div className="stack" aria-hidden="true">
    {Array.from({ length: rows }, (_, index) => (
      <SkeletonText key={index} height={44} />
    ))}
  </div>
);

/**
 * Standard wrapper that guarantees every data-driven area renders a loading,
 * error, empty or success state — never a blank region.
 *
 * Pass the object returned by `useApi` as `state`, or the individual flags.
 * `children` may be a node or a render function receiving the loaded data.
 */
export const AsyncContent = ({
  state,
  loading,
  error,
  isEmpty,
  data,
  onRetry,
  skeleton,
  emptyTitle,
  emptyText,
  emptyIcon,
  emptyAction,
  errorTitle,
  allowEmpty = false,
  children,
}) => {
  const isLoading = state ? state.loading : loading;
  const failure = state ? state.error : error;
  const empty = state ? state.isEmpty : isEmpty;
  const value = state ? state.data : data;
  const retry = onRetry || state?.refetch;

  if (isLoading) return skeleton ?? <Loading />;
  if (failure) return <ErrorState error={failure} onRetry={retry} title={errorTitle} />;
  if (empty && !allowEmpty) {
    return (
      <EmptyState title={emptyTitle} message={emptyText} icon={emptyIcon} action={emptyAction} />
    );
  }
  return typeof children === 'function' ? children(value ?? [], state) : children;
};

export default AsyncContent;
