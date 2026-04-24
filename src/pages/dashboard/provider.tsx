import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, useUser, SignInButton } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle, XCircle, Clock, MapPin, Star,
  Wallet, Calendar, ChevronRight,
  BadgeCheck, Zap, Lock, ChevronDown, MessageSquare,
  ToggleLeft, ToggleRight, Camera, Edit3, Check,
  AlertCircle, BarChart2, User,
} from 'lucide-react';
import {
  mockJobRequests, mockEarnings, mockSchedule,
  mockProviderReviews, weeklyChartData, monthlyChartData,
  type JobRequest, type JobStatus, type ProviderReview,
} from '@/data/providerDashboard';
import { authApiFetch } from '@/lib/api-client';
import { providerCategoryLabels } from '@/lib/access';
import { useViewer } from '@/lib/useViewer';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'jobs' | 'schedule' | 'earnings' | 'reviews';
type JobFilter = 'pending' | 'accepted' | 'completed' | 'declined';
type EarningPeriod = 'weekly' | 'monthly';

// ─── Status config ────────────────────────────────────────────────────────────
const JOB_STATUS: Record<JobStatus, { label: string; color: string; bg: string }> = {
  pending:     { label: 'New Request', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  accepted:    { label: 'Accepted',    color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  in_progress: { label: 'In Progress', color: '#FF6B00', bg: 'rgba(255,107,0,0.12)' },
  completed:   { label: 'Completed',   color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  declined:    { label: 'Declined',    color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.06)' },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function BarChart({ data, color = '#FF6B00' }: { data: { label?: string; day?: string; amount: number }[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((d, i) => {
        const pct = (d.amount / max) * 100;
        const label = d.day || d.label || '';
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${pct}%` }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: 'easeOut' as const }}
              className="w-full rounded-t-md min-h-[3px]"
              style={{ background: pct > 0 ? color : 'rgba(255,255,255,0.06)' }}
            />
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Job Request Card ─────────────────────────────────────────────────────────
function JobCard({
  job,
  onAccept,
  onDecline,
}: {
  job: JobRequest;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = JOB_STATUS[job.status];
  const isPending = job.status === 'pending';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: isPending ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isPending ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      {isPending && (
        <div
          className="px-4 py-1.5 text-xs font-bold flex items-center gap-1.5"
          style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}
        >
          <AlertCircle className="w-3 h-3" /> New request — respond within 30 min
        </div>
      )}

      <div className="p-4 flex items-start gap-4">
        {/* Avatar */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black"
          style={{ background: 'rgba(255,107,0,0.12)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.2)' }}
        >
          {initials(job.residentName)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="text-sm font-bold text-white">{job.residentName}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{job.service}</p>
            </div>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              {cfg.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(job.date)} · {job.time}
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              <MapPin className="w-3.5 h-3.5" />
              {job.distance} away
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <p className="text-sm font-black" style={{ color: '#FF6B00' }}>
            ₹{job.total.toLocaleString('en-IN')}
          </p>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-lg"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 pt-3 flex flex-col gap-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-start gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#FF6B00' }} />
                {job.address}
              </div>

              {job.note && (
                <div
                  className="p-3 rounded-xl text-xs"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.55)',
                    borderLeft: '2px solid rgba(255,107,0,0.4)',
                  }}
                >
                  <span className="font-semibold text-white/60">Note: </span>
                  {job.note}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                <span className="font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(255,107,0,0.1)', color: '#FF6B00' }}>
                  {job.id}
                </span>
                <span>Job ID · Requested {new Date(job.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {isPending && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onAccept(job.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200"
                    style={{ background: '#10B981', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}
                  >
                    <CheckCircle className="w-4 h-4" /> Accept
                  </button>
                  <button
                    onClick={() => onDecline(job.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      color: 'rgba(239,68,68,0.8)',
                      border: '1px solid rgba(239,68,68,0.2)',
                    }}
                  >
                    <XCircle className="w-4 h-4" /> Decline
                  </button>
                </div>
              )}

              {job.status === 'accepted' && (
                <button
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200"
                  style={{ background: '#FF6B00', boxShadow: '0 4px 14px rgba(255,107,0,0.35)' }}
                >
                  <Zap className="w-4 h-4" /> Mark as In Progress
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────
function ReviewCard({ review }: { review: ProviderReview }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState(review.reply || '');
  const [saved, setSaved] = useState(!!review.reply);

  return (
    <div
      className="p-4 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black"
          style={{ background: 'rgba(255,107,0,0.12)', color: '#FF6B00' }}
        >
          {initials(review.residentName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="text-sm font-bold text-white">{review.residentName}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{review.service}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className="w-3 h-3"
                  style={{ fill: s <= review.rating ? '#FF6B00' : 'transparent', color: s <= review.rating ? '#FF6B00' : 'rgba(255,255,255,0.2)' }}
                />
              ))}
            </div>
          </div>
          <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>{review.text}</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{formatDate(review.date)}</p>

          {/* Reply */}
          {saved && replyText && !replyOpen && (
            <div
              className="mt-3 p-3 rounded-xl text-xs"
              style={{ background: 'rgba(255,107,0,0.07)', borderLeft: '2px solid rgba(255,107,0,0.3)', color: 'rgba(255,255,255,0.55)' }}
            >
              <span className="font-semibold" style={{ color: '#FF6B00' }}>Your reply: </span>
              {replyText}
            </div>
          )}

          <div className="flex items-center gap-2 mt-3">
            {!replyOpen && (
              <button
                onClick={() => setReplyOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                style={{ background: 'rgba(255,107,0,0.1)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.2)' }}
              >
                <MessageSquare className="w-3 h-3" />
                {saved && replyText ? 'Edit Reply' : 'Reply'}
              </button>
            )}
          </div>

          <AnimatePresence>
            {replyOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a professional reply..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none resize-none"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,107,0,0.35)',
                    color: 'white',
                  }}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => { setSaved(true); setReplyOpen(false); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
                    style={{ background: '#10B981' }}
                  >
                    <Check className="w-3 h-3" /> Save Reply
                  </button>
                  <button
                    onClick={() => setReplyOpen(false)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProviderDashboard() {
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const viewerQuery = useViewer();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [jobFilter, setJobFilter] = useState<JobFilter>('pending');
  const [jobs, setJobs] = useState(mockJobRequests);
  const [isAvailable, setIsAvailable] = useState(true);
  const [earningPeriod, setEarningPeriod] = useState<EarningPeriod>('weekly');
  const [selectedWeekDay, setSelectedWeekDay] = useState<string>('2026-04-06');

  // Derived
  const pendingJobs = jobs.filter((j) => j.status === 'pending');
  const acceptedJobs = jobs.filter((j) => j.status === 'accepted');
  const completedJobs = jobs.filter((j) => j.status === 'completed');
  const filteredJobs = jobs.filter((j) => j.status === jobFilter);

  const totalEarnings = mockEarnings.reduce((s, e) => s + e.amount, 0);
  const thisMonthEarnings = mockEarnings
    .filter((e) => e.date.startsWith('2026-04'))
    .reduce((s, e) => s + e.amount, 0);
  const avgRating = mockProviderReviews.reduce((s, r, _, a) => s + r.rating / a.length, 0);

  function handleAccept(id: string) {
    setJobs((prev) => prev.map((j) => j.id === id ? { ...j, status: 'accepted' as JobStatus } : j));
  }
  function handleDecline(id: string) {
    setJobs((prev) => prev.map((j) => j.id === id ? { ...j, status: 'declined' as JobStatus } : j));
  }

  // Schedule: unique dates
  const scheduleDates = [...new Set(mockSchedule.map((s) => s.date))];
  const daySlots = mockSchedule.filter((s) => s.date === selectedWeekDay);
  const providerProfileQuery = useQuery({
    queryKey: ['provider-profile-dashboard'],
    enabled: isSignedIn,
    queryFn: () =>
      authApiFetch<{
        profile: { category: string; status: string; reviewNotes: string | null } | null;
      }>('/provider/profile', getToken),
  });
  const providerProfile = providerProfileQuery.data?.profile;
  const applicationStatus = viewerQuery.data?.providerApplicationStatus;
  const providerCategory =
    providerProfile?.category && providerProfile.category in providerCategoryLabels
      ? providerCategoryLabels[providerProfile.category as keyof typeof providerCategoryLabels]
      : 'Provider';

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'jobs', label: 'Job Requests', badge: pendingJobs.length },
    { id: 'schedule', label: 'Schedule' },
    { id: 'earnings', label: 'Earnings' },
    { id: 'reviews', label: 'Reviews' },
  ];

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh' }}>
      <title>Provider Dashboard — NearFix</title>
      <meta name="description" content="Manage your NearFix provider account — jobs, earnings, schedule, and reviews." />

      <div className="pt-20 pb-32 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Auth gate ── */}
        {!isSignedIn && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 flex flex-col items-center text-center gap-6"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}
            >
              <Lock className="w-9 h-9" style={{ color: '#FF6B00' }} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                Provider Dashboard
              </h1>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Sign in to manage your jobs, earnings, and availability
              </p>
            </div>
            <SignInButton mode="modal">
              <button
                className="px-8 py-3.5 rounded-xl text-sm font-bold text-white"
                style={{ background: '#FF6B00', boxShadow: '0 6px 24px rgba(255,107,0,0.4)' }}
              >
                Sign In to Continue
              </button>
            </SignInButton>
          </motion.div>
        )}

        {isSignedIn && (
          <>
            {applicationStatus && applicationStatus !== 'approved' ? (
              <div
                className="mb-6 rounded-2xl p-4"
                style={{
                  background:
                    applicationStatus === 'rejected'
                      ? 'rgba(239,68,68,0.1)'
                      : 'rgba(245,158,11,0.1)',
                  border:
                    applicationStatus === 'rejected'
                      ? '1px solid rgba(239,68,68,0.2)'
                      : '1px solid rgba(245,158,11,0.2)',
                }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p
                      className="text-sm font-bold"
                      style={{
                        color:
                          applicationStatus === 'rejected'
                            ? '#FCA5A5'
                            : '#FCD34D',
                      }}
                    >
                      {applicationStatus === 'draft' && 'Complete your provider registration'}
                      {applicationStatus === 'pending' && 'Your provider application is under review'}
                      {applicationStatus === 'rejected' && 'Your provider application needs changes'}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      {applicationStatus === 'draft' && 'Submit your professional details and consents before you start operating as a provider.'}
                      {applicationStatus === 'pending' && 'You can still review your submitted details while admin approval is pending.'}
                      {applicationStatus === 'rejected' && (providerProfile?.reviewNotes || 'Open your provider profile, update the required details, and submit again.')}
                    </p>
                  </div>
                  <Link
                    to="/provider/register"
                    className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold text-white"
                    style={{ background: '#FF6B00', boxShadow: '0 6px 20px rgba(255,107,0,0.25)' }}
                  >
                    Open registration
                  </Link>
                </div>
              </div>
            ) : null}

            {/* ── Header ── */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start justify-between gap-4 mb-6 flex-wrap"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0"
                  style={{ border: '2px solid rgba(255,107,0,0.4)', boxShadow: '0 0 20px rgba(255,107,0,0.15)' }}
                >
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt={user.fullName || 'Provider'} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-xl font-black"
                      style={{ background: 'rgba(255,107,0,0.15)', color: '#FF6B00' }}
                    >
                      {(user?.firstName?.[0] || 'P').toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Provider Dashboard</p>
                  <h1 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {user?.firstName || 'Provider'}
                  </h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <BadgeCheck
                      className="w-3.5 h-3.5"
                      style={{ color: applicationStatus === 'approved' ? '#10B981' : '#F59E0B' }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: applicationStatus === 'approved' ? '#10B981' : '#F59E0B' }}
                    >
                      {applicationStatus === 'approved' ? 'Approved Provider' : 'Provider Onboarding'}
                    </span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{providerCategory}</span>
                  </div>
                </div>
              </div>

              {/* Availability toggle */}
              <button
                onClick={() => setIsAvailable(!isAvailable)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-300"
                style={{
                  background: isAvailable ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isAvailable ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                {isAvailable
                  ? <ToggleRight className="w-5 h-5" style={{ color: '#10B981' }} />
                  : <ToggleLeft className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                }
                <span
                  className="text-sm font-bold"
                  style={{ color: isAvailable ? '#10B981' : 'rgba(255,255,255,0.4)' }}
                >
                  {isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </button>
            </motion.div>

            {/* ── Stats row ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
            >
              {[
                { icon: AlertCircle, label: 'Pending Requests', value: pendingJobs.length, color: '#F59E0B', pulse: pendingJobs.length > 0 },
                { icon: CheckCircle, label: 'Jobs Completed', value: completedJobs.length, color: '#10B981', pulse: false },
                { icon: Wallet, label: 'This Month', value: `₹${thisMonthEarnings.toLocaleString('en-IN')}`, color: '#FF6B00', pulse: false },
                { icon: Star, label: 'Avg Rating', value: avgRating.toFixed(1), color: '#F59E0B', pulse: false },
              ].map(({ icon: Icon, label, value, color, pulse }) => (
                <div
                  key={label}
                  className="p-4 rounded-2xl relative overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  {pulse && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      style={{ background: `${color}08` }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `${color}18` }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <p className="text-lg font-black text-white" style={{ fontFamily: 'var(--font-heading)' }}>{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
                </div>
              ))}
            </motion.div>

            {/* ── Tabs ── */}
            <div
              className="flex items-center gap-1 p-1 rounded-2xl mb-6 overflow-x-auto"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap flex-1 justify-center relative"
                  style={{
                    background: activeTab === tab.id ? '#FF6B00' : 'transparent',
                    color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.45)',
                    boxShadow: activeTab === tab.id ? '0 4px 14px rgba(255,107,0,0.35)' : 'none',
                  }}
                >
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-black min-w-[18px] text-center"
                      style={{
                        background: activeTab === tab.id ? 'rgba(255,255,255,0.3)' : '#F59E0B',
                        color: 'white',
                      }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Tab Content ── */}
            <AnimatePresence mode="wait">

              {/* OVERVIEW */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-5"
                >
                  {/* Pending requests alert */}
                  {pendingJobs.length > 0 && (
                    <div
                      className="p-4 rounded-2xl flex items-center justify-between gap-4"
                      style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(245,158,11,0.15)' }}
                        >
                          <AlertCircle className="w-4.5 h-4.5" style={{ color: '#F59E0B' }} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">
                            {pendingJobs.length} new job request{pendingJobs.length > 1 ? 's' : ''} waiting
                          </p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            Respond quickly to maintain your response rate
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setActiveTab('jobs'); setJobFilter('pending'); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white flex-shrink-0"
                        style={{ background: '#F59E0B' }}
                      >
                        View <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-5">
                    {/* Earnings mini chart */}
                    <div
                      className="p-5 rounded-2xl"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-bold text-white">This Week</h3>
                        <span className="text-xs font-bold" style={{ color: '#FF6B00' }}>
                          ₹{weeklyChartData.reduce((s, d) => s + d.amount, 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Daily earnings</p>
                      <BarChart data={weeklyChartData} />
                    </div>

                    {/* Upcoming jobs */}
                    <div
                      className="p-5 rounded-2xl"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-white">Upcoming Jobs</h3>
                        <button
                          onClick={() => setActiveTab('jobs')}
                          className="text-xs font-semibold flex items-center gap-1"
                          style={{ color: '#FF6B00' }}
                        >
                          All <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex flex-col gap-3">
                        {acceptedJobs.slice(0, 3).map((job) => (
                          <div key={job.id} className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black"
                              style={{ background: 'rgba(255,107,0,0.12)', color: '#FF6B00' }}
                            >
                              {initials(job.residentName)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{job.residentName}</p>
                              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                {formatDate(job.date)} · {job.time}
                              </p>
                            </div>
                            <p className="text-xs font-bold flex-shrink-0" style={{ color: '#FF6B00' }}>
                              ₹{job.total.toLocaleString('en-IN')}
                            </p>
                          </div>
                        ))}
                        {acceptedJobs.length === 0 && (
                          <p className="text-xs text-center py-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            No upcoming jobs
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Performance metrics */}
                  <div
                    className="p-5 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <h3 className="text-sm font-bold text-white mb-4">Performance</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: 'Response Rate', value: '94%', color: '#10B981' },
                        { label: 'Completion Rate', value: '98%', color: '#3B82F6' },
                        { label: 'On-Time Rate', value: '91%', color: '#FF6B00' },
                        { label: 'Repeat Clients', value: '67%', color: '#8B5CF6' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="text-center">
                          <p className="text-2xl font-black" style={{ color, fontFamily: 'var(--font-heading)' }}>{value}</p>
                          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick links */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { icon: Camera, label: 'Upload Photos', color: '#8B5CF6' },
                      { icon: Edit3, label: 'Edit Services', color: '#3B82F6' },
                      { icon: BarChart2, label: 'View Analytics', color: '#10B981' },
                      { icon: User, label: 'Public Profile', href: '/provider/rajesh-kumar', color: '#FF6B00' },
                    ].map(({ icon: Icon, label, color, href }) => (
                      href ? (
                        <Link
                          key={label}
                          to={href}
                          className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                            <Icon className="w-4 h-4" style={{ color }} />
                          </div>
                          <span className="text-xs font-medium text-white text-center">{label}</span>
                        </Link>
                      ) : (
                        <button
                          key={label}
                          className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                            <Icon className="w-4 h-4" style={{ color }} />
                          </div>
                          <span className="text-xs font-medium text-white text-center">{label}</span>
                        </button>
                      )
                    ))}
                  </div>
                </motion.div>
              )}

              {/* JOB REQUESTS */}
              {activeTab === 'jobs' && (
                <motion.div
                  key="jobs"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4"
                >
                  {/* Filter chips */}
                  <div className="flex gap-2 flex-wrap">
                    {(['pending', 'accepted', 'completed', 'declined'] as JobFilter[]).map((f) => {
                      const count = jobs.filter((j) => j.status === f).length;
                      return (
                        <button
                          key={f}
                          onClick={() => setJobFilter(f)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 capitalize"
                          style={{
                            background: jobFilter === f ? JOB_STATUS[f].bg : 'rgba(255,255,255,0.05)',
                            color: jobFilter === f ? JOB_STATUS[f].color : 'rgba(255,255,255,0.4)',
                            border: `1px solid ${jobFilter === f ? JOB_STATUS[f].color + '40' : 'rgba(255,255,255,0.08)'}`,
                          }}
                        >
                          {JOB_STATUS[f].label}
                          <span
                            className="px-1.5 py-0.5 rounded-full text-[10px] font-black"
                            style={{ background: 'rgba(255,255,255,0.1)' }}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {filteredJobs.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center py-16 gap-3"
                      >
                        <Clock className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.15)' }} />
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          No {jobFilter} jobs
                        </p>
                      </motion.div>
                    ) : (
                      filteredJobs.map((job) => (
                        <JobCard key={job.id} job={job} onAccept={handleAccept} onDecline={handleDecline} />
                      ))
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* SCHEDULE */}
              {activeTab === 'schedule' && (
                <motion.div
                  key="schedule"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-5"
                >
                  {/* Day selector */}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {scheduleDates.map((date) => {
                      const d = new Date(date);
                      const isToday = date === '2026-04-06';
                      const active = date === selectedWeekDay;
                      const bookedCount = mockSchedule.filter((s) => s.date === date && !s.available).length;
                      return (
                        <button
                          key={date}
                          onClick={() => setSelectedWeekDay(date)}
                          className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl flex-shrink-0 transition-all duration-200 min-w-[64px]"
                          style={{
                            background: active ? '#FF6B00' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
                            boxShadow: active ? '0 4px 14px rgba(255,107,0,0.35)' : 'none',
                          }}
                        >
                          <span
                            className="text-[10px] font-semibold uppercase"
                            style={{ color: active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)' }}
                          >
                            {isToday ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' })}
                          </span>
                          <span
                            className="text-lg font-black"
                            style={{ color: active ? 'white' : 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-heading)' }}
                          >
                            {d.getDate()}
                          </span>
                          {bookedCount > 0 && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{
                                background: active ? 'rgba(255,255,255,0.25)' : 'rgba(255,107,0,0.2)',
                                color: active ? 'white' : '#FF6B00',
                              }}
                            >
                              {bookedCount} booked
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Time slots grid */}
                  <div
                    className="p-5 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white">
                        {new Date(selectedWeekDay).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </h3>
                      <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'rgba(16,185,129,0.5)' }} />
                          Free
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'rgba(255,107,0,0.5)' }} />
                          Booked
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {daySlots.map((slot) => (
                        <div
                          key={slot.time}
                          className="p-3 rounded-xl transition-all duration-200"
                          style={{
                            background: slot.available ? 'rgba(16,185,129,0.07)' : 'rgba(255,107,0,0.07)',
                            border: `1px solid ${slot.available ? 'rgba(16,185,129,0.2)' : 'rgba(255,107,0,0.2)'}`,
                          }}
                        >
                          <p
                            className="text-xs font-bold"
                            style={{ color: slot.available ? '#10B981' : '#FF6B00' }}
                          >
                            {slot.time}
                          </p>
                          {slot.available ? (
                            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Available</p>
                          ) : (
                            <>
                              <p className="text-[10px] mt-0.5 font-semibold text-white truncate">{slot.residentName}</p>
                              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }} >{slot.service}</p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* EARNINGS */}
              {activeTab === 'earnings' && (
                <motion.div
                  key="earnings"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-5"
                >
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Total Earned', value: `₹${totalEarnings.toLocaleString('en-IN')}`, color: '#FF6B00' },
                      { label: 'This Month', value: `₹${thisMonthEarnings.toLocaleString('en-IN')}`, color: '#10B981' },
                      { label: 'Avg per Job', value: `₹${Math.round(totalEarnings / mockEarnings.length).toLocaleString('en-IN')}`, color: '#3B82F6' },
                    ].map(({ label, value, color }) => (
                      <div
                        key={label}
                        className="p-4 rounded-2xl"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <p className="text-xl font-black" style={{ color, fontFamily: 'var(--font-heading)' }}>{value}</p>
                        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Chart */}
                  <div
                    className="p-5 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white">Earnings Chart</h3>
                      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {(['weekly', 'monthly'] as EarningPeriod[]).map((p) => (
                          <button
                            key={p}
                            onClick={() => setEarningPeriod(p)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all duration-200"
                            style={{
                              background: earningPeriod === p ? '#FF6B00' : 'transparent',
                              color: earningPeriod === p ? 'white' : 'rgba(255,255,255,0.4)',
                            }}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <BarChart
                      data={earningPeriod === 'weekly' ? weeklyChartData : monthlyChartData}
                      color="#FF6B00"
                    />
                  </div>

                  {/* Transaction history */}
                  <div
                    className="p-5 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <h3 className="text-sm font-bold text-white mb-4">Transaction History</h3>
                    <div className="flex flex-col gap-0">
                      {mockEarnings.map((entry, i) => (
                        <div
                          key={entry.jobId}
                          className="flex items-center gap-3 py-3"
                          style={{ borderBottom: i < mockEarnings.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black"
                            style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}
                          >
                            ₹
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{entry.residentName}</p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              {entry.service} · {formatDate(entry.date)}
                            </p>
                          </div>
                          <p className="text-sm font-black flex-shrink-0" style={{ color: '#10B981' }}>
                            +₹{entry.amount.toLocaleString('en-IN')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* REVIEWS */}
              {activeTab === 'reviews' && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-4"
                >
                  {/* Rating summary */}
                  <div
                    className="p-5 rounded-2xl flex items-center gap-6 flex-wrap"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="text-center">
                      <p className="text-5xl font-black" style={{ color: '#FF6B00', fontFamily: 'var(--font-heading)' }}>
                        {avgRating.toFixed(1)}
                      </p>
                      <div className="flex items-center gap-0.5 justify-center mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className="w-4 h-4"
                            style={{ fill: s <= Math.round(avgRating) ? '#FF6B00' : 'transparent', color: s <= Math.round(avgRating) ? '#FF6B00' : 'rgba(255,255,255,0.2)' }}
                          />
                        ))}
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {mockProviderReviews.length} reviews
                      </p>
                    </div>
                    <div className="flex-1 min-w-[160px] flex flex-col gap-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = mockProviderReviews.filter((r) => r.rating === star).length;
                        const pct = (count / mockProviderReviews.length) * 100;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-xs w-4 text-right" style={{ color: 'rgba(255,255,255,0.4)' }}>{star}</span>
                            <Star className="w-3 h-3 flex-shrink-0" style={{ fill: '#FF6B00', color: '#FF6B00' }} />
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="h-full rounded-full"
                                style={{ background: '#FF6B00' }}
                              />
                            </div>
                            <span className="text-xs w-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {mockProviderReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </motion.div>
              )}

            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
