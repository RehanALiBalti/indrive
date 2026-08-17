import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { RouteLoading, ErrorState } from '../ui/States.jsx';
import Button from '../ui/Button.jsx';

/**
 * Client-side route guard.
 *
 * This is a usability measure only: it keeps signed-out visitors away from
 * screens they cannot use. Every admin API independently verifies the Firebase
 * ID token and the caller's role server-side, so hiding a route in the browser
 * is never what protects the data.
 */
const ProtectedRoute = ({ role = 'user', redirectTo = '/login', children }) => {
  const { initialising, isAuthenticated, hasRole, profileError } = useAuth();
  const location = useLocation();

  if (initialising) return <RouteLoading />;

  if (!isAuthenticated) {
    if (profileError && profileError.status !== 401) {
      return (
        <div className="container section">
          <ErrorState
            error={profileError}
            title="We could not confirm your session"
            onRetry={() => window.location.reload()}
          />
        </div>
      );
    }
    return <Navigate to={redirectTo} replace state={{ from: location.pathname + location.search }} />;
  }

  if (!hasRole(role)) {
    return (
      <div className="container section">
        <div className="state-block">
          <span className="state-block__title">You do not have access to this area</span>
          <span className="state-block__text">
            Your account does not have the permissions needed for the admin area. If you believe this is a
            mistake, contact an administrator.
          </span>
          <Button to="/" variant="outline">
            Back to the website
          </Button>
        </div>
      </div>
    );
  }

  return children ?? <Outlet />;
};

export default ProtectedRoute;
