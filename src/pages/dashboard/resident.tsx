import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, useClerk, useUser, SignInButton } from '@clerk/clerk-react';
import {
  Calendar, Clock, MapPin, Star, ChevronRight,
  RotateCcw, Heart, User, Phone, Mail,
  Edit3, Check, BadgeCheck, Zap, TrendingUp,
  Package, Lock, ChevronDown, Download, Trash2, AlertTriangle,
} from 'lucide-react';
import { mockBookings, savedProviderIds, type ResidentBooking, type BookingStatus } from '@/data/residentBookings';
import { providers } from '@/data/providers';
import { authApiFetch, downloadJsonFile } from '@/lib/api-client';

type Tab = 'upcoming' | 'history' | 'saved' | 'profile';

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  upcoming:    { label: 'Upcoming',    color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  in_progress: { label: 'In Progress', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  completed:   { label: 'Completed',   color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  cancelled:   { label: 'Cancelled',   color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.06)' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          style={{
            width: size, height: size,
            fill: s <= rating ? '#FF6B00' : 'transparent',
            color: s <= rating ? '#FF6B00' : 'rgba(255,255,255,0.2)',
          }}
        />
      ))}
    </div>
  );
}

function BookingCard({ booking, onRebook }: { booking: ResidentBooking; onRebook: (b: ResidentBooking) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[booking.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Main row */}
      <div className="p-4 flex items-start gap-4">
        {/* Provider photo */}
        <div
          className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
          style={{ border: '1px solid rgba(255,107,0,0.25)' }}
        >
          <img
            src={booking.providerPhoto}
            alt={booking.providerName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.providerName)}&background=1a1a1a&color=FF6B00&size=48&bold=true`;
            }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="text-sm font-bold text-white">{booking.providerName}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {booking.service} · {booking.category}
              </p>
            </div>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              {cfg.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(booking.date)}
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              <Clock className="w-3.5 h-3.5" />
              {booking.time}
            </div>
          </div>

          {/* Rating if completed */}
          {booking.status === 'completed' && booking.rating && (
            <div className="mt-2">
              <StarRow rating={booking.rating} size={12} />
            </div>
          )}
        </div>

        {/* Price + expand */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <p className="text-sm font-bold" style={{ color: '#FF6B00' }}>
            ₹{booking.total.toLocaleString('en-IN')}
          </p>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-lg transition-all duration-200"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Expanded details */}
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
                {booking.address}
              </div>

              <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                <span className="font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(255,107,0,0.1)', color: '#FF6B00' }}>
                  {booking.id}
                </span>
                <span>Booking ID</span>
              </div>

              {booking.review && (
                <div
                  className="p-3 rounded-xl text-xs italic"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)', borderLeft: '2px solid rgba(255,107,0,0.4)' }}
                >
                  "{booking.review}"
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {booking.status === 'upcoming' && (
                  <>
                    <Link
                      to={`/provider/${booking.providerId}`}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                      style={{ background: 'rgba(255,107,0,0.1)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.2)' }}
                    >
                      View Provider <ChevronRight className="w-3 h-3" />
                    </Link>
                    <button
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      Cancel Booking
                    </button>
                  </>
                )}
                {booking.canRebook && (
                  <button
                    onClick={() => onRebook(booking)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                    style={{ background: 'rgba(255,107,0,0.1)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.2)' }}
                  >
                    <RotateCcw className="w-3 h-3" /> Rebook
                  </button>
                )}
                {booking.status === 'completed' && !booking.rating && (
                  <button
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                    style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}
                  >
                    <Star className="w-3 h-3" /> Rate Service
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ResidentDashboard() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const { isSignedIn, user } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [savedIds, setSavedIds] = useState<string[]>(savedProviderIds);
  const [editingProfile, setEditingProfile] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountActionError, setAccountActionError] = useState<string | null>(null);
  const [accountActionSuccess, setAccountActionSuccess] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: user?.fullName || 'Arjun Sharma',
    phone: '+91 98765 43210',
    email: user?.primaryEmailAddress?.emailAddress || 'arjun.sharma@gmail.com',
    address: 'Flat 4B, Prestige Towers, Koramangala, Bengaluru 560034',
    language: 'English, Hindi',
  });

  const upcomingBookings = mockBookings.filter((b) => b.status === 'upcoming' || b.status === 'in_progress');
  const historyBookings = mockBookings.filter((b) => b.status === 'completed' || b.status === 'cancelled');
  const savedProviders = providers.filter((p) => savedIds.includes(p.id));

  const totalSpent = mockBookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + b.total, 0);
  const completedCount = mockBookings.filter((b) => b.status === 'completed').length;
  const avgRating = mockBookings
    .filter((b) => b.status === 'completed' && b.rating)
    .reduce((sum, b, _, arr) => sum + (b.rating || 0) / arr.length, 0);

  function handleRebook(booking: ResidentBooking) {
    window.location.href = `/provider/${booking.providerId}`;
  }

  function toggleSave(id: string) {
    setSavedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function handleDownloadMyData() {
    setAccountActionError(null);
    setAccountActionSuccess(null);
    setIsExportingData(true);

    try {
      const response = await authApiFetch<{ fileName: string; payload: unknown }>(
        '/account/export',
        getToken
      );

      downloadJsonFile(response.fileName, response.payload);
      setAccountActionSuccess('Your NearFix account data has been downloaded.');
    } catch (error) {
      setAccountActionError(
        error instanceof Error ? error.message : 'Unable to download your account data.'
      );
    } finally {
      setIsExportingData(false);
    }
  }

  async function handleDeleteAccount() {
    setAccountActionError(null);
    setAccountActionSuccess(null);
    setIsDeletingAccount(true);

    try {
      await authApiFetch('/account/delete', getToken, {
        method: 'POST',
      });

      setAccountActionSuccess('Your account has been deleted. Signing you out...');
      setShowDeleteConfirm(false);

      try {
        await signOut({ redirectUrl: '/' });
      } catch {
        navigate('/');
      }
    } catch (error) {
      setAccountActionError(
        error instanceof Error ? error.message : 'Unable to delete your account right now.'
      );
    } finally {
      setIsDeletingAccount(false);
    }
  }

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: 'upcoming', label: 'Upcoming', count: upcomingBookings.length },
    { id: 'history', label: 'History', count: historyBookings.length },
    { id: 'saved', label: 'Saved', count: savedProviders.length },
    { id: 'profile', label: 'Profile' },
  ];

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh' }}>
      <title>My Dashboard — NearFix</title>
      <meta name="description" content="Manage your NearFix bookings, saved providers, and profile." />

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
                Sign in to view your dashboard
              </h1>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Track bookings, manage saved providers, and update your profile
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
            {/* ── Header ── */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start justify-between gap-4 mb-8 flex-wrap"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0"
                  style={{ border: '2px solid rgba(255,107,0,0.4)', boxShadow: '0 0 20px rgba(255,107,0,0.15)' }}
                >
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt={user.fullName || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-xl font-black"
                      style={{ background: 'rgba(255,107,0,0.15)', color: '#FF6B00' }}
                    >
                      {(user?.firstName?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Welcome back</p>
                  <h1 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {user?.firstName || 'Resident'}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <BadgeCheck className="w-3.5 h-3.5" style={{ color: '#10B981' }} />
                    <span className="text-xs" style={{ color: '#10B981' }}>Verified Resident</span>
                  </div>
                </div>
              </div>

              <Link
                to="/services"
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-all duration-200"
                style={{ background: '#FF6B00', boxShadow: '0 4px 16px rgba(255,107,0,0.35)' }}
              >
                <Zap className="w-4 h-4" /> Book a Service
              </Link>
            </motion.div>

            {/* ── Stats row ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
            >
              {[
                { icon: Package, label: 'Total Bookings', value: mockBookings.length, color: '#3B82F6' },
                { icon: Check, label: 'Completed', value: completedCount, color: '#10B981' },
                { icon: TrendingUp, label: 'Total Spent', value: `₹${totalSpent.toLocaleString('en-IN')}`, color: '#FF6B00' },
                { icon: Star, label: 'Avg Rating Given', value: avgRating.toFixed(1), color: '#F59E0B' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div
                  key={label}
                  className="p-4 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
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
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap flex-1 justify-center"
                  style={{
                    background: activeTab === tab.id ? '#FF6B00' : 'transparent',
                    color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.45)',
                    boxShadow: activeTab === tab.id ? '0 4px 14px rgba(255,107,0,0.35)' : 'none',
                  }}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                      style={{
                        background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                        color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Tab Content ── */}
            <AnimatePresence mode="wait">

              {/* UPCOMING */}
              {activeTab === 'upcoming' && (
                <motion.div
                  key="upcoming"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-3"
                >
                  {upcomingBookings.length === 0 ? (
                    <EmptyState
                      icon={Calendar}
                      title="No upcoming bookings"
                      sub="Book a service to get started"
                      cta="Browse Services"
                      ctaHref="/"
                    />
                  ) : (
                    upcomingBookings.map((b) => (
                      <BookingCard key={b.id} booking={b} onRebook={handleRebook} />
                    ))
                  )}
                </motion.div>
              )}

              {/* HISTORY */}
              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-3"
                >
                  {historyBookings.length === 0 ? (
                    <EmptyState
                      icon={Clock}
                      title="No booking history yet"
                      sub="Your completed and cancelled bookings will appear here"
                      cta="Book a Service"
                      ctaHref="/"
                    />
                  ) : (
                    historyBookings.map((b) => (
                      <BookingCard key={b.id} booking={b} onRebook={handleRebook} />
                    ))
                  )}
                </motion.div>
              )}

              {/* SAVED PROVIDERS */}
              {activeTab === 'saved' && (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {savedProviders.length === 0 ? (
                    <EmptyState
                      icon={Heart}
                      title="No saved providers"
                      sub="Tap the heart icon on any provider card to save them here"
                      cta="Explore Providers"
                      ctaHref="/"
                    />
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {savedProviders.map((p, i) => (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="p-4 rounded-2xl"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                              style={{ border: '1px solid rgba(255,107,0,0.25)' }}
                            >
                              <img
                                src={p.photo}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=1a1a1a&color=FF6B00&size=48&bold=true`;
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-bold text-white">{p.name}</p>
                                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                    {p.service} · {p.location}
                                  </p>
                                </div>
                                <button
                                  onClick={() => toggleSave(p.id)}
                                  className="p-1.5 rounded-lg transition-all duration-200 flex-shrink-0"
                                  style={{ color: '#FF6B00' }}
                                >
                                  <Heart className="w-4 h-4" style={{ fill: '#FF6B00' }} />
                                </button>
                              </div>
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3" style={{ fill: '#FF6B00', color: '#FF6B00' }} />
                                  <span className="text-xs font-semibold text-white">{p.rating}</span>
                                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>({p.reviews})</span>
                                </div>
                                <span
                                  className="text-xs px-2 py-0.5 rounded-full"
                                  style={{
                                    background: p.availability === 'now' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)',
                                    color: p.availability === 'now' ? '#10B981' : '#3B82F6',
                                  }}
                                >
                                  {p.availabilityLabel}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Link
                              to={`/provider/${p.id}`}
                              className="flex-1 py-2 rounded-xl text-xs font-semibold text-center transition-all duration-200"
                              style={{ background: 'rgba(255,107,0,0.1)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.2)' }}
                            >
                              View Profile
                            </Link>
                            <Link
                              to={`/provider/${p.id}`}
                              className="flex-1 py-2 rounded-xl text-xs font-semibold text-center transition-all duration-200 text-white"
                              style={{ background: '#FF6B00', boxShadow: '0 3px 10px rgba(255,107,0,0.3)' }}
                            >
                              Book Now
                            </Link>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* PROFILE */}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-5"
                >
                  {/* Profile card */}
                  <div
                    className="p-5 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-sm font-bold text-white">Personal Information</h2>
                      <button
                        onClick={() => setEditingProfile(!editingProfile)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                        style={{
                          background: editingProfile ? 'rgba(16,185,129,0.1)' : 'rgba(255,107,0,0.1)',
                          color: editingProfile ? '#10B981' : '#FF6B00',
                          border: `1px solid ${editingProfile ? 'rgba(16,185,129,0.2)' : 'rgba(255,107,0,0.2)'}`,
                        }}
                      >
                        {editingProfile ? <><Check className="w-3 h-3" /> Save</> : <><Edit3 className="w-3 h-3" /> Edit</>}
                      </button>
                    </div>

                    <div className="flex flex-col gap-4">
                      {[
                        { icon: User, label: 'Full Name', key: 'name' as const, type: 'text' },
                        { icon: Phone, label: 'Phone Number', key: 'phone' as const, type: 'tel' },
                        { icon: Mail, label: 'Email Address', key: 'email' as const, type: 'email' },
                        { icon: MapPin, label: 'Default Address', key: 'address' as const, type: 'text' },
                      ].map(({ icon: Icon, label, key, type }) => (
                        <div key={key} className="flex items-start gap-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: 'rgba(255,107,0,0.1)' }}
                          >
                            <Icon className="w-3.5 h-3.5" style={{ color: '#FF6B00' }} />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
                            {editingProfile ? (
                              <input
                                type={type}
                                value={profileForm[key]}
                                onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none transition-all duration-200"
                                style={{
                                  background: 'rgba(255,255,255,0.06)',
                                  border: '1px solid rgba(255,107,0,0.4)',
                                }}
                              />
                            ) : (
                              <p className="text-sm text-white">{profileForm[key]}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preferences */}
                  <div
                    className="p-5 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <h2 className="text-sm font-bold text-white mb-4">Preferences</h2>
                    <div className="flex flex-col gap-4">
                      {[
                        { label: 'Booking Reminders', sub: 'Get notified 1 hour before service', enabled: true },
                        { label: 'Promotional Offers', sub: 'Deals and discounts from NearFix', enabled: false },
                        { label: 'Provider Updates', sub: 'When a saved provider is available', enabled: true },
                        { label: 'SMS Notifications', sub: 'Booking confirmations via SMS', enabled: true },
                      ].map(({ label, sub, enabled: defaultEnabled }) => (
                        <ToggleRow key={label} label={label} sub={sub} defaultEnabled={defaultEnabled} />
                      ))}
                    </div>
                  </div>

                  {/* Danger zone */}
                  <div
                    className="p-5 rounded-2xl"
                    style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}
                  >
                    <h2 className="text-sm font-bold mb-4" style={{ color: 'rgba(239,68,68,0.8)' }}>Account</h2>
                    {(accountActionError || accountActionSuccess) && (
                      <div
                        className="mb-4 p-3 rounded-xl text-xs"
                        style={{
                          background: accountActionError
                            ? 'rgba(239,68,68,0.08)'
                            : 'rgba(16,185,129,0.08)',
                          color: accountActionError ? 'rgba(239,68,68,0.85)' : '#10B981',
                          border: accountActionError
                            ? '1px solid rgba(239,68,68,0.18)'
                            : '1px solid rgba(16,185,129,0.18)',
                        }}
                      >
                        {accountActionError || accountActionSuccess}
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleDownloadMyData}
                        disabled={isExportingData || isDeletingAccount}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-left px-4 transition-all duration-200"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          color: 'rgba(255,255,255,0.7)',
                          opacity: isExportingData || isDeletingAccount ? 0.6 : 1,
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          {isExportingData ? 'Preparing your download...' : 'Download My Data'}
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm((current) => !current);
                          setAccountActionError(null);
                          setAccountActionSuccess(null);
                        }}
                        disabled={isDeletingAccount || isExportingData}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold text-left px-4 transition-all duration-200"
                        style={{
                          background: 'rgba(239,68,68,0.08)',
                          color: 'rgba(239,68,68,0.7)',
                          opacity: isDeletingAccount || isExportingData ? 0.6 : 1,
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          Delete Account
                        </span>
                      </button>
                      {showDeleteConfirm && (
                        <div
                          className="mt-2 rounded-2xl p-4"
                          style={{
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.18)',
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <AlertTriangle
                              className="w-4 h-4 flex-shrink-0 mt-0.5"
                              style={{ color: 'rgba(239,68,68,0.8)' }}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-white">Delete your account permanently?</p>
                              <p
                                className="text-xs mt-1 leading-relaxed"
                                style={{ color: 'rgba(255,255,255,0.55)' }}
                              >
                                This removes your NearFix account data, profile records, saved providers,
                                and any stored booking history tied to this user. This action cannot be undone.
                              </p>
                              <div className="flex gap-2 mt-4">
                                <button
                                  onClick={handleDeleteAccount}
                                  disabled={isDeletingAccount}
                                  className="px-4 py-2 rounded-xl text-xs font-bold text-white"
                                  style={{
                                    background: '#EF4444',
                                    boxShadow: '0 4px 16px rgba(239,68,68,0.25)',
                                    opacity: isDeletingAccount ? 0.7 : 1,
                                  }}
                                >
                                  {isDeletingAccount ? 'Deleting account...' : 'Yes, delete it'}
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(false)}
                                  disabled={isDeletingAccount}
                                  className="px-4 py-2 rounded-xl text-xs font-semibold"
                                  style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: 'rgba(255,255,255,0.6)',
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

// ── Helper components ──

function EmptyState({
  icon: Icon, title, sub, cta, ctaHref,
}: {
  icon: typeof Calendar;
  title: string;
  sub: string;
  cta: string;
  ctaHref: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center py-16 gap-4"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.15)' }}
      >
        <Icon className="w-7 h-7" style={{ color: '#FF6B00' }} />
      </div>
      <div>
        <p className="text-base font-bold text-white mb-1">{title}</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</p>
      </div>
      <Link
        to={ctaHref}
        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200"
        style={{ background: '#FF6B00', boxShadow: '0 4px 16px rgba(255,107,0,0.35)' }}
      >
        {cta}
      </Link>
    </motion.div>
  );
}

function ToggleRow({ label, sub, defaultEnabled }: { label: string; sub: string; defaultEnabled: boolean }) {
  const [enabled, setEnabled] = useState(defaultEnabled);
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className="relative w-11 h-6 rounded-full flex-shrink-0 transition-all duration-300"
        style={{ background: enabled ? '#FF6B00' : 'rgba(255,255,255,0.1)' }}
      >
        <motion.div
          animate={{ x: enabled ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 rounded-full bg-white"
        />
      </button>
    </div>
  );
}
