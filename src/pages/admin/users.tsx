import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Filter,
  Shield,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react';

import {
  AdminPageIntro,
  AdminSection,
  AdminStatusBadge,
  AdminSubnav,
  AdminSummaryCard,
} from '@/components/admin/AdminUI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApiFetch } from '@/lib/api-client';
import {
  appRoles,
  getProviderApplicationStatusLabel,
  getRoleLabel,
  needsProviderAttention,
  providerApplicationStatuses,
  type AppRole,
  type ProviderApplicationStatus,
} from '@/lib/access';

interface AdminUserRecord {
  userId: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: AppRole;
  isAdmin: boolean;
  canActAsBoth: boolean;
  providerApplicationStatus?: ProviderApplicationStatus;
  createdAt: string;
  providerProfile: {
    businessName: string | null;
    category: string;
    city: string;
    serviceArea: string;
    yearsExperience: number;
    status: ProviderApplicationStatus;
    reviewNotes: string | null;
  } | null;
}

interface AdminUsersResponse {
  users: AdminUserRecord[];
  summary: {
    totalUsers: number;
    customers: number;
    providers: number;
    admins: number;
    pendingProviderApprovals: number;
    needsReview: number;
    rejectedProviders: number;
    dualRoleEnabled: number;
  };
  warning?: string | null;
}

interface AdminSaveResponse {
  success: boolean;
  warning?: string | null;
}

type AdminUsersTab = 'needs-review' | 'providers' | 'customers' | 'admins' | 'all-users';
type RoleFilter = 'all' | AppRole | 'unassigned';
type StatusFilter = 'all' | ProviderApplicationStatus | 'none';
type DualRoleFilter = 'all' | 'enabled' | 'disabled';
type AdminAccountFilter = 'all' | 'admins' | 'non-admins';

const adminUsersTabs: Array<{ id: AdminUsersTab; label: string }> = [
  { id: 'needs-review', label: 'Needs Review' },
  { id: 'providers', label: 'Providers' },
  { id: 'customers', label: 'Customers' },
  { id: 'admins', label: 'Admins' },
  { id: 'all-users', label: 'All Users' },
];

function normalizeAdminUsersTab(value: string | null): AdminUsersTab {
  return adminUsersTabs.some((tab) => tab.id === value)
    ? (value as AdminUsersTab)
    : 'needs-review';
}

function getDisplayName(user: AdminUserRecord): string {
  return [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email || user.userId;
}

function getEffectiveProviderStatus(user: AdminUserRecord): ProviderApplicationStatus | undefined {
  return user.providerApplicationStatus ?? user.providerProfile?.status;
}

function getProviderStatusTone(status: ProviderApplicationStatus | undefined): 'default' | 'warning' | 'success' | 'danger' {
  switch (status) {
    case 'approved':
      return 'success';
    case 'draft':
    case 'pending':
      return 'warning';
    case 'rejected':
      return 'danger';
    default:
      return 'default';
  }
}

function getAttentionPriority(user: AdminUserRecord): number {
  const status = getEffectiveProviderStatus(user);

  if (user.role === 'provider') {
    if (status === 'pending') return 0;
    if (status === 'draft') return 1;
    if (status === 'rejected') return 2;
    if (status === 'approved') return 3;
  }

  if (user.isAdmin) return 4;
  if (user.role === 'customer') return 5;
  if (!user.role) return 6;
  return 7;
}

function matchesTab(user: AdminUserRecord, tab: AdminUsersTab): boolean {
  const status = getEffectiveProviderStatus(user);

  switch (tab) {
    case 'needs-review':
      return user.role === 'provider' && needsProviderAttention(status);
    case 'providers':
      return user.role === 'provider';
    case 'customers':
      return user.role === 'customer';
    case 'admins':
      return user.isAdmin;
    case 'all-users':
    default:
      return true;
  }
}

function getSearchText(user: AdminUserRecord): string {
  const status = getEffectiveProviderStatus(user);

  return [
    getDisplayName(user),
    user.email,
    user.userId,
    user.role,
    user.role ? getRoleLabel(user.role) : 'No role',
    user.isAdmin ? 'Admin' : '',
    status ? getProviderApplicationStatusLabel(status) : 'No provider status',
    user.providerProfile?.businessName,
    user.providerProfile?.category,
    user.providerProfile?.city,
    user.providerProfile?.serviceArea,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function buildChangeSummary({
  user,
  role,
  providerStatus,
  canActAsBoth,
}: {
  user: AdminUserRecord;
  role: AppRole | '';
  providerStatus: ProviderApplicationStatus | '';
  canActAsBoth: boolean;
}): string[] {
  const roleLabel = role ? getRoleLabel(role) : 'No app role';
  const providerLabel = providerStatus ? getProviderApplicationStatusLabel(providerStatus) : 'No provider status';

  return [
    `Role after save: ${roleLabel}.`,
    `Provider approval after save: ${providerLabel}.`,
    canActAsBoth
      ? 'Dual-role access stays enabled, so this account can use both customer and provider areas where allowed.'
      : 'Dual-role access stays disabled, so this account follows its primary app role only.',
    user.isAdmin
      ? 'This person keeps admin access until Clerk private metadata is changed outside this page.'
      : 'Admin access is not granted from this page.',
    role === 'customer'
      ? 'Saving as Customer removes provider approval metadata from the NearFix account state.'
      : 'Provider approval changes affect the provider onboarding workflow.',
  ];
}

function getEmptyMessage(tab: AdminUsersTab): string {
  switch (tab) {
    case 'needs-review':
      return 'No provider accounts currently need review.';
    case 'providers':
      return 'No provider accounts matched these filters.';
    case 'customers':
      return 'No customer accounts matched these filters.';
    case 'admins':
      return 'No admin accounts matched these filters.';
    case 'all-users':
    default:
      return 'No users matched the current filters.';
  }
}

function AdminUserCard({
  user,
  onSave,
  isSaving,
}: {
  user: AdminUserRecord;
  onSave: (payload: {
    userId: string;
    role?: AppRole;
    providerApplicationStatus?: ProviderApplicationStatus | null;
    canActAsBoth?: boolean;
    reviewNotes?: string;
  }) => Promise<AdminSaveResponse>;
  isSaving: boolean;
}) {
  const [role, setRole] = useState<AppRole | ''>(user.role ?? '');
  const [providerStatus, setProviderStatus] = useState<ProviderApplicationStatus | ''>(
    getEffectiveProviderStatus(user) ?? ''
  );
  const [canActAsBoth, setCanActAsBoth] = useState(user.canActAsBoth);
  const [reviewNotes, setReviewNotes] = useState(user.providerProfile?.reviewNotes ?? '');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);

  useEffect(() => {
    setRole(user.role ?? '');
    setProviderStatus(getEffectiveProviderStatus(user) ?? '');
    setCanActAsBoth(user.canActAsBoth);
    setReviewNotes(user.providerProfile?.reviewNotes ?? '');
    setSaveError(null);
    setSaveSuccess(null);
    setSaveWarning(null);
  }, [user]);

  function clearFeedback() {
    setSaveError(null);
    setSaveSuccess(null);
    setSaveWarning(null);
  }

  const displayName = getDisplayName(user);
  const currentProviderStatus = getEffectiveProviderStatus(user);
  const attentionTone =
    user.role === 'provider' && needsProviderAttention(currentProviderStatus)
      ? currentProviderStatus === 'rejected'
        ? 'danger'
        : 'warning'
      : 'default';
  const changeSummary = buildChangeSummary({ user, role, providerStatus, canActAsBoth });

  async function handleSave() {
    setSaveError(null);
    setSaveSuccess(null);
    setSaveWarning(null);

    try {
      const result = await onSave({
        userId: user.userId,
        role: role || undefined,
        providerApplicationStatus: providerStatus || null,
        canActAsBoth,
        reviewNotes,
      });
      setSaveSuccess('Saved successfully. The latest account settings are now reflected in the admin workspace.');
      setSaveWarning(result.warning ?? null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to update user');
    }
  }

  return (
    <div
      className={`rounded-3xl border p-5 ${
        attentionTone === 'warning'
          ? 'border-amber-400/20 bg-amber-400/10'
          : attentionTone === 'danger'
            ? 'border-red-400/20 bg-red-400/10'
            : 'border-white/10 bg-white/[0.04]'
      }`}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-base font-bold text-white">{displayName}</p>
          <p className="text-sm text-white/55">{user.email ?? 'No email available'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <AdminStatusBadge label={`Joined ${new Date(user.createdAt).toLocaleDateString('en-IN')}`} />
            <AdminStatusBadge label={role ? getRoleLabel(role) : 'No app role'} tone={role ? 'info' : 'default'} />
            {currentProviderStatus ? (
              <AdminStatusBadge
                label={getProviderApplicationStatusLabel(currentProviderStatus)}
                tone={getProviderStatusTone(currentProviderStatus)}
              />
            ) : null}
            {canActAsBoth ? <AdminStatusBadge label="Dual-role enabled" tone="info" /> : null}
            {user.isAdmin ? <AdminStatusBadge label="Admin" tone="success" /> : null}
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/65">
              ID {user.userId}
            </span>
          </div>
        </div>

        <div className="max-w-md rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF6B00]">
            What this save changes
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-white/65">
            {changeSummary.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-bold text-white">Identity</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">Display Name</p>
              <p className="mt-2 text-sm text-white">{displayName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">Email</p>
              <p className="mt-2 text-sm text-white">{user.email ?? 'No email on file'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">User ID</p>
              <p className="mt-2 break-all text-sm text-white/75">{user.userId}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">Needs attention</p>
              <p className="mt-2 text-sm text-white/75">
                {user.role === 'provider' && needsProviderAttention(currentProviderStatus)
                  ? currentProviderStatus === 'rejected'
                    ? 'Provider needs follow-up before resubmission.'
                    : 'Provider is still waiting for onboarding review.'
                  : 'No urgent admin action on this account.'}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-bold text-white">Access controls</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-xs text-white/55">
              App role
              <select
                value={role}
                onChange={(event) => {
                  clearFeedback();
                  setRole(event.target.value as AppRole | '');
                }}
                className="mt-1 h-10 w-full rounded-md border border-white/10 bg-white/[0.05] px-3 text-sm text-white"
              >
                <option value="" className="bg-[#111]">No role</option>
                {appRoles.map((value) => (
                  <option key={value} value={value} className="bg-[#111]">
                    {getRoleLabel(value)}
                  </option>
                ))}
              </select>
              <span className="mt-2 block text-[11px] leading-5 text-white/40">
                Customer opens the booking side. Provider opens registration and provider operations.
              </span>
            </label>

            <label className="text-xs text-white/55">
              Provider approval
              <select
                value={providerStatus}
                onChange={(event) => {
                  clearFeedback();
                  setProviderStatus(event.target.value as ProviderApplicationStatus | '');
                }}
                className="mt-1 h-10 w-full rounded-md border border-white/10 bg-white/[0.05] px-3 text-sm text-white"
              >
                <option value="" className="bg-[#111]">None</option>
                {providerApplicationStatuses.map((value) => (
                  <option key={value} value={value} className="bg-[#111]">
                    {getProviderApplicationStatusLabel(value)}
                  </option>
                ))}
              </select>
              <span className="mt-2 block text-[11px] leading-5 text-white/40">
                Use this for provider onboarding decisions. Setting the role to Customer clears provider approval metadata.
              </span>
            </label>

            <label className="text-xs text-white/55">
              Dual-role access
              <button
                type="button"
                onClick={() => {
                  clearFeedback();
                  setCanActAsBoth((current) => !current);
                }}
                className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-white/[0.05] px-3 text-sm text-white"
              >
                <span>{canActAsBoth ? 'Enabled' : 'Disabled'}</span>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    canActAsBoth ? 'bg-emerald-400' : 'bg-white/20'
                  }`}
                />
              </button>
              <span className="mt-2 block text-[11px] leading-5 text-white/40">
                Dual-role lets the account use both customer and provider experiences where allowed.
              </span>
            </label>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">Admin reminder</p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                {user.isAdmin
                  ? 'This person is already an admin. Admin privileges are not removed or granted from this page.'
                  : 'This page does not create admins. Use Clerk private metadata for admin access changes.'}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-bold text-white">Provider profile summary</p>
          {user.providerProfile ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">Business Name</p>
                <p className="mt-2 text-sm text-white">{user.providerProfile.businessName || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">Category</p>
                <p className="mt-2 text-sm text-white">{user.providerProfile.category}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">City</p>
                <p className="mt-2 text-sm text-white">{user.providerProfile.city}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">Service Area</p>
                <p className="mt-2 text-sm text-white">{user.providerProfile.serviceArea}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">Experience</p>
                <p className="mt-2 text-sm text-white">{user.providerProfile.yearsExperience} years</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">Profile Status</p>
                <div className="mt-2">
                  <AdminStatusBadge
                    label={getProviderApplicationStatusLabel(user.providerProfile.status)}
                    tone={getProviderStatusTone(user.providerProfile.status)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-white/55">
              No provider profile data is stored for this account yet. This is normal for customer-only or unassigned users.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-bold text-white">Review notes</p>
          <p className="mt-2 text-sm leading-6 text-white/55">
            Use short internal notes for provider reviews. Notes sync with the provider profile when a provider approval state is saved.
          </p>
          <label className="mt-4 block text-xs text-white/55">
            Admin review notes
            <textarea
              value={reviewNotes}
              onChange={(event) => {
                clearFeedback();
                setReviewNotes(event.target.value);
              }}
              className="mt-1 min-h-[128px] w-full rounded-md border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white placeholder:text-white/25"
              placeholder="Example: Missing service-area proof, asked user to update documents before approval."
            />
          </label>
        </section>
      </div>

      {saveError ? <p className="mt-4 text-sm text-red-300">{saveError}</p> : null}
      {saveSuccess ? <p className="mt-4 text-sm text-emerald-200">{saveSuccess}</p> : null}
      {saveWarning ? <p className="mt-4 text-sm text-amber-200">{saveWarning}</p> : null}

      <div className="mt-5 flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dualRoleFilter, setDualRoleFilter] = useState<DualRoleFilter>('all');
  const [adminAccountFilter, setAdminAccountFilter] = useState<AdminAccountFilter>('all');
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const activeTab = normalizeAdminUsersTab(searchParams.get('tab'));
  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => authApiFetch<AdminUsersResponse>('/admin/users', getToken),
  });

  const users = useMemo(() => usersQuery.data?.users ?? [], [usersQuery.data?.users]);
  const summary = usersQuery.data?.summary ?? {
    totalUsers: 0,
    customers: 0,
    providers: 0,
    admins: 0,
    pendingProviderApprovals: 0,
    needsReview: 0,
    rejectedProviders: 0,
    dualRoleEnabled: 0,
  };

  const tabCounts = useMemo(
    () => ({
      'needs-review': users.filter((user) => matchesTab(user, 'needs-review')).length,
      providers: users.filter((user) => matchesTab(user, 'providers')).length,
      customers: users.filter((user) => matchesTab(user, 'customers')).length,
      admins: users.filter((user) => matchesTab(user, 'admins')).length,
      'all-users': users.length,
    }),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...users]
      .filter((user) => matchesTab(user, activeTab))
      .filter((user) => {
        if (roleFilter === 'all') return true;
        if (roleFilter === 'unassigned') return !user.role;
        return user.role === roleFilter;
      })
      .filter((user) => {
        const status = getEffectiveProviderStatus(user);
        if (statusFilter === 'all') return true;
        if (statusFilter === 'none') return !status;
        return status === statusFilter;
      })
      .filter((user) => {
        if (dualRoleFilter === 'all') return true;
        return dualRoleFilter === 'enabled' ? user.canActAsBoth : !user.canActAsBoth;
      })
      .filter((user) => {
        if (adminAccountFilter === 'all') return true;
        return adminAccountFilter === 'admins' ? user.isAdmin : !user.isAdmin;
      })
      .filter((user) => (query ? getSearchText(user).includes(query) : true))
      .sort((left, right) => {
        const attentionDelta = getAttentionPriority(left) - getAttentionPriority(right);
        if (attentionDelta !== 0) return attentionDelta;
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });
  }, [activeTab, adminAccountFilter, dualRoleFilter, roleFilter, search, statusFilter, users]);

  const hasExtraFilters =
    search.trim().length > 0 ||
    roleFilter !== 'all' ||
    statusFilter !== 'all' ||
    dualRoleFilter !== 'all' ||
    adminAccountFilter !== 'all';

  async function saveUser(payload: {
    userId: string;
    role?: AppRole;
    providerApplicationStatus?: ProviderApplicationStatus | null;
    canActAsBoth?: boolean;
    reviewNotes?: string;
  }) {
    setSavingUserId(payload.userId);
    try {
      const response = await authApiFetch<AdminSaveResponse>('/admin/users/metadata', getToken, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-users-overview'] }),
      ]);
      return response;
    } finally {
      setSavingUserId(null);
    }
  }

  function setActiveTab(tab: AdminUsersTab) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', tab);
    setSearchParams(nextParams, { replace: true });
  }

  function clearFilters() {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setDualRoleFilter('all');
    setAdminAccountFilter('all');
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <AdminPageIntro
          eyebrow="Admin Control"
          title={activeTab === 'needs-review' ? 'Approvals and user triage' : 'Users and access control'}
          description="Review provider onboarding first, then manage roles, dual-role access, and account state from one clearer admin workspace."
        >
          <div className="flex flex-col gap-4">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-[#FF6B00]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to admin home
            </Link>
            <AdminSubnav
              links={[
                { label: 'Overview', href: '/admin' },
                { label: 'Approvals', href: '/admin/users?tab=needs-review', active: activeTab === 'needs-review' },
                { label: 'All Users', href: '/admin/users?tab=all-users', active: activeTab !== 'needs-review' },
                { label: 'Public Site', href: '/' },
              ]}
            />
          </div>
        </AdminPageIntro>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminSummaryCard
            label="Needs review"
            value={usersQuery.isLoading ? '...' : summary.needsReview}
            icon={CheckCircle2}
            tone="warning"
            hint="Draft, pending, and rejected provider accounts."
          />
          <AdminSummaryCard
            label="Providers"
            value={usersQuery.isLoading ? '...' : summary.providers}
            icon={UserCog}
            tone="info"
          />
          <AdminSummaryCard
            label="Dual-role enabled"
            value={usersQuery.isLoading ? '...' : summary.dualRoleEnabled}
            icon={Users}
          />
          <AdminSummaryCard
            label="Admins"
            value={usersQuery.isLoading ? '...' : summary.admins}
            icon={ShieldCheck}
          />
        </div>

        <div className="mt-8">
          <AdminSection
            id="workspace"
            title="User workspace"
            description="Use the triage tabs first, then narrow further with search and compact filters when you need something specific."
          >
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {adminUsersTabs.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? 'border-[#FF6B00]/30 bg-[#FF6B00]/12 text-[#FF6B00]'
                          : 'border-white/10 bg-black/20 text-white/70 hover:text-white'
                      }`}
                    >
                      {tab.label} ({tabCounts[tab.id]})
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]">
                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name, email, role, category, or user ID"
                    className="border-white/10 bg-white/[0.05] pl-9 text-white placeholder:text-white/30"
                  />
                </div>

                <label className="text-xs text-white/55">
                  App role
                  <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
                    className="mt-1 h-10 w-full rounded-md border border-white/10 bg-white/[0.05] px-3 text-sm text-white"
                  >
                    <option value="all" className="bg-[#111]">All roles</option>
                    <option value="customer" className="bg-[#111]">Customer</option>
                    <option value="provider" className="bg-[#111]">Provider</option>
                    <option value="unassigned" className="bg-[#111]">No role</option>
                  </select>
                </label>

                <label className="text-xs text-white/55">
                  Provider status
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                    className="mt-1 h-10 w-full rounded-md border border-white/10 bg-white/[0.05] px-3 text-sm text-white"
                  >
                    <option value="all" className="bg-[#111]">All statuses</option>
                    <option value="none" className="bg-[#111]">No status</option>
                    {providerApplicationStatuses.map((status) => (
                      <option key={status} value={status} className="bg-[#111]">
                        {getProviderApplicationStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs text-white/55">
                  Dual-role
                  <select
                    value={dualRoleFilter}
                    onChange={(event) => setDualRoleFilter(event.target.value as DualRoleFilter)}
                    className="mt-1 h-10 w-full rounded-md border border-white/10 bg-white/[0.05] px-3 text-sm text-white"
                  >
                    <option value="all" className="bg-[#111]">All</option>
                    <option value="enabled" className="bg-[#111]">Enabled</option>
                    <option value="disabled" className="bg-[#111]">Disabled</option>
                  </select>
                </label>

                <label className="text-xs text-white/55">
                  Admin accounts
                  <select
                    value={adminAccountFilter}
                    onChange={(event) => setAdminAccountFilter(event.target.value as AdminAccountFilter)}
                    className="mt-1 h-10 w-full rounded-md border border-white/10 bg-white/[0.05] px-3 text-sm text-white"
                  >
                    <option value="all" className="bg-[#111]">All</option>
                    <option value="admins" className="bg-[#111]">Admins only</option>
                    <option value="non-admins" className="bg-[#111]">Non-admins</option>
                  </select>
                </label>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-white/65">
                  Showing <span className="font-semibold text-white">{filteredUsers.length}</span> of{' '}
                  <span className="font-semibold text-white">{users.length}</span> accounts in{' '}
                  <span className="font-semibold text-white">
                    {adminUsersTabs.find((tab) => tab.id === activeTab)?.label}
                  </span>
                  .
                </div>
                {hasExtraFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/75 transition hover:text-white"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            </div>
          </AdminSection>
        </div>

        {usersQuery.data?.warning ? (
          <div className="mt-4 flex items-start gap-3 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>{usersQuery.data.warning}</p>
          </div>
        ) : null}

        <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/65">
          <div className="flex flex-wrap items-center gap-3">
            <Shield className="h-4 w-4 text-[#FF6B00]" />
            Admin privileges remain controlled by Clerk private metadata. This page focuses on operational account handling inside NearFix.
          </div>
        </div>

        <div className="mt-8 space-y-5">
          {usersQuery.isLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-white/60">
              Loading users...
            </div>
          ) : null}

          {usersQuery.isError ? (
            <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-6 text-red-100">
              {usersQuery.error instanceof Error
                ? usersQuery.error.message
                : 'Failed to load admin data'}
            </div>
          ) : null}

          {!usersQuery.isLoading && !usersQuery.isError && filteredUsers.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-white/60">
              {getEmptyMessage(activeTab)}
            </div>
          ) : null}

          {filteredUsers.map((user) => (
            <AdminUserCard
              key={user.userId}
              user={user}
              onSave={saveUser}
              isSaving={savingUserId === user.userId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
