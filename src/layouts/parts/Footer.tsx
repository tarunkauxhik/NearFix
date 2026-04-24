import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Zap, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

import {
  getAvailableRoleExperiences,
  getViewerStateFromSession,
  type ViewerState,
} from '@/lib/access';
import { useViewer } from '@/lib/useViewer';

const footerLinks = {
  Services: [
    { label: 'Electrician', href: '/services' },
    { label: 'Plumber', href: '/services' },
    { label: 'Home Tutor', href: '/services' },
    { label: 'Beautician', href: '/services' },
    { label: 'AC Repair', href: '/services' },
    { label: 'Carpenter', href: '/services' },
  ],
  Company: [
    { label: 'How it Works', href: '/how-it-works' },
    { label: 'For Providers', href: '/provider/register' },
    { label: 'Safety', href: '/' },
    { label: 'About Us', href: '/' },
    { label: 'Careers', href: '/' },
  ],
  Support: [
    { label: 'Help Center', href: '/' },
    { label: 'Cancellation Policy', href: '/' },
    { label: 'Refund Policy', href: '/' },
    { label: 'Contact Us', href: '/' },
    { label: 'Trust & Safety', href: '/' },
  ],
};

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Youtube, href: '#', label: 'YouTube' },
];

function getInAppLinks(viewerState: ViewerState) {
  switch (viewerState) {
    case 'customer':
      return [
        { label: 'Dashboard', href: '/dashboard/customer' },
        { label: 'Services', href: '/services' },
        { label: 'Book a Service', href: '/booking' },
        { label: 'Notifications', href: '/notifications' },
      ];
    case 'provider':
    case 'provider_draft':
      return [
        { label: 'Provider Dashboard', href: '/dashboard/provider' },
        { label: 'Registration', href: '/provider/register' },
        { label: 'Notifications', href: '/notifications' },
        { label: 'Home', href: '/' },
      ];
    case 'admin':
      return [
        { label: 'Admin Home', href: '/admin' },
        { label: 'Approvals', href: '/admin/users?tab=needs-review' },
        { label: 'Users', href: '/admin/users' },
        { label: 'Public Site', href: '/' },
      ];
    case 'signed_in_unassigned':
      return [
        { label: 'Choose Role', href: '/onboarding' },
        { label: 'Services', href: '/services' },
        { label: 'Notifications', href: '/notifications' },
      ];
    case 'visitor':
    default:
      return [];
  }
}

export default function Footer() {
  const { isSignedIn } = useUser();
  const viewerQuery = useViewer();
  const viewerState = getViewerStateFromSession(Boolean(isSignedIn), viewerQuery.data);
  const isMarketingFooter = viewerState === 'visitor' || viewerState === 'signed_in_unassigned';
  const inAppLinks = getInAppLinks(viewerState);
  const roleExperiences = getAvailableRoleExperiences(viewerQuery.data);

  if (!isMarketingFooter) {
    return (
      <footer
        style={{
          background: '#080808',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link to="/" className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: '#FF6B00', boxShadow: '0 0 16px rgba(255,107,0,0.4)' }}
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
              <p className="mt-3 max-w-2xl text-sm text-white/50">
                {viewerState === 'admin'
                  ? 'Admin workspace for approvals, access control, and platform operations.'
                  : viewerState === 'customer'
                    ? 'Customer workspace for bookings, saved providers, and service updates.'
                    : 'Provider workspace for profile setup, jobs, and approval progress.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              {inAppLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-white/70 transition hover:text-white hover:border-[#FF6B00]/30"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {roleExperiences.length > 1 ? (
            <div className="mt-5 flex flex-wrap gap-3 text-xs text-white/45">
              <span>Available role views:</span>
              {roleExperiences.map((role) => (
                <Link
                  key={role}
                  to={role === 'customer' ? '/dashboard/customer' : '/dashboard/provider'}
                  className="text-[#FF6B00] transition hover:text-white"
                >
                  {role === 'customer' ? 'Customer view' : 'Provider view'}
                </Link>
              ))}
            </div>
          ) : null}

          <div
            className="mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              © 2026 NearFix Technologies Pvt. Ltd. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-xs transition-colors duration-200" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Privacy Policy
              </Link>
              <Link to="/" className="text-xs transition-colors duration-200" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      style={{
        background: '#080808',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: '#FF6B00', boxShadow: '0 0 16px rgba(255,107,0,0.4)' }}
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
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
              India's most trusted hyperlocal service platform. Connecting skilled professionals with residents across 50+ cities.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#FF6B00';
                    e.currentTarget.style.borderColor = 'rgba(255,107,0,0.4)';
                    e.currentTarget.style.background = 'rgba(255,107,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4
                className="text-xs font-semibold uppercase tracking-widest mb-4"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {category}
              </h4>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm transition-colors duration-200"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#FF6B00'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div
          className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            © 2026 NearFix Technologies Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs transition-colors duration-200" style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
            >
              Privacy Policy
            </Link>
            <Link to="/" className="text-xs transition-colors duration-200" style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
            >
              Terms of Service
            </Link>
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Made with ❤️ in India 🇮🇳
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
