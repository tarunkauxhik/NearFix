import type { Request } from 'express';
import { verifyToken } from '@clerk/backend';

import {
  normalizeProviderApplicationStatus,
  normalizeRole,
  type AppRole,
  type ProviderApplicationStatus,
  type Viewer,
} from '@/lib/access';
import '@/server/lib/env';

interface ClerkUser {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url: string;
  created_at: number;
  primary_email_address_id: string | null;
  email_addresses: Array<{
    id: string;
    email_address: string;
  }>;
  public_metadata?: Record<string, unknown>;
  private_metadata?: Record<string, unknown>;
}

type ErrorWithStatusCode = Error & {
  statusCode?: number;
};

export interface AuthenticatedViewer extends Viewer {
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
}

function createHttpError(statusCode: number, message: string): ErrorWithStatusCode {
  const error = new Error(message) as ErrorWithStatusCode;
  error.statusCode = statusCode;
  return error;
}

function getClerkSecretKey(): string {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('CLERK_SECRET_KEY is not configured');
  }
  return secretKey;
}

function getRequestOrigin(req: Request): string | undefined {
  const explicitOrigin = req.headers.origin;
  if (explicitOrigin) return explicitOrigin;

  const host = req.headers.host;
  if (!host) return undefined;

  const proto =
    (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0]?.trim() ||
    (host.includes('localhost') ? 'http' : 'https');

  return `${proto}://${host}`;
}

function getAuthorizedParties(req: Request): string[] | undefined {
  const values = [
    process.env.VITE_PUBLIC_URL,
    getRequestOrigin(req),
  ].filter((value): value is string => Boolean(value));

  return values.length ? Array.from(new Set(values)) : undefined;
}

function getBearerToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (!authHeader) return undefined;
  return authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;
}

function getSessionCookie(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;

  const pair = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('__session='));

  return pair ? decodeURIComponent(pair.slice('__session='.length)) : undefined;
}

export function getSessionTokenFromRequest(req: Request): string | undefined {
  return getBearerToken(req) || getSessionCookie(req);
}

export function getErrorStatusCode(error: unknown, fallback = 500): number {
  return typeof error === 'object' && error && 'statusCode' in error && typeof error.statusCode === 'number'
    ? error.statusCode
    : fallback;
}

function getPrimaryEmail(user: ClerkUser): string | undefined {
  if (!user.primary_email_address_id) return user.email_addresses[0]?.email_address;
  return (
    user.email_addresses.find((email) => email.id === user.primary_email_address_id)?.email_address ||
    user.email_addresses[0]?.email_address
  );
}

function getAllEmails(user: ClerkUser): string[] {
  return user.email_addresses
    .map((email) => email.email_address.trim().toLowerCase())
    .filter(Boolean);
}

function getBootstrapAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function getBootstrapAdminUsernames(): string[] {
  return (process.env.ADMIN_USERNAMES || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function getBootstrapAdminUserIds(): string[] {
  return (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

async function clerkRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://api.clerk.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getClerkSecretKey()}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Clerk request failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
}

export async function getClerkUser(userId: string): Promise<ClerkUser> {
  return clerkRequest<ClerkUser>(`/v1/users/${userId}`);
}

export async function listClerkUsers(limit = 100): Promise<ClerkUser[]> {
  const params = new URLSearchParams({
    limit: String(limit),
  });
  return clerkRequest<ClerkUser[]>(`/v1/users?${params.toString()}`);
}

export async function updateClerkUserMetadata(
  userId: string,
  {
    publicMetadata,
    privateMetadata,
  }: {
    publicMetadata?: Record<string, unknown>;
    privateMetadata?: Record<string, unknown>;
  }
): Promise<ClerkUser> {
  return clerkRequest<ClerkUser>(`/v1/users/${userId}/metadata`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...(publicMetadata ? { public_metadata: publicMetadata } : {}),
      ...(privateMetadata ? { private_metadata: privateMetadata } : {}),
    }),
  });
}

export async function deleteClerkUser(userId: string): Promise<void> {
  const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${getClerkSecretKey()}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Clerk delete failed (${response.status}): ${body}`);
  }
}

export async function buildViewerFromClerkUser(user: ClerkUser): Promise<AuthenticatedViewer> {
  const role = normalizeRole(user.public_metadata?.role);
  const providerApplicationStatus = normalizeProviderApplicationStatus(
    user.public_metadata?.providerApplicationStatus
  );
  const email = getPrimaryEmail(user);
  const allEmails = getAllEmails(user);
  const bootstrapEmails = getBootstrapAdminEmails();
  const bootstrapUsernames = getBootstrapAdminUsernames();
  const normalizedUsername = user.username?.trim().toLowerCase();
  const isBootstrapAdmin =
    allEmails.some((userEmail) => bootstrapEmails.includes(userEmail)) ||
    Boolean(normalizedUsername && bootstrapUsernames.includes(normalizedUsername)) ||
    getBootstrapAdminUserIds().includes(user.id);
  const isAdmin = user.private_metadata?.role === 'admin' || isBootstrapAdmin;
  const canActAsBoth = Boolean(user.private_metadata?.canActAsBoth);

  return {
    userId: user.id,
    email,
    firstName: user.first_name,
    lastName: user.last_name,
    role,
    isAdmin,
    canActAsBoth,
    providerApplicationStatus,
  };
}

export async function requireViewer(req: Request): Promise<AuthenticatedViewer> {
  const token = getSessionTokenFromRequest(req);
  if (!token) {
    throw createHttpError(401, 'Authentication token not found');
  }

  const authorizedParties = getAuthorizedParties(req);
  const verifiedToken = await verifyToken(token, {
    secretKey: getClerkSecretKey(),
    ...(authorizedParties ? { authorizedParties } : {}),
  });

  if (!verifiedToken.sub) {
    throw createHttpError(401, 'Invalid session token');
  }

  const user = await getClerkUser(verifiedToken.sub);
  return buildViewerFromClerkUser(user);
}

export function assertRole(
  viewer: AuthenticatedViewer,
  role: AppRole,
  {
    allowAdmin = true,
    allowDualRole = true,
  }: {
    allowAdmin?: boolean;
    allowDualRole?: boolean;
  } = {}
): void {
  if (allowAdmin && viewer.isAdmin) return;
  if (viewer.role === role) return;
  if (allowDualRole && viewer.canActAsBoth) return;
  throw createHttpError(403, `This action requires the ${role} role`);
}

export function assertAdmin(viewer: AuthenticatedViewer): void {
  if (!viewer.isAdmin) {
    throw createHttpError(403, 'Admin access required');
  }
}

export function buildPublicMetadata(
  current: Record<string, unknown> | undefined,
  updates: {
    role?: AppRole;
    providerApplicationStatus?: ProviderApplicationStatus | null;
  }
): Record<string, unknown> {
  const next = { ...(current || {}) };

  if (updates.role) {
    next.role = updates.role;
  }

  if (updates.providerApplicationStatus === null) {
    delete next.providerApplicationStatus;
  } else if (updates.providerApplicationStatus) {
    next.providerApplicationStatus = updates.providerApplicationStatus;
  }

  return next;
}

export function buildPrivateMetadata(
  current: Record<string, unknown> | undefined,
  updates: {
    canActAsBoth?: boolean;
  }
): Record<string, unknown> {
  return {
    ...(current || {}),
    ...(typeof updates.canActAsBoth === 'boolean'
      ? { canActAsBoth: updates.canActAsBoth }
      : {}),
  };
}
