import { Component } from 'react';

/**
 * Last line of defence: converts an unexpected render error into a readable
 * screen with a recovery path instead of a blank white page.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="container section">
        <div className="state-block state-block--error" role="alert">
          <span className="state-block__title">Something went wrong on this page</span>
          <span className="state-block__text">
            We have logged the problem. Reloading usually fixes it — if it keeps happening, please contact us.
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
              <span>Reload the page</span>
            </button>
            <a className="btn btn--outline" href="/">
              <span>Back to the homepage</span>
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
