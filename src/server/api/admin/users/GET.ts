import type { Request, Response } from 'express';

import { listProviderProfilesSafe } from '@/server/db/provider-profiles';
import {
  assertAdmin,
  buildViewerFromClerkUser,
  getErrorStatusCode,
  listClerkUsers,
  requireViewer,
} from '@/server/lib/clerk';

export default async function handler(req: Request, res: Response) {
  try {
    const viewer = await requireViewer(req);
    assertAdmin(viewer);

    const [users, providerProfilesResult] = await Promise.all([
      listClerkUsers(100),
      listProviderProfilesSafe(),
    ]);

    const profilesByUserId = new Map(
      providerProfilesResult.profiles.map((profile) => [profile.clerkUserId, profile])
    );

    const items = await Promise.all(
      users.map(async (user) => {
        const auth = await buildViewerFromClerkUser(user);
        const providerProfile = profilesByUserId.get(user.id) ?? null;

        return {
          userId: user.id,
          email: auth.email,
          firstName: auth.firstName,
          lastName: auth.lastName,
          role: auth.role,
          isAdmin: auth.isAdmin,
          canActAsBoth: auth.canActAsBoth,
          providerApplicationStatus: auth.providerApplicationStatus,
          createdAt: new Date(user.created_at).toISOString(),
          providerProfile,
        };
      })
    );

    const summary = {
      totalUsers: items.length,
      customers: items.filter((user) => user.role === 'customer').length,
      providers: items.filter((user) => user.role === 'provider').length,
      admins: items.filter((user) => user.isAdmin).length,
      pendingProviderApprovals: items.filter(
        (user) =>
          user.role === 'provider' &&
          (user.providerApplicationStatus === 'draft' || user.providerApplicationStatus === 'pending')
      ).length,
      needsReview: items.filter(
        (user) =>
          user.role === 'provider' &&
          (user.providerApplicationStatus === 'draft' ||
            user.providerApplicationStatus === 'pending' ||
            user.providerApplicationStatus === 'rejected')
      ).length,
      rejectedProviders: items.filter(
        (user) => user.role === 'provider' && user.providerApplicationStatus === 'rejected'
      ).length,
      dualRoleEnabled: items.filter((user) => user.canActAsBoth).length,
    };

    return res.json({
      users: items,
      summary,
      warning: providerProfilesResult.warning,
    });
  } catch (error) {
    console.error('Error listing admin users:', error);
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
