import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';

import { getDb } from '@/server/db/client';
import { bookings, providerProfiles, reviews, savedProviders } from '@/server/db/schema';
import { getClerkUser, requireViewer } from '@/server/lib/clerk';

export default async function handler(req: Request, res: Response) {
  try {
    const viewer = await requireViewer(req);
    const db = getDb();

    const [clerkUser, bookingRows, reviewRows, savedProviderRows, providerProfile] = await Promise.all([
      getClerkUser(viewer.userId),
      db.select().from(bookings).where(eq(bookings.userId, viewer.userId)),
      db.select().from(reviews).where(eq(reviews.userId, viewer.userId)),
      db.select().from(savedProviders).where(eq(savedProviders.userId, viewer.userId)),
      db.query.providerProfiles.findFirst({
        where: eq(providerProfiles.clerkUserId, viewer.userId),
      }),
    ]);

    const exportedAt = new Date().toISOString();

    return res.json({
      fileName: `nearfix-account-${viewer.userId}-${exportedAt.slice(0, 10)}.json`,
      payload: {
        exportedAt,
        viewer,
        account: {
          id: clerkUser.id,
          username: clerkUser.username,
          firstName: clerkUser.first_name,
          lastName: clerkUser.last_name,
          imageUrl: clerkUser.image_url,
          emailAddresses: clerkUser.email_addresses.map((email) => email.email_address),
          publicMetadata: clerkUser.public_metadata ?? {},
        },
        providerProfile,
        bookings: bookingRows,
        reviews: reviewRows,
        savedProviders: savedProviderRows,
      },
    });
  } catch (error) {
    console.error('Error exporting account data:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
