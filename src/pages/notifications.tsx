import { type ElementType, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell, BellOff, CheckCheck, Trash2, ChevronRight,
  Zap, Star, Gift, Settings,
  MapPin, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { type Notification, type NotifType } from '@/data/notifications';
import { getSignedInHome, getViewerStateFromSession } from '@/lib/access';
import { useNotifications } from '@/lib/notification-store';
import { useViewer } from '@/lib/useViewer';

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotifType, { icon: ElementType; color: string; bg: string; label: string }> = {
  booking_confirmed:  { icon: CheckCircle,  color: '#10B981', bg: 'rgba(16,185,129,0.12)',  label: 'Confirmed' },
  booking_reminder:   { icon: Clock,        color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  label: 'Reminder' },
  booking_completed:  { icon: CheckCheck,   color: '#10B981', bg: 'rgba(16,185,129,0.12)',  label: 'Completed' },
  booking_cancelled:  { icon: XCircle,      color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   label: 'Cancelled' },
  provider_accepted:  { icon: CheckCircle,  color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  label: 'Accepted' },
  provider_en_route:  { icon: MapPin,       color: '#FF6B00', bg: 'rgba(255,107,0,0.12)',   label: 'En Route' },
  review_request:     { icon: Star,         color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  label: 'Review' },
  promo:              { icon: Gift,         color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)',  label: 'Offer' },
  system:             { icon: Zap,          color: '#FF6B00', bg: 'rgba(255,107,0,0.12)',   label: 'Update' },
};

type FilterTab = 'all' | 'unread' | 'bookings' | 'offers';

const BOOKING_TYPES: NotifType[] = [
  'booking_confirmed', 'booking_reminder', 'booking_completed',
  'booking_cancelled', 'provider_accepted', 'provider_en_route', 'review_request',
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function groupByDate(notifications: Notification[]): { label: string; items: Notification[] }[] {
  const today = new Date('2026-04-06');
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const groups: Record<string, Notification[]> = {};

  notifications.forEach((n) => {
    const d = new Date(n.timestamp);
    let label: string;
    if (d.toDateString() === today.toDateString()) label = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
    else label = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });

  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

// ─── Notification Card ────────────────────────────────────────────────────────
function NotifCard({
  notif,
  onRead,
  onDelete,
}: {
  notif: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[notif.type];
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="relative flex gap-4 p-4 rounded-2xl group transition-all duration-200"
      style={{
        background: notif.read ? 'rgba(255,255,255,0.03)' : 'rgba(255,107,0,0.04)',
        border: `1px solid ${notif.read ? 'rgba(255,255,255,0.07)' : 'rgba(255,107,0,0.15)'}`,
      }}
    >
      {/* Unread dot */}
      {!notif.read && (
        <span
          className="absolute top-4 right-4 w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: '#FF6B00', boxShadow: '0 0 6px rgba(255,107,0,0.6)' }}
        />
      )}

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: cfg.bg }}
      >
        <Icon className="w-5 h-5" style={{ color: cfg.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className={`text-sm font-bold ${notif.read ? 'text-white/70' : 'text-white'}`}>
            {notif.title}
          </p>
          <span className="text-[11px] flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {timeAgo(notif.timestamp)}
          </span>
        </div>

        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {notif.body}
        </p>

        {/* Meta chips */}
        {notif.meta?.bookingId && (
          <span
            className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded"
            style={{ background: 'rgba(255,107,0,0.1)', color: '#FF6B00' }}
          >
            {notif.meta.bookingId}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          {notif.actionLabel && notif.actionHref && (
            <Link
              to={notif.actionHref}
              onClick={() => onRead(notif.id)}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all duration-200"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              {notif.actionLabel} <ChevronRight className="w-3 h-3" />
            </Link>
          )}
          {!notif.read && (
            <button
              onClick={() => onRead(notif.id)}
              className="text-xs px-3 py-1.5 rounded-xl transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
            >
              Mark read
            </button>
          )}
        </div>
      </div>

      {/* Delete button — appears on hover */}
      <button
        onClick={() => onDelete(notif.id)}
        className="absolute bottom-4 right-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: 'rgba(239,68,68,0.1)', color: 'rgba(239,68,68,0.6)' }}
        title="Delete"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { isSignedIn } = useAuth();
  const viewerQuery = useViewer();
  const viewerState = getViewerStateFromSession(Boolean(isSignedIn), viewerQuery.data);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    deleteNotification,
    clearNotifications,
  } = useNotifications(viewerState);

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'bookings') return BOOKING_TYPES.includes(n.type);
    if (activeFilter === 'offers') return n.type === 'promo' || n.type === 'system';
    return true;
  });

  const grouped = groupByDate(filtered);

  function clearAll() {
    clearNotifications(filtered.map((notification) => notification.id));
  }

  const FILTERS: { id: FilterTab; label: string; badge?: number }[] = [
    { id: 'all', label: 'All', badge: notifications.length },
    { id: 'unread', label: 'Unread', badge: unreadCount },
    { id: 'bookings', label: 'Bookings' },
    { id: 'offers', label: 'Offers & Updates' },
  ];

  const inboxDescription = {
    visitor: 'Marketing updates and public product highlights for first-time visitors.',
    signed_in_unassigned: 'Setup reminders to help you choose your NearFix role and finish onboarding.',
    customer: 'Booking reminders, service updates, and customer-only offers.',
    provider_draft: 'Provider setup reminders, approval notes, and profile tips.',
    provider: 'Provider setup reminders, approval notes, and profile tips.',
    admin: 'Admin alerts, provider review reminders, and platform updates.',
  }[viewerState];

  const settingsHref = isSignedIn
    ? viewerQuery.data
      ? getSignedInHome(viewerQuery.data)
      : '/auth/post-auth'
    : '/auth/sign-in';

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh' }}>
      <title>Notifications — NearFix</title>
      <meta name="description" content="Stay up to date with your NearFix bookings, provider updates, and offers." />

      <div className="pt-24 pb-32 max-w-2xl mx-auto px-4 sm:px-6">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4 mb-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1
                className="text-2xl font-black text-white"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Notifications
              </h1>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2 py-0.5 rounded-full text-xs font-black text-white"
                  style={{ background: '#FF6B00', boxShadow: '0 0 10px rgba(255,107,0,0.5)' }}
                >
                  {unreadCount} new
                </motion.span>
              )}
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {notifications.length} total notification{notifications.length !== 1 ? 's' : ''}. {inboxDescription}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
            <Link
              to={settingsHref}
              className="p-2 rounded-xl transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
              title="Open your home area"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* ── Filter tabs ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-1.5 p-1 rounded-2xl mb-6 overflow-x-auto"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap flex-1 justify-center"
              style={{
                background: activeFilter === f.id ? '#FF6B00' : 'transparent',
                color: activeFilter === f.id ? 'white' : 'rgba(255,255,255,0.45)',
                boxShadow: activeFilter === f.id ? '0 3px 12px rgba(255,107,0,0.35)' : 'none',
              }}
            >
              {f.label}
              {f.badge !== undefined && f.badge > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-black min-w-[18px] text-center"
                  style={{
                    background: activeFilter === f.id ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                  }}
                >
                  {f.badge}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* ── Notification list ── */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-20 gap-4"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <BellOff className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.2)' }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-white mb-1">All caught up</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {activeFilter === 'unread' ? 'No unread notifications' : 'Nothing here yet'}
                </p>
              </div>
              {activeFilter !== 'all' && (
                <button
                  onClick={() => setActiveFilter('all')}
                  className="text-xs font-semibold px-4 py-2 rounded-xl"
                  style={{ background: 'rgba(255,107,0,0.1)', color: '#FF6B00' }}
                >
                  View all notifications
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6"
            >
              {grouped.map(({ label, items }) => (
                <div key={label}>
                  {/* Date group header */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                    >
                      {label}
                    </span>
                    {label === 'Today' && items.length > 1 && (
                      <button
                        onClick={() => items.forEach((n) => !n.read && markRead(n.id))}
                        className="text-[10px] font-semibold"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <AnimatePresence>
                      {items.map((notif) => (
                        <NotifCard
                          key={notif.id}
                          notif={notif}
                          onRead={markRead}
                    onDelete={deleteNotification}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}

              {/* Clear all */}
              {filtered.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center pt-2"
                >
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                    style={{ background: 'rgba(239,68,68,0.07)', color: 'rgba(239,68,68,0.6)', border: '1px solid rgba(239,68,68,0.15)' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear {activeFilter === 'all' ? 'all' : 'these'} notifications
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Notification preferences CTA ── */}
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 p-5 rounded-2xl flex items-center justify-between gap-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,107,0,0.1)' }}
              >
                <Bell className="w-4 h-4" style={{ color: '#FF6B00' }} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Notification preferences</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Control what alerts you receive
                </p>
              </div>
            </div>
            <Link
              to="/dashboard/resident"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0"
              style={{ background: 'rgba(255,107,0,0.1)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.2)' }}
            >
              Manage <ChevronRight className="w-3 h-3" />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
