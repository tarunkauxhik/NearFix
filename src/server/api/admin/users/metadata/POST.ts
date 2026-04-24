import type { Request, Response } from 'express';
import { z } from 'zod';

import {
  normalizeProviderApplicationStatus,
  providerApplicationStatusSchema,
  roleSchema,
} from '@/lib/access';
import { updateProviderProfileReviewSafe } from '@/server/db/provider-profiles';
import {
  assertAdmin,
  buildPrivateMetadata,
  buildPublicMetadata,
  getErrorStatusCode,
  getClerkUser,
  requireViewer,
  updateClerkUserMetadata,
} from '@/server/lib/clerk';

const updateUserMetadataSchema = z.object({
  userId: z.string().min(1, 'User id is required'),
  role: roleSchema.optional(),
  providerApplicationStatus: providerApplicationStatusSchema.optional().nullable(),
  canActAsBoth: z.boolean().optional(),
  reviewNotes: z.string().trim().max(1500, 'Review notes are too long').optional(),
});

export default async function handler(req: Request, res: Response) {
  try {
    const viewer = await requireViewer(req);
    assertAdmin(viewer);

    const parsed = updateUserMetadataSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message ?? 'Invalid admin update payload',
      });
    }

    const { userId, role, providerApplicationStatus, canActAsBoth, reviewNotes } = parsed.data;

    const clerkUser = await getClerkUser(userId);
    const normalizedProviderStatus =
      role === 'customer' ? null : normalizeProviderApplicationStatus(providerApplicationStatus);
    const nextPublicMetadata = buildPublicMetadata(clerkUser.public_metadata, {
      role,
      providerApplicationStatus: normalizedProviderStatus,
    });
    const nextPrivateMetadata = buildPrivateMetadata(clerkUser.private_metadata, {
      canActAsBoth,
    });

    const updatedUser = await updateClerkUserMetadata(userId, {
      publicMetadata: nextPublicMetadata,
      privateMetadata: nextPrivateMetadata,
    });

    const providerProfileResult = normalizedProviderStatus
      ? await updateProviderProfileReviewSafe(userId, {
          status: normalizedProviderStatus,
          reviewNotes: reviewNotes ?? null,
          reviewedBy: viewer.userId,
        })
      : { warning: null };

    return res.json({
      success: true,
      user: {
        userId: updatedUser.id,
        publicMetadata: updatedUser.public_metadata,
        privateMetadata: {
          canActAsBoth: nextPrivateMetadata.canActAsBoth ?? false,
        },
      },
      warning: providerProfileResult.warning,
    });
  } catch (error) {
    console.error('Error updating admin metadata:', error);
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
