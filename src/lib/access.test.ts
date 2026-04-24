import { describe, expect, it } from 'vitest';

import {
  canAccessAdminApp,
  canAccessCustomerApp,
  canAccessProviderApp,
  canAccessRoleSelection,
  getProviderApplicationStatusLabel,
  getAvailableRoleExperiences,
  getSignedInHome,
  getViewerState,
  getViewerStateFromSession,
  needsProviderAttention,
  normalizeProviderApplicationStatus,
  normalizeRole,
  providerRegistrationSchema,
} from '@/lib/access';

describe('access helpers', () => {
  it('maps legacy resident metadata to customer', () => {
    expect(normalizeRole('resident')).toBe('customer');
    expect(normalizeRole('customer')).toBe('customer');
    expect(normalizeRole('provider')).toBe('provider');
    expect(normalizeRole('admin')).toBeUndefined();
  });

  it('routes signed-in users to the correct landing page', () => {
    expect(
      getSignedInHome({
        role: 'customer',
        isAdmin: false,
        providerApplicationStatus: undefined,
      })
    ).toBe('/dashboard/customer');

    expect(
      getSignedInHome({
        role: 'provider',
        isAdmin: false,
        providerApplicationStatus: 'draft',
      })
    ).toBe('/provider/register');

    expect(
      getSignedInHome({
        role: 'provider',
        isAdmin: false,
        providerApplicationStatus: 'pending',
      })
    ).toBe('/dashboard/provider');

    expect(
      getSignedInHome({
        role: undefined,
        isAdmin: true,
        providerApplicationStatus: normalizeProviderApplicationStatus('approved'),
      })
    ).toBe('/admin');

    expect(getSignedInHome(undefined)).toBe('/');
  });

  it('derives the five-state viewer model consistently', () => {
    expect(getViewerState(undefined)).toBe('visitor');
    expect(getViewerState({ role: undefined, isAdmin: false, providerApplicationStatus: undefined })).toBe(
      'signed_in_unassigned'
    );
    expect(getViewerState({ role: 'customer', isAdmin: false, providerApplicationStatus: undefined })).toBe(
      'customer'
    );
    expect(getViewerState({ role: 'provider', isAdmin: false, providerApplicationStatus: 'draft' })).toBe(
      'provider_draft'
    );
    expect(getViewerState({ role: 'provider', isAdmin: false, providerApplicationStatus: 'approved' })).toBe(
      'provider'
    );
    expect(getViewerState({ role: 'provider', isAdmin: true, providerApplicationStatus: 'draft' })).toBe(
      'admin'
    );
  });

  it('uses auth session state when viewer data is still loading', () => {
    expect(getViewerStateFromSession(false, undefined)).toBe('visitor');
    expect(getViewerStateFromSession(true, undefined)).toBe('signed_in_unassigned');
  });

  it('exposes centralized permission helpers', () => {
    const customerViewer = { role: 'customer' as const, isAdmin: false, canActAsBoth: false };
    const providerViewer = { role: 'provider' as const, isAdmin: false, canActAsBoth: false };
    const dualRoleViewer = { role: 'customer' as const, isAdmin: false, canActAsBoth: true };
    const adminViewer = { role: undefined, isAdmin: true, canActAsBoth: false };

    expect(canAccessCustomerApp(customerViewer)).toBe(true);
    expect(canAccessCustomerApp(providerViewer)).toBe(false);
    expect(canAccessCustomerApp(dualRoleViewer)).toBe(true);
    expect(canAccessCustomerApp(adminViewer)).toBe(true);

    expect(canAccessProviderApp(customerViewer)).toBe(false);
    expect(canAccessProviderApp(providerViewer)).toBe(true);
    expect(canAccessProviderApp(dualRoleViewer)).toBe(true);
    expect(canAccessProviderApp(adminViewer)).toBe(true);

    expect(canAccessAdminApp(customerViewer)).toBe(false);
    expect(canAccessAdminApp(adminViewer)).toBe(true);

    expect(canAccessRoleSelection({ role: undefined, isAdmin: false })).toBe(true);
    expect(canAccessRoleSelection({ role: 'customer', isAdmin: false })).toBe(false);
    expect(canAccessRoleSelection({ role: undefined, isAdmin: true })).toBe(false);

    expect(getAvailableRoleExperiences(customerViewer)).toEqual(['customer']);
    expect(getAvailableRoleExperiences(providerViewer)).toEqual(['provider']);
    expect(getAvailableRoleExperiences(dualRoleViewer)).toEqual(['customer', 'provider']);
  });

  it('provides readable provider status labels and attention flags', () => {
    expect(getProviderApplicationStatusLabel('draft')).toBe('Profile Draft');
    expect(getProviderApplicationStatusLabel('pending')).toBe('Pending Review');
    expect(needsProviderAttention('draft')).toBe(true);
    expect(needsProviderAttention('pending')).toBe(true);
    expect(needsProviderAttention('rejected')).toBe(true);
    expect(needsProviderAttention('approved')).toBe(false);
  });

  it('requires all provider consents before accepting registration', () => {
    const invalid = providerRegistrationSchema.safeParse({
      businessName: 'SparkFix',
      fullName: 'Test Provider',
      email: 'provider@example.com',
      phone: '+91 9999999999',
      city: 'Bengaluru',
      serviceArea: 'Koramangala and nearby areas',
      category: 'electrician',
      yearsExperience: 5,
      basePrice: 299,
      bio: 'Experienced electrician with strong residential troubleshooting and installation skills.',
      hasOwnTools: true,
      offersEmergencyServices: false,
      consentTerms: false,
      consentBackgroundCheck: true,
      consentDataProcessing: true,
    });

    expect(invalid.success).toBe(false);

    const valid = providerRegistrationSchema.safeParse({
      businessName: 'SparkFix',
      fullName: 'Test Provider',
      email: 'provider@example.com',
      phone: '+91 9999999999',
      city: 'Bengaluru',
      serviceArea: 'Koramangala and nearby areas',
      category: 'electrician',
      yearsExperience: 5,
      basePrice: 299,
      bio: 'Experienced electrician with strong residential troubleshooting and installation skills.',
      hasOwnTools: true,
      offersEmergencyServices: false,
      consentTerms: true,
      consentBackgroundCheck: true,
      consentDataProcessing: true,
    });

    expect(valid.success).toBe(true);
  });
});
