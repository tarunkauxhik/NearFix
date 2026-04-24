import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

import { FullScreenSpinner, ViewerResolutionError } from '@/components/auth/AuthGateState';
import { getSignedInHome } from '@/lib/access';
import { useViewer } from '@/lib/useViewer';

export default function PostAuthPage() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const viewerQuery = useViewer();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !viewerQuery.data) return;

    navigate(getSignedInHome(viewerQuery.data), { replace: true });
  }, [isLoaded, isSignedIn, navigate, viewerQuery.data]);

  if (!isLoaded) {
    return <FullScreenSpinner />;
  }

  if (!isSignedIn) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  if (viewerQuery.isError) {
    return <ViewerResolutionError />;
  }

  return <FullScreenSpinner />;
}
