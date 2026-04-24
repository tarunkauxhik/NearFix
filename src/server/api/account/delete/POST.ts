import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';

import { getDb } from '@/server/db/client';
import { bookings, providerProfiles, reviews, savedProviders } from '@/server/db/schema';
import { deleteClerkUser, requireViewer } from '@/server/lib/clerk';

export default async function handler(req: Request, res: Response) {
  try {
    const viewer = await requireViewer(req);
    const db = getDb();

    await db.transaction(async (tx) => {
      await tx.delete(reviews).where(eq(reviews.userId, viewer.userId));
      await tx.delete(savedProviders).where(eq(savedProviders.userId, viewer.userId));
      await tx.delete(bookings).where(eq(bookings.userId, viewer.userId));
      await tx.delete(providerProfiles).where(eq(providerProfiles.clerkUserId, viewer.userId));
      await deleteClerkUser(viewer.userId);
    });

    return res.json({
      success: true,
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
