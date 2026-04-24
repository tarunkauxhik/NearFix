import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';

import { providerRegistrationSchema } from '@/lib/access';
import { getDb } from '@/server/db/client';
import { PROVIDER_PROFILES_SETUP_HINT, isProviderProfilesSchemaError } from '@/server/db/provider-profiles';
import { providerProfiles } from '@/server/db/schema';
import {
  buildPublicMetadata,
  getClerkUser,
  getErrorStatusCode,
  requireViewer,
  updateClerkUserMetadata,
} from '@/server/lib/clerk';

export default async function handler(req: Request, res: Response) {
  try {
    const viewer = await requireViewer(req);

    if (!viewer.isAdmin && viewer.role !== 'provider' && !viewer.canActAsBoth) {
      return res.status(403).json({ error: 'Provider access required' });
    }

    const parsed = providerRegistrationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message ?? 'Invalid provider registration payload',
      });
    }

    const data = parsed.data;
    const nextStatus = viewer.providerApplicationStatus === 'approved' ? 'approved' : 'pending';

    try {
      await getDb()
        .insert(providerProfiles)
        .values({
          clerkUserId: viewer.userId,
          businessName: data.businessName || null,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          city: data.city,
          serviceArea: data.serviceArea,
          category: data.category,
          yearsExperience: data.yearsExperience,
          basePrice: data.basePrice.toFixed(2),
          bio: data.bio,
          hasOwnTools: data.hasOwnTools,
          offersEmergencyServices: data.offersEmergencyServices,
          consentTerms: data.consentTerms,
          consentBackgroundCheck: data.consentBackgroundCheck,
          consentDataProcessing: data.consentDataProcessing,
          status: nextStatus,
          updatedAt: new Date(),
          ...(nextStatus === 'pending'
            ? {
                reviewNotes: null,
                reviewedAt: null,
                reviewedBy: null,
              }
            : {}),
        })
        .onConflictDoUpdate({
          target: providerProfiles.clerkUserId,
          set: {
            businessName: data.businessName || null,
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            city: data.city,
            serviceArea: data.serviceArea,
            category: data.category,
            yearsExperience: data.yearsExperience,
            basePrice: data.basePrice.toFixed(2),
            bio: data.bio,
            hasOwnTools: data.hasOwnTools,
            offersEmergencyServices: data.offersEmergencyServices,
            consentTerms: data.consentTerms,
            consentBackgroundCheck: data.consentBackgroundCheck,
            consentDataProcessing: data.consentDataProcessing,
            status: nextStatus,
            updatedAt: new Date(),
            ...(nextStatus === 'pending'
              ? {
                  reviewNotes: null,
                  reviewedAt: null,
                  reviewedBy: null,
                }
              : {}),
          },
        });
    } catch (error) {
      if (isProviderProfilesSchemaError(error)) {
        return res.status(503).json({ error: PROVIDER_PROFILES_SETUP_HINT });
      }

      throw error;
    }

    const updatedProfile = await getDb().query.providerProfiles.findFirst({
      where: eq(providerProfiles.clerkUserId, viewer.userId),
    });

    const clerkUser = await getClerkUser(viewer.userId);
    await updateClerkUserMetadata(viewer.userId, {
      publicMetadata: buildPublicMetadata(clerkUser.public_metadata, {
        role: 'provider',
        providerApplicationStatus: nextStatus,
      }),
    });

    return res.json({
      success: true,
      profile: updatedProfile ?? null,
      providerApplicationStatus: nextStatus,
    });
  } catch (error) {
    console.error('Error saving provider profile:', error);
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
