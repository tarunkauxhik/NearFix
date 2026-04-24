import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  ClipboardList,
  Settings2,
  Shield,
  UserCog,
  Users,
} from 'lucide-react';

import {
  AdminPageIntro,
  AdminQuickAction,
  AdminSection,
  AdminStatusBadge,
  AdminSubnav,
  AdminSummaryCard,
} from '@/components/admin/AdminUI';
import { authApiFetch } from '@/lib/api-client';
import type { AppRole, ProviderApplicationStatus } from '@/lib/access';

interface AdminUserRecord {
  userId: string;
  role?: AppRole;
  isAdmin: boolean;
  providerApplicationStatus?: ProviderApplicationStatus;
}

interface AdminUsersResponse {
  users: AdminUserRecord[];
  summary: {
    totalUsers: number;
    customers: number;
    providers: number;
    admins: number;
    pendingProviderApprovals: number;
    rejectedProviders: number;
    dualRoleEnabled: number;
  };
  warning?: string | null;
}

export default function AdminHomePage() {
  const { getToken } = useAuth();
  const usersQuery = useQuery({
    queryKey: ['admin-users-overview'],
    queryFn: () => authApiFetch<AdminUsersResponse>('/admin/users', getToken),
  });

  const summary = usersQuery.data?.summary ?? {
    totalUsers: 0,
    customers: 0,
    providers: 0,
    admins: 0,
    pendingProviderApprovals: 0,
    rejectedProviders: 0,
    dualRoleEnabled: 0,
  };
  const hasAttentionItems =
    summary.pendingProviderApprovals > 0 || summary.rejectedProviders > 0 || Boolean(usersQuery.data?.warning);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-6 lg:px-8">
        <AdminPageIntro
          eyebrow="NearFix Admin"
          title="Admin control center"
          description="See what needs action, review provider onboarding, and manage NearFix account access from one clearer workspace."
        >
          <AdminSubnav
            links={[
              { label: 'Overview', href: '/admin', active: true },
              { label: 'Approvals', href: '/admin/users?tab=needs-review' },
              { label: 'All Users', href: '/admin/users?tab=all-users' },
              { label: 'Platform Notes', href: '/admin#platform-notes' },
            ]}
          />
        </AdminPageIntro>

        {usersQuery.isError ? (
          <div className="mt-8 rounded-3xl border border-red-300/20 bg-red-400/10 p-5 text-sm text-red-100">
            {usersQuery.error instanceof Error
              ? usersQuery.error.message
              : 'Unable to load the admin overview right now.'}
          </div>
        ) : null}

        <div className="mt-8 space-y-8">
          <AdminSection
            id="overview"
            title="Overview"
            description="A quick snapshot of platform usage and where administrators are currently spending time."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <AdminSummaryCard
                label="Total users"
                value={usersQuery.isLoading ? '...' : summary.totalUsers}
                icon={Users}
              />
              <AdminSummaryCard
                label="Customers"
                value={usersQuery.isLoading ? '...' : summary.customers}
                icon={CheckCircle2}
                tone="success"
              />
              <AdminSummaryCard
                label="Providers"
                value={usersQuery.isLoading ? '...' : summary.providers}
                icon={UserCog}
                tone="info"
              />
              <AdminSummaryCard
                label="Admins"
                value={usersQuery.isLoading ? '...' : summary.admins}
                icon={Shield}
                hint="Admin rights stay controlled by Clerk private metadata."
              />
            </div>
          </AdminSection>

          <AdminSection
            id="needs-attention"
            title="Needs Attention"
            description="Surface the work that is easiest to miss: onboarding reviews, rejected provider resubmissions, and platform setup warnings."
            action={
              <Link
                to="/admin/users?tab=needs-review"
                className="inline-flex items-center rounded-2xl border border-[#FF6B00]/30 bg-[#FF6B00]/12 px-4 py-2 text-sm font-semibold text-[#FF6B00] transition hover:bg-[#FF6B00]/18"
              >
                Open approvals
              </Link>
            }
          >
            {hasAttentionItems ? (
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-white">Pending provider approvals</p>
                    <AdminStatusBadge
                      label={`${summary.pendingProviderApprovals} open`}
                      tone={summary.pendingProviderApprovals > 0 ? 'warning' : 'default'}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/60">
                    Providers still in draft or pending review should be checked first so onboarding does not stall.
                  </p>
                </div>

                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-white">Rejected providers</p>
                    <AdminStatusBadge
                      label={`${summary.rejectedProviders} need follow-up`}
                      tone={summary.rejectedProviders > 0 ? 'danger' : 'default'}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/60">
                    These accounts need clearer notes or a resubmission check before they can become active providers.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-white">Platform setup</p>
                    <AdminStatusBadge
                      label={usersQuery.data?.warning ? 'Needs setup' : 'Healthy'}
                      tone={usersQuery.data?.warning ? 'warning' : 'success'}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/60">
                    {usersQuery.data?.warning ??
                      'Provider profile storage is available, so approvals can sync with richer provider details.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm text-emerald-100">
                No urgent admin items right now. Provider approvals are caught up and the platform configuration looks healthy.
              </div>
            )}
          </AdminSection>

          <AdminSection
            id="quick-actions"
            title="Quick Actions"
            description="Jump straight into the most common admin workflows without scanning the whole user directory."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <AdminQuickAction
                title="Review provider approvals"
                description="Open the triage view that groups draft, pending, and rejected provider accounts first."
                href="/admin/users?tab=needs-review"
              />
              <AdminQuickAction
                title="Open all users"
                description="Browse the full directory with search, role filters, and per-user edit panels."
                href="/admin/users?tab=all-users"
              />
              <AdminQuickAction
                title="Inspect provider app"
                description="See the current provider-facing dashboard and registration experience as users see it."
                href="/dashboard/provider"
              />
              <AdminQuickAction
                title="Inspect customer app"
                description="Review the booking and customer dashboard experience without leaving the admin workflow."
                href="/dashboard/customer"
              />
            </div>
          </AdminSection>

          <AdminSection
            id="platform-notes"
            title="How Admin Works"
            description="A short guide so this screen stays understandable for future operators, not just the person who built it."
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-5 w-5 text-[#FF6B00]" />
                  <p className="text-sm font-bold text-white">What you can change here</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/60">
                  Update user app roles, provider approval states, dual-role access, and internal review notes from the admin users workspace.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-[#FF6B00]" />
                  <p className="text-sm font-bold text-white">What still belongs in Clerk</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/60">
                  Admin privileges remain separate from the normal app role and should still be controlled by Clerk private metadata.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-3">
                  <Settings2 className="h-5 w-5 text-[#FF6B00]" />
                  <p className="text-sm font-bold text-white">Operational guidance</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/60">
                  Start with approvals, leave clear review notes for rejected providers, and watch warnings here if provider profile storage is not fully set up.
                </p>
              </div>
            </div>
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
