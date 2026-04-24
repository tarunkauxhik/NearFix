import { useAuth } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';

import { authApiFetch } from '@/lib/api-client';
import type { Viewer } from '@/lib/access';

export function useViewer() {
  const { getToken, isLoaded, userId } = useAuth();

  return useQuery({
    queryKey: ['viewer', userId],
    enabled: isLoaded && Boolean(userId),
    queryFn: () => authApiFetch<Viewer>('/auth/me', getToken),
    staleTime: 1000 * 30,
  });
}
