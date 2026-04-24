import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeft, BadgeCheck, Briefcase, ClipboardCheck, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { authApiFetch } from '@/lib/api-client';
import {
  getSignedInHome,
  providerCategoryLabels,
  providerCategories,
  providerRegistrationSchema,
  type ProviderRegistrationInput,
} from '@/lib/access';
import { useViewer } from '@/lib/useViewer';

interface ProviderProfileResponse {
  profile: {
    businessName: string | null;
    fullName: string;
    email: string;
    phone: string;
    city: string;
    serviceArea: string;
    category: string;
    yearsExperience: number;
    basePrice: string;
    bio: string;
    hasOwnTools: boolean;
    offersEmergencyServices: boolean;
    consentTerms: boolean;
    consentBackgroundCheck: boolean;
    consentDataProcessing: boolean;
    status: string;
    reviewNotes: string | null;
  } | null;
  warning?: string | null;
}

const fieldClasses =
  'border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-[#FF6B00]';

export default function ProviderRegistrationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { user } = useUser();
  const viewerQuery = useViewer();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ['provider-profile'],
    enabled:
      viewerQuery.isSuccess &&
      (viewerQuery.data.isAdmin || viewerQuery.data.role === 'provider' || viewerQuery.data.canActAsBoth),
    queryFn: () => authApiFetch<ProviderProfileResponse>('/provider/profile', getToken),
  });

  const defaultValues = useMemo<ProviderRegistrationInput>(
    () => ({
      businessName: '',
      fullName: user?.fullName || '',
      email: user?.primaryEmailAddress?.emailAddress || '',
      phone: user?.primaryPhoneNumber?.phoneNumber || '',
      city: '',
      serviceArea: '',
      category: 'electrician',
      yearsExperience: 1,
      basePrice: 299,
      bio: '',
      hasOwnTools: true,
      offersEmergencyServices: false,
      consentTerms: false,
      consentBackgroundCheck: false,
      consentDataProcessing: false,
    }),
    [user]
  );

  const form = useForm<ProviderRegistrationInput>({
    resolver: zodResolver(providerRegistrationSchema),
    defaultValues,
  });

  useEffect(() => {
    const profile = profileQuery.data?.profile;
    if (!profile) {
      form.reset(defaultValues);
      return;
    }

    form.reset({
      businessName: profile.businessName || '',
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      city: profile.city,
      serviceArea: profile.serviceArea,
      category: (providerCategories.includes(profile.category as typeof providerCategories[number])
        ? profile.category
        : 'electrician') as ProviderRegistrationInput['category'],
      yearsExperience: profile.yearsExperience,
      basePrice: Number(profile.basePrice),
      bio: profile.bio,
      hasOwnTools: profile.hasOwnTools,
      offersEmergencyServices: profile.offersEmergencyServices,
      consentTerms: profile.consentTerms,
      consentBackgroundCheck: profile.consentBackgroundCheck,
      consentDataProcessing: profile.consentDataProcessing,
    });
  }, [defaultValues, form, profileQuery.data]);

  async function onSubmit(values: ProviderRegistrationInput) {
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      await authApiFetch('/provider/profile', getToken, {
        method: 'POST',
        body: JSON.stringify(values),
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['viewer'] }),
        queryClient.invalidateQueries({ queryKey: ['provider-profile'] }),
      ]);
      await user?.reload();

      setSubmitSuccess('Provider profile submitted. Your application is now pending admin review.');
      navigate('/dashboard/provider', { replace: true });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save provider profile');
    }
  }

  const providerStatus = viewerQuery.data?.providerApplicationStatus;
  const reviewNotes = profileQuery.data?.profile?.reviewNotes;
  const backHref = viewerQuery.data ? getSignedInHome(viewerQuery.data) : '/';
  const backLabel = viewerQuery.data?.isAdmin ? 'Back to admin home' : 'Back to dashboard';

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <Link
          to={backHref}
          className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-[#FF6B00]"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8"
          >
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">
                Provider Registration
              </p>
              <h1
                className="mt-3 text-3xl font-black text-white"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Complete your provider profile
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
                Tell NearFix who you are, what service you offer, and confirm the consents needed for provider onboarding.
              </p>
            </div>

            {providerStatus === 'pending' && (
              <div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                Your application is pending review. You can still edit and resubmit your details if needed.
              </div>
            )}

            {providerStatus === 'approved' && (
              <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                Your provider profile is approved. Updates will stay visible to admin and can be reviewed again if needed.
              </div>
            )}

            {providerStatus === 'rejected' && (
              <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
                Your last submission was rejected. Update the required fields and submit again.
                {reviewNotes ? <span className="block mt-2 text-red-50/90">Admin note: {reviewNotes}</span> : null}
              </div>
            )}

            {viewerQuery.data?.isAdmin ? (
              <div className="mb-5 rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4 text-sm text-sky-100">
                You are viewing this provider onboarding screen with admin access. Any edits here affect only your own
                provider profile metadata.
              </div>
            ) : null}

            {profileQuery.data?.warning ? (
              <div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                {profileQuery.data.warning}
              </div>
            ) : null}

            {submitError ? (
              <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
                {submitError}
              </div>
            ) : null}

            {submitSuccess ? (
              <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                {submitSuccess}
              </div>
            ) : null}

            <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Full name</label>
                  <Input className={fieldClasses} {...form.register('fullName')} />
                  <p className="text-xs text-red-300">{form.formState.errors.fullName?.message}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Business name (optional)</label>
                  <Input className={fieldClasses} {...form.register('businessName')} />
                  <p className="text-xs text-red-300">{form.formState.errors.businessName?.message}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Email</label>
                  <Input className={fieldClasses} type="email" {...form.register('email')} />
                  <p className="text-xs text-red-300">{form.formState.errors.email?.message}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Phone</label>
                  <Input className={fieldClasses} {...form.register('phone')} />
                  <p className="text-xs text-red-300">{form.formState.errors.phone?.message}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-white/70">City</label>
                  <Input className={fieldClasses} {...form.register('city')} />
                  <p className="text-xs text-red-300">{form.formState.errors.city?.message}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Service area</label>
                  <Input
                    className={fieldClasses}
                    placeholder="Example: Koramangala, HSR Layout, Indiranagar"
                    {...form.register('serviceArea')}
                  />
                  <p className="text-xs text-red-300">{form.formState.errors.serviceArea?.message}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-1">
                  <label className="text-sm text-white/70">Category</label>
                  <select
                    className={`h-10 w-full rounded-md border px-3 text-sm ${fieldClasses}`}
                    {...form.register('category')}
                  >
                    {providerCategories.map((category) => (
                      <option key={category} value={category} className="bg-[#111] text-white">
                        {providerCategoryLabels[category]}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-red-300">{form.formState.errors.category?.message}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Years of experience</label>
                  <Input className={fieldClasses} type="number" min={0} {...form.register('yearsExperience')} />
                  <p className="text-xs text-red-300">{form.formState.errors.yearsExperience?.message}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Base visit price (INR)</label>
                  <Input className={fieldClasses} type="number" min={0} {...form.register('basePrice')} />
                  <p className="text-xs text-red-300">{form.formState.errors.basePrice?.message}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/70">Short bio</label>
                <Textarea
                  className={`min-h-[140px] ${fieldClasses}`}
                  placeholder="Describe your experience, strengths, and what customers can expect."
                  {...form.register('bio')}
                />
                <p className="text-xs text-red-300">{form.formState.errors.bio?.message}</p>
              </div>

              <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <label className="flex items-start gap-3 text-sm text-white/75">
                  <Checkbox
                    checked={form.watch('hasOwnTools')}
                    onCheckedChange={(checked) => form.setValue('hasOwnTools', checked === true)}
                  />
                  <span>I bring my own tools and can complete standard jobs without extra equipment requests.</span>
                </label>
                <label className="flex items-start gap-3 text-sm text-white/75">
                  <Checkbox
                    checked={form.watch('offersEmergencyServices')}
                    onCheckedChange={(checked) => form.setValue('offersEmergencyServices', checked === true)}
                  />
                  <span>I am available for urgent or same-day service calls.</span>
                </label>
              </div>

              <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <label className="flex items-start gap-3 text-sm text-white/75">
                  <Checkbox
                    checked={form.watch('consentTerms')}
                    onCheckedChange={(checked) => form.setValue('consentTerms', checked === true)}
                  />
                  <span>I agree to NearFix provider terms, service standards, and fair-use policies.</span>
                </label>
                <p className="text-xs text-red-300">{form.formState.errors.consentTerms?.message}</p>

                <label className="flex items-start gap-3 text-sm text-white/75">
                  <Checkbox
                    checked={form.watch('consentBackgroundCheck')}
                    onCheckedChange={(checked) => form.setValue('consentBackgroundCheck', checked === true)}
                  />
                  <span>I consent to identity and background verification checks required for provider approval.</span>
                </label>
                <p className="text-xs text-red-300">{form.formState.errors.consentBackgroundCheck?.message}</p>

                <label className="flex items-start gap-3 text-sm text-white/75">
                  <Checkbox
                    checked={form.watch('consentDataProcessing')}
                    onCheckedChange={(checked) => form.setValue('consentDataProcessing', checked === true)}
                  />
                  <span>I allow NearFix to store and process my provider profile data for operations, support, and review workflows.</span>
                </label>
                <p className="text-xs text-red-300">{form.formState.errors.consentDataProcessing?.message}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving...' : 'Submit provider profile'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => navigate('/dashboard/provider')}>
                  Go to provider dashboard
                </Button>
              </div>
            </form>
          </section>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF6B00]/15 text-[#FF6B00]">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">What happens next?</p>
                  <p className="text-xs text-white/55">A simple provider onboarding workflow</p>
                </div>
              </div>

              <div className="mt-5 space-y-4 text-sm text-white/70">
                <div className="flex gap-3">
                  <BadgeCheck className="mt-0.5 h-4 w-4 text-[#FF6B00]" />
                  <p>Submit your details with required consents.</p>
                </div>
                <div className="flex gap-3">
                  <ClipboardCheck className="mt-0.5 h-4 w-4 text-[#FF6B00]" />
                  <p>Admin reviews category, experience, service area, and compliance details.</p>
                </div>
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-[#FF6B00]" />
                  <p>Once approved, your provider account is ready for full provider workflows.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-sm font-semibold text-white">Current account status</p>
              <div className="mt-4 space-y-3 text-sm text-white/70">
                <div className="flex items-center justify-between">
                  <span>Role</span>
                  <span className="font-semibold text-white">{viewerQuery.data?.role ?? 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Application</span>
                  <span className="font-semibold text-white">{providerStatus ?? 'Draft'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Saved profile</span>
                  <span className="font-semibold text-white">
                    {profileQuery.data?.profile ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
