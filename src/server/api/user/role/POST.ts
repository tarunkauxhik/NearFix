import type { Request, Response } from 'express';

import {
  buildPublicMetadata,
  getClerkUser,
  getErrorStatusCode,
  requireViewer,
  updateClerkUserMetadata,
} from '@/server/lib/clerk';
import { roleSchema } from '@/lib/access';

export default async function handler(req: Request, res: Response) {
  try {
    const viewer = await requireViewer(req);
    const parsed = roleSchema.safeParse(req.body?.role);

    if (!parsed.success) {
      return res.status(400).json({ error: 'role must be "customer" or "provider"' });
    }

    const role = parsed.data;

    if (viewer.isAdmin) {
      return res.status(403).json({
        error: 'Admins must manage public roles from the admin area instead of onboarding.',
      });
    }

    if (viewer.role && viewer.role !== role) {
      return res.status(409).json({
        error: 'Your account already has a role. Contact an admin if you need it changed.',
      });
    }

    if (viewer.role === role) {
      return res.json({
        success: true,
        role,
        providerApplicationStatus: viewer.providerApplicationStatus,
      });
    }

    const clerkUser = await getClerkUser(viewer.userId);
    const updatedUser = await updateClerkUserMetadata(viewer.userId, {
      publicMetadata: buildPublicMetadata(clerkUser.public_metadata, {
        role,
        providerApplicationStatus: role === 'provider' ? 'draft' : null,
      }),
    });

    return res.json({
      success: true,
      role,
      providerApplicationStatus: updatedUser.public_metadata?.providerApplicationStatus ?? null,
    });
  } catch (error) {
    console.error('Error updating user role:', error);
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
