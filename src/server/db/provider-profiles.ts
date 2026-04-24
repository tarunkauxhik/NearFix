import { eq } from 'drizzle-orm';

import { type ProviderApplicationStatus } from '@/lib/access';
import { getDb } from '@/server/db/client';
import { providerProfiles } from '@/server/db/schema';

export const PROVIDER_PROFILES_SETUP_HINT =
  'Provider profile storage is not ready in this database yet. Run `npx drizzle-kit push` with your current DATABASE_URL, then refresh the page.';

export function isProviderProfilesSchemaError(error: unknown): boolean {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  const message = error instanceof Error ? error.message : String(error ?? '');

  return (
    code === '42P01' ||
    code === '42703' ||
    /provider_profiles/i.test(message)
  );
}

export async function listProviderProfilesSafe() {
  try {
    return {
      profiles: await getDb().select().from(providerProfiles),
      warning: null,
    };
  } catch (error) {
    if (isProviderProfilesSchemaError(error)) {
      console.warn('Provider profiles table is unavailable:', error);
      return {
        profiles: [],
        warning: PROVIDER_PROFILES_SETUP_HINT,
      };
    }

    throw error;
  }
}

export async function findProviderProfileSafe(clerkUserId: string) {
  try {
    return {
      profile: await getDb().query.providerProfiles.findFirst({
        where: eq(providerProfiles.clerkUserId, clerkUserId),
      }),
      warning: null,
    };
  } catch (error) {
    if (isProviderProfilesSchemaError(error)) {
      console.warn('Provider profile lookup skipped:', error);
      return {
        profile: null,
        warning: PROVIDER_PROFILES_SETUP_HINT,
      };
    }

    throw error;
  }
}

export async function updateProviderProfileReviewSafe(
  userId: string,
  payload: {
    status: ProviderApplicationStatus;
    reviewNotes: string | null;
    reviewedBy: string;
  }
) {
  try {
    await getDb()
      .update(providerProfiles)
      .set({
        status: payload.status,
        reviewNotes: payload.reviewNotes,
        reviewedAt: new Date(),
        reviewedBy: payload.reviewedBy,
        updatedAt: new Date(),
      })
      .where(eq(providerProfiles.clerkUserId, userId));

    return { warning: null };
  } catch (error) {
    if (isProviderProfilesSchemaError(error)) {
      console.warn('Provider profile admin update skipped:', error);
      return { warning: PROVIDER_PROFILES_SETUP_HINT };
    }

    throw error;
  }
}
