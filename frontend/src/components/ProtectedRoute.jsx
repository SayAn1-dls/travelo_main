import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './Loader';
import ROUTES from '../constants/routes';

/**
 * ProtectedRoute — wraps any route that requires authentication.
 * Redirects unauthenticated users to /auth with the original path preserved.
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!user) {
    return (
      <Navigate
        to={ROUTES.AUTH}
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;
