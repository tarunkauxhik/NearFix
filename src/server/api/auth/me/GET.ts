import type { Request, Response } from 'express';

import { getErrorStatusCode, requireViewer } from '@/server/lib/clerk';

export default async function handler(req: Request, res: Response) {
  try {
    const viewer = await requireViewer(req);

    return res.json({
      userId: viewer.userId,
      role: viewer.role,
      isAdmin: viewer.isAdmin,
      canActAsBoth: viewer.canActAsBoth,
      providerApplicationStatus: viewer.providerApplicationStatus,
    });
  } catch (error) {
    console.error('Error resolving viewer:', error);
    const statusCode = getErrorStatusCode(error, 401);
    return res.status(statusCode).json({
      error: statusCode === 401 ? 'Unauthorized' : error instanceof Error ? error.message : 'Request failed',
    });
  }
}
