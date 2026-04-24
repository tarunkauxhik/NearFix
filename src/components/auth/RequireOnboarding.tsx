import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

import { FullScreenSpinner, ViewerResolutionError } from '@/components/auth/AuthGateState';
import { canAccessRoleSelection, getSignedInHome } from '@/lib/access';
import { useViewer } from '@/lib/useViewer';

export default function RequireOnboarding({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const viewerQuery = useViewer();

  if (!isLoaded) {
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

  return canAccessRoleSelection(viewerQuery.data)
    ? <>{children}</>
    : <Navigate to={getSignedInHome(viewerQuery.data)} replace />;
}
