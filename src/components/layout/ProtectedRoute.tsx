import { Navigate, Outlet, useLocation } from 'react-router';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';

/** Shows the page only when signed in; otherwise sends the owner to /login. */
export function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center text-brand-600">
        <Spinner />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
