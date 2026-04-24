import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Menu, X, Zap, UserCircle } from 'lucide-react';
import { useUser, UserButton, SignInButton } from '@clerk/clerk-react';
import {
  getAvailableRoleExperiences,
  getSignedInHome,
  getViewerStateFromSession,
  type AppRole,
  type ViewerState,
} from '@/lib/access';
import { useNotifications } from '@/lib/notification-store';
import { useViewer } from '@/lib/useViewer';

type NavLink = {
  label: string;
  href: string;
  isActive?: (pathname: string, search: string) => boolean;
};

function isActiveLink(pathname: string, search: string, link: NavLink): boolean {
  if (link.isActive) {
    return link.isActive(pathname, search);
  }

  const hrefPath = link.href.split('?')[0] || link.href;
  if (hrefPath === '/') return pathname === '/';
  return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
}

function getNavLinks(viewerState: ViewerState): NavLink[] {
  switch (viewerState) {
    case 'signed_in_unassigned':
      return [
        { label: 'Home', href: '/' },
        { label: 'Services', href: '/services' },
        { label: 'Choose Role', href: '/onboarding' },
        { label: 'How it Works', href: '/how-it-works' },
      ];
    case 'customer':
      return [
        { label: 'Home', href: '/' },
        { label: 'Services', href: '/services' },
        { label: 'My Bookings', href: '/dashboard/customer' },
      ];
    case 'provider':
    case 'provider_draft':
      return [
        { label: 'Home', href: '/' },
        { label: 'Provider Dashboard', href: '/dashboard/provider' },
        { label: 'Registration', href: '/provider/register' },
      ];
    case 'admin':
      return [
        { label: 'Admin Home', href: '/admin' },
        {
          label: 'Approvals',
          href: '/admin/users?tab=needs-review',
          isActive: (pathname, search) =>
            pathname === '/admin/users' && new URLSearchParams(search).get('tab') === 'needs-review',
        },
        {
          label: 'Users',
          href: '/admin/users',
          isActive: (pathname, search) =>
            pathname === '/admin/users' && new URLSearchParams(search).get('tab') !== 'needs-review',
        },
        { label: 'Public Site', href: '/' },
      ];
    case 'visitor':
    default:
      return [
        { label: 'Home', href: '/' },
        { label: 'Services', href: '/services' },
        { label: 'How it Works', href: '/how-it-works' },
        { label: 'For Providers', href: '/provider/register' },
      ];
  }
}

function getDashboardLabel(viewerState: ViewerState): string {
  switch (viewerState) {
    case 'signed_in_unassigned':
      return 'Complete Setup';
    case 'provider':
    case 'provider_draft':
      return 'Provider Dashboard';
    case 'admin':
      return 'Admin Home';
    case 'customer':
      return 'My Dashboard';
    case 'visitor':
    default:
      return 'Dashboard';
  }
}

function getSecondaryCta(viewerState: ViewerState): NavLink | null {
  switch (viewerState) {
    case 'visitor':
      return { label: 'Book Now', href: '/booking' };
    case 'signed_in_unassigned':
      return { label: 'Choose Role', href: '/onboarding' };
    case 'customer':
      return { label: 'Book Now', href: '/booking' };
    default:
      return null;
  }
}

function getRoleSwitchLink(role: AppRole): NavLink {
  return role === 'customer'
    ? { label: 'Customer View', href: '/dashboard/customer' }
    : { label: 'Provider View', href: '/dashboard/provider' };
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { isSignedIn, user } = useUser();
  const viewerQuery = useViewer();
  const viewer = viewerQuery.data;
  const viewerState = getViewerStateFromSession(Boolean(isSignedIn), viewer);
  const { unreadCount } = useNotifications(viewerState);
  const dashboardHref = isSignedIn ? (viewer ? getSignedInHome(viewer) : '/auth/post-auth') : '/auth/sign-in';
  const dashboardLabel = getDashboardLabel(viewerState);
  const secondaryCta = getSecondaryCta(viewerState);
  const navLinks = useMemo(() => getNavLinks(viewerState), [viewerState]);
  const roleSwitchLinks = useMemo(
    () => getAvailableRoleExperiences(viewer).map(getRoleSwitchLink),
    [viewer]
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? 'rgba(13,13,13,0.92)'
            : 'rgba(13,13,13,0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: scrolled ? '1px solid rgba(255,107,0,0.15)' : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: '#FF6B00', boxShadow: '0 0 16px rgba(255,107,0,0.5)' }}
              >
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span
                className="text-xl font-bold text-white tracking-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Near<span style={{ color: '#FF6B00' }}>Fix</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = isActiveLink(location.pathname, location.search, link);
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      color: active ? '#FF6B00' : 'rgba(255,255,255,0.7)',
                      background: active ? 'rgba(255,107,0,0.1)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.color = '#FFFFFF';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-3">
              {roleSwitchLinks.length > 1 ? (
                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
                  {roleSwitchLinks.map((link) => {
                    const active = isActiveLink(location.pathname, location.search, link);
                    return (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                        style={{
                          background: active ? 'rgba(255,107,0,0.14)' : 'transparent',
                          color: active ? '#FF6B00' : 'rgba(255,255,255,0.6)',
                        }}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}

              {/* Bell */}
              <Link to="/notifications" className="relative p-2 rounded-lg transition-all duration-200 hover:bg-white/[0.06]">
                <Bell className="w-5 h-5 text-white/70" />
                {unreadCount > 0 && (
                  <span
                    className="absolute top-1 right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                    style={{ background: '#FF6B00', boxShadow: '0 0 8px rgba(255,107,0,0.6)' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Auth */}
              {isSignedIn ? (
                <div className="flex items-center gap-2">
                  <Link
                    to={dashboardHref}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{ color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.05)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#FF6B00'; e.currentTarget.style.background = 'rgba(255,107,0,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  >
                    {dashboardLabel}
                  </Link>
                  {secondaryCta ? (
                    <Link
                      to={secondaryCta.href}
                      className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all duration-200"
                      style={{
                        background: '#FF6B00',
                        boxShadow: '0 0 16px rgba(255,107,0,0.3)',
                      }}
                    >
                      {secondaryCta.label}
                    </Link>
                  ) : null}
                  <UserButton
                    appearance={{
                      variables: { colorPrimary: '#FF6B00' },
                      elements: {
                        avatarBox: { width: '32px', height: '32px', borderRadius: '10px' },
                      },
                    }}
                  />
                </div>
              ) : (
                <SignInButton mode="redirect" forceRedirectUrl="/auth/post-auth">
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 flex items-center gap-1.5"
                    style={{
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.06)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,107,0,0.5)';
                      e.currentTarget.style.background = 'rgba(255,107,0,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    }}
                  >
                    <UserCircle className="w-3.5 h-3.5" />
                    Sign In
                  </button>
                </SignInButton>
              )}

              {!isSignedIn && secondaryCta ? (
                <Link
                  to={secondaryCta.href}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all duration-200"
                  style={{
                    background: '#FF6B00',
                    boxShadow: '0 0 16px rgba(255,107,0,0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 24px rgba(255,107,0,0.5)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 16px rgba(255,107,0,0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {secondaryCta.label}
                </Link>
              ) : null}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/[0.06] transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 md:hidden"
            style={{
              background: 'rgba(13,13,13,0.97)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255,107,0,0.15)',
            }}
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => {
                const active = isActiveLink(location.pathname, location.search, link);
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="px-4 py-3 rounded-lg text-sm font-medium transition-all"
                    style={{
                      color: active ? '#FF6B00' : 'rgba(255,255,255,0.8)',
                      background: active ? 'rgba(255,107,0,0.1)' : 'transparent',
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="mt-3 flex flex-col gap-2">
                {isSignedIn ? (
                  <div className="flex flex-col gap-1">
                    {roleSwitchLinks.length > 1 ? (
                      <div className="mb-2 flex flex-col gap-1">
                        {roleSwitchLinks.map((link) => (
                          <Link
                            key={link.href}
                            to={link.href}
                            className="px-4 py-3 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/[0.06] transition-all"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                    <Link
                      to={dashboardHref}
                      className="px-4 py-3 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/[0.06] transition-all"
                    >
                      {dashboardLabel}
                    </Link>
                    <Link
                      to="/notifications"
                      className="px-4 py-3 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/[0.06] transition-all flex items-center justify-between"
                    >
                      Notifications
                      {unreadCount > 0 && (
                        <span
                          className="px-1.5 py-0.5 rounded-full text-[10px] font-black text-white"
                          style={{ background: '#FF6B00' }}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <UserButton appearance={{ variables: { colorPrimary: '#FF6B00' } }} />
                      <span className="text-sm text-white/70">{user?.firstName || 'My Account'}</span>
                    </div>
                    {secondaryCta ? (
                      <Link
                        to={secondaryCta.href}
                        className="px-4 py-3 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/[0.06] transition-all"
                      >
                        {secondaryCta.label}
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <Link
                    to="/auth/sign-in"
                    className="px-4 py-3 rounded-lg text-sm font-medium text-white text-center"
                    style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)' }}
                  >
                    Sign In
                  </Link>
                )}
                {!isSignedIn && secondaryCta ? (
                  <Link
                    to={secondaryCta.href}
                    className="px-4 py-3 rounded-lg text-sm font-bold text-white text-center"
                    style={{ background: '#FF6B00' }}
                  >
                    {secondaryCta.label}
                  </Link>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
