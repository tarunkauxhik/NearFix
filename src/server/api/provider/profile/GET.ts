import type { Request, Response } from 'express';
import { findProviderProfileSafe } from '@/server/db/provider-profiles';
import { getErrorStatusCode, requireViewer } from '@/server/lib/clerk';

export default async function handler(req: Request, res: Response) {
  try {
    const viewer = await requireViewer(req);

    if (!viewer.isAdmin && viewer.role !== 'provider' && !viewer.canActAsBoth) {
      return res.status(403).json({ error: 'Provider access required' });
    }

    const result = await findProviderProfileSafe(viewer.userId);

    return res.json({
      profile: result.profile ?? null,
      warning: result.warning,
    });
  } catch (error) {
    console.error('Error loading provider profile:', error);
    const statusCode = getErrorStatusCode(error);
    return res.status(statusCode).json({
      error:
        error instanceof Error && statusCode < 500
          ? error.message
          : statusCode === 500
            ? 'Internal server error'
            : 'Request failed',
    });
  }
}
