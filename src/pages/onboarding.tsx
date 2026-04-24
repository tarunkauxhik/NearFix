import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'motion/react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Home, Wrench, ChevronRight, CheckCircle,
  Star, ShieldCheck, Zap, Clock, BadgeCheck,
  MapPin, Wallet, TrendingUp, Users,
} from 'lucide-react';
import { authApiFetch } from '@/lib/api-client';
import {
  canAccessRoleSelection,
  getSignedInHome,
  normalizeProviderApplicationStatus,
  type AppRole,
} from '@/lib/access';
import { useViewer } from '@/lib/useViewer';

type Role = AppRole;

const ROLE_CONFIG = {
  customer: {
    icon: Home,
    label: 'I need services',
    sublabel: 'Customer',
    description: 'Find and book trusted local professionals for any home service need.',
    color: '#FF6B00',
    bg: 'rgba(255,107,0,0.08)',
    border: 'rgba(255,107,0,0.3)',
    glow: 'rgba(255,107,0,0.15)',
    perks: [
      { icon: ShieldCheck, text: 'Background-verified providers only' },
      { icon: Star,        text: 'Real reviews from real residents' },
      { icon: Clock,       text: 'Book in under 60 seconds' },
      { icon: Zap,         text: 'Live job tracking & updates' },
    ],
    cta: 'Go to my Dashboard',
    redirect: '/dashboard/customer',
  },
  provider: {
    icon: Wrench,
    label: 'I offer services',
    sublabel: 'Service Provider',
    description: 'Grow your business with zero marketing spend. Get jobs delivered to you.',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.3)',
    glow: 'rgba(139,92,246,0.15)',
    perks: [
      { icon: Wallet,     text: 'Get paid after every job' },
      { icon: TrendingUp, text: 'Grow your client base fast' },
      { icon: BadgeCheck, text: 'Earn a Verified badge' },
      { icon: Users,      text: 'Access thousands of residents' },
    ],
    cta: 'Set up my Provider Profile',
    redirect: '/dashboard/provider',
  },
} as const;

export default function OnboardingPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const viewerQuery = useViewer();
  const [selected, setSelected] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!viewerQuery.data) return;
    if (!canAccessRoleSelection(viewerQuery.data)) {
      navigate(getSignedInHome(viewerQuery.data), { replace: true });
    }
  }, [navigate, viewerQuery.data]);

  async function handleConfirm() {
    if (!selected || !user || !viewerQuery.data || !canAccessRoleSelection(viewerQuery.data)) return;
    setSaving(true);
    setError(null);

    try {
      const result = await authApiFetch<{ success: boolean; role: Role; providerApplicationStatus?: string | null }>(
        '/user/role',
        getToken,
        {
          method: 'POST',
          body: JSON.stringify({ role: selected }),
        }
      );

      await Promise.all([
        user.reload(),
        queryClient.invalidateQueries({ queryKey: ['viewer'] }),
      ]);
      navigate(
        getSignedInHome({
          role: result.role,
          isAdmin: false,
          providerApplicationStatus: normalizeProviderApplicationStatus(
            result.providerApplicationStatus
          ),
        }),
        { replace: true }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const cfg = selected ? ROLE_CONFIG[selected] : null;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden"
      style={{ background: '#0D0D0D' }}
    >
      <title>Choose Your Role — NearFix</title>

      {/* Background glow blobs */}
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(255,107,0,0.04)' }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(139,92,246,0.04)' }}
      />

      <div className="w-full max-w-lg relative z-10">

        {/* ── Logo + greeting ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          {/* NearFix wordmark */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.25)' }}
            >
              <MapPin className="w-5 h-5" style={{ color: '#FF6B00' }} />
            </div>
            <span
              className="text-xl font-black text-white"
              style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
            >
              Near<span style={{ color: '#FF6B00' }}>Fix</span>
            </span>
          </div>

          <h1
            className="text-3xl font-black text-white mb-2"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Welcome{user?.firstName ? `, ${user.firstName}` : ''}! 👋
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Tell us how you'll be using NearFix so we can personalise your experience.
          </p>
          {viewerQuery.data?.canActAsBoth ? (
            <p className="mt-3 text-xs text-amber-200/80">
              Your account already has dual-role access. Ask an admin if you need your primary role adjusted.
            </p>
          ) : null}
        </motion.div>

        {/* ── Role cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([role, config]) => {
            const Icon = config.icon;
            const isActive = selected === role;

            return (
              <motion.button
                key={role}
                onClick={() => setSelected(role)}
                whileTap={{ scale: 0.97 }}
                className="relative flex flex-col items-center gap-4 p-6 rounded-2xl text-left transition-all duration-200 outline-none"
                style={{
                  background: isActive ? config.bg : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${isActive ? config.border : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: isActive ? `0 0 32px ${config.glow}` : 'none',
                }}
              >
                {/* Selected checkmark */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute top-3 right-3"
                    >
                      <CheckCircle className="w-5 h-5" style={{ color: config.color }} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: isActive ? `${config.color}20` : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${isActive ? `${config.color}30` : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <Icon className="w-7 h-7" style={{ color: isActive ? config.color : 'rgba(255,255,255,0.4)' }} />
                </div>

                {/* Labels */}
                <div className="text-center">
                  <p
                    className="text-xs font-bold uppercase tracking-wider mb-1"
                    style={{ color: isActive ? config.color : 'rgba(255,255,255,0.3)' }}
                  >
                    {config.sublabel}
                  </p>
                  <p
                    className="text-base font-black"
                    style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-heading)' }}
                  >
                    {config.label}
                  </p>
                  <p
                    className="text-xs mt-1.5 leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    {config.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* ── Perks panel (animates in when role selected) ── */}
        <AnimatePresence mode="wait">
          {cfg && selected && (
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mb-6"
            >
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                }}
              >
                <p className="text-xs font-bold mb-3" style={{ color: cfg.color }}>
                  What you get as a {cfg.sublabel}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {cfg.perks.map(({ icon: PerkIcon, text }) => (
                    <div key={text} className="flex items-center gap-2">
                      <PerkIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cfg.color }} />
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 px-4 py-3 rounded-xl text-sm text-center"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CTA button ── */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={handleConfirm}
          disabled={!selected || saving}
          className="w-full py-4 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all duration-200"
          style={{
            background: selected ? cfg!.color : 'rgba(255,255,255,0.06)',
            color: selected ? 'white' : 'rgba(255,255,255,0.25)',
            boxShadow: selected ? `0 6px 24px ${cfg!.glow}` : 'none',
            cursor: selected && !saving ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? (
            <>
              <span
                className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
              />
              Setting up your account…
            </>
          ) : (
            <>
          {selected ? cfg!.cta : 'Select a role to continue'}
              {selected && <ChevronRight className="w-4 h-4" />}
            </>
          )}
        </motion.button>

        {/* ── Fine print ── */}
        <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
          One account can only use one app role by default. An admin can unlock dual-role access if you truly need both.
        </p>
      </div>
    </div>
  );
}
