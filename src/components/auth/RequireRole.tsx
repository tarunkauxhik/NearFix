import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

import { FullScreenSpinner, ViewerResolutionError } from '@/components/auth/AuthGateState';
import {
  canAccessAdminApp,
  canAccessCustomerApp,
  canAccessProviderApp,
  getSignedInHome,
  type AppRole,
} from '@/lib/access';
import { useViewer } from '@/lib/useViewer';

export default function RequireRole({
  roles,
  children,
  adminOnly = false,
}: {
  roles?: AppRole[];
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const viewerQuery = useViewer();

  if (!authLoaded) {
    return <FullScreenSpinner />;
  }

  if (!isSignedIn) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  if (viewerQuery.isError) {
    return <ViewerResolutionError />;
  }

  if (viewerQuery.isLoading || !viewerQuery.data) {
    return <FullScreenSpinner />;
  }

  const viewer = viewerQuery.data;

  if (adminOnly) {
    return viewer.isAdmin
      ? <>{children}</>
      : <Navigate to={getSignedInHome(viewer)} replace />;
  }

  const hasRole = roles?.some((role) => {
    if (role === 'customer') {
      return canAccessCustomerApp(viewer);
    }

    return canAccessProviderApp(viewer);
  }) ?? canAccessAdminApp(viewer);

  return hasRole
    ? <>{children}</>
    : <Navigate to={getSignedInHome(viewer)} replace />;
}
