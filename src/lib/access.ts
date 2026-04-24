import { z } from 'zod';

export const appRoles = ['customer', 'provider'] as const;
export type AppRole = typeof appRoles[number];
export const viewerStates = [
  'visitor',
  'signed_in_unassigned',
  'customer',
  'provider_draft',
  'provider',
  'admin',
] as const;
export type ViewerState = typeof viewerStates[number];

export const legacyRoleAliases = {
  resident: 'customer',
} as const;

export type LegacyRole = keyof typeof legacyRoleAliases;

export const providerApplicationStatuses = ['draft', 'pending', 'approved', 'rejected'] as const;
export type ProviderApplicationStatus = typeof providerApplicationStatuses[number];

export const providerCategories = [
  'electrician',
  'plumber',
  'tutor',
  'beautician',
  'carpenter',
  'ac-repair',
  'pest-control',
  'cleaning',
] as const;
export type ProviderCategory = typeof providerCategories[number];

export const providerCategoryLabels: Record<ProviderCategory, string> = {
  electrician: 'Electrician',
  plumber: 'Plumber',
  tutor: 'Home Tutor',
  beautician: 'Beautician',
  carpenter: 'Carpenter',
  'ac-repair': 'AC Repair',
  'pest-control': 'Pest Control',
  cleaning: 'Cleaning',
};

export const providerApplicationStatusLabels: Record<ProviderApplicationStatus, string> = {
  draft: 'Profile Draft',
  pending: 'Pending Review',
  approved: 'Approved',
  rejected: 'Needs Changes',
};

export const roleSchema = z.enum(appRoles);
export const providerApplicationStatusSchema = z.enum(providerApplicationStatuses);
export const providerCategorySchema = z.enum(providerCategories);

export function normalizeRole(role: unknown): AppRole | undefined {
  if (typeof role !== 'string') return undefined;
  if (role in legacyRoleAliases) {
    return legacyRoleAliases[role as LegacyRole];
  }
  return appRoles.includes(role as AppRole) ? (role as AppRole) : undefined;
}

export function normalizeProviderApplicationStatus(
  status: unknown
): ProviderApplicationStatus | undefined {
  return typeof status === 'string' && providerApplicationStatuses.includes(status as ProviderApplicationStatus)
    ? (status as ProviderApplicationStatus)
    : undefined;
}

export function getRoleLabel(role: AppRole): string {
  return role === 'customer' ? 'Customer' : 'Provider';
}

export function getProviderApplicationStatusLabel(status: ProviderApplicationStatus): string {
  return providerApplicationStatusLabels[status];
}

export function needsProviderAttention(status: ProviderApplicationStatus | null | undefined): boolean {
  return status === 'draft' || status === 'pending' || status === 'rejected';
}

export interface Viewer {
  userId: string;
  role?: AppRole;
  isAdmin: boolean;
  canActAsBoth: boolean;
  providerApplicationStatus?: ProviderApplicationStatus;
}

type ViewerStateInput = Pick<Viewer, 'role' | 'isAdmin' | 'providerApplicationStatus'>;
type ViewerPermissionInput = Pick<Viewer, 'role' | 'isAdmin' | 'canActAsBoth'>;

export function getViewerState(viewer: ViewerStateInput | null | undefined): ViewerState {
  if (!viewer) return 'visitor';
  if (viewer.isAdmin) return 'admin';
  if (viewer.role === 'provider') {
    return viewer.providerApplicationStatus === 'draft'
      ? 'provider_draft'
      : 'provider';
  }
  if (viewer.role === 'customer') return 'customer';
  return 'signed_in_unassigned';
}

export function getViewerStateFromSession(
  isSignedIn: boolean,
  viewer: ViewerStateInput | null | undefined
): ViewerState {
  if (!isSignedIn) return 'visitor';
  return viewer ? getViewerState(viewer) : 'signed_in_unassigned';
}

export function getSignedInHome(viewer: ViewerStateInput | null | undefined): string {
  switch (getViewerState(viewer)) {
    case 'admin':
      return '/admin';
    case 'provider_draft':
      return '/provider/register';
    case 'provider':
      return '/dashboard/provider';
    case 'customer':
      return '/dashboard/customer';
    case 'signed_in_unassigned':
      return '/onboarding';
    case 'visitor':
    default:
      return '/';
  }
}

export function canAccessCustomerApp(viewer: ViewerPermissionInput | null | undefined): boolean {
  return Boolean(viewer && (viewer.isAdmin || viewer.role === 'customer' || viewer.canActAsBoth));
}

export function canAccessProviderApp(viewer: ViewerPermissionInput | null | undefined): boolean {
  return Boolean(viewer && (viewer.isAdmin || viewer.role === 'provider' || viewer.canActAsBoth));
}

export function canAccessAdminApp(viewer: Pick<Viewer, 'isAdmin'> | null | undefined): boolean {
  return Boolean(viewer?.isAdmin);
}

export function canAccessRoleSelection(
  viewer: Pick<Viewer, 'role' | 'isAdmin'> | null | undefined
): boolean {
  return Boolean(viewer && !viewer.isAdmin && !viewer.role);
}

export function getAvailableRoleExperiences(
  viewer: ViewerPermissionInput | null | undefined
): AppRole[] {
  if (!viewer) return [];

  const roles = new Set<AppRole>();

  if (viewer.role) {
    roles.add(viewer.role);
  }

  if (viewer.canActAsBoth) {
    roles.add('customer');
    roles.add('provider');
  }

  return Array.from(roles);
}

export const providerRegistrationSchema = z.object({
  businessName: z
    .string()
    .trim()
    .max(120, 'Business name is too long')
    .optional()
    .or(z.literal('')),
  fullName: z.string().trim().min(2, 'Full name is required').max(120, 'Full name is too long'),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .min(10, 'Enter a valid phone number')
    .max(20, 'Phone number is too long'),
  city: z.string().trim().min(2, 'City is required').max(80, 'City is too long'),
  serviceArea: z
    .string()
    .trim()
    .min(5, 'Service area is required')
    .max(160, 'Service area is too long'),
  category: providerCategorySchema,
  yearsExperience: z.coerce
    .number()
    .int('Years of experience must be a whole number')
    .min(0, 'Years of experience cannot be negative')
    .max(50, 'Years of experience looks too high'),
  basePrice: z.coerce
    .number()
    .min(0, 'Base price cannot be negative')
    .max(100000, 'Base price looks too high'),
  bio: z.string().trim().min(30, 'Tell customers a bit more about yourself').max(1200, 'Bio is too long'),
  hasOwnTools: z.boolean(),
  offersEmergencyServices: z.boolean(),
  consentTerms: z.boolean().refine((value) => value, 'You must accept the provider terms'),
  consentBackgroundCheck: z
    .boolean()
    .refine((value) => value, 'Background check consent is required'),
  consentDataProcessing: z
    .boolean()
    .refine((value) => value, 'Data processing consent is required'),
});

export type ProviderRegistrationInput = z.infer<typeof providerRegistrationSchema>;
