import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search, CalendarCheck, Star, ShieldCheck, BadgeCheck,
  Zap, Clock, MapPin, ChevronRight, CheckCircle,
  Smartphone, CreditCard, MessageSquare, RotateCcw,
} from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────

const RESIDENT_STEPS = [
  {
    number: '01',
    icon: Search,
    title: 'Search & Filter',
    description:
      'Enter your service need and location. Browse verified providers filtered by rating, distance, availability, and price — all in real time.',
    color: '#FF6B00',
    detail: 'Over 200+ service categories across Bengaluru',
  },
  {
    number: '02',
    icon: CalendarCheck,
    title: 'Book a Slot',
    description:
      'Pick a date and time that works for you from the provider\'s live availability calendar. No phone calls, no waiting.',
    color: '#3B82F6',
    detail: 'Instant booking confirmation in under 60 seconds',
  },
  {
    number: '03',
    icon: Zap,
    title: 'Get It Done',
    description:
      'Your provider arrives on time, completes the job to standard, and you track every step live — from acceptance to completion.',
    color: '#10B981',
    detail: 'Real-time status updates throughout the job',
  },
  {
    number: '04',
    icon: Star,
    title: 'Rate & Review',
    description:
      'After the job, rate your experience. Your feedback helps the community and rewards top-performing providers.',
    color: '#F59E0B',
    detail: 'Honest reviews build a trustworthy marketplace',
  },
];

const PROVIDER_STEPS = [
  {
    number: '01',
    icon: Smartphone,
    title: 'Create Your Profile',
    description:
      'Sign up, add your skills, upload portfolio photos, set your service area and pricing. Go live in minutes.',
    color: '#8B5CF6',
  },
  {
    number: '02',
    icon: CalendarCheck,
    title: 'Set Availability',
    description:
      'Control your schedule. Mark the days and time slots you\'re open for bookings — update anytime from your dashboard.',
    color: '#3B82F6',
  },
  {
    number: '03',
    icon: MessageSquare,
    title: 'Accept Job Requests',
    description:
      'Receive booking requests with full job details. Accept or decline with one tap. Respond fast to boost your ranking.',
    color: '#FF6B00',
  },
  {
    number: '04',
    icon: CreditCard,
    title: 'Get Paid',
    description:
      'Earnings are credited to your account after job completion. Track every transaction in your earnings dashboard.',
    color: '#10B981',
  },
];

const TRUST_FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Background Verified',
    description: 'Every provider undergoes a thorough background check before joining the platform.',
    color: '#10B981',
  },
  {
    icon: BadgeCheck,
    title: 'Skill Certified',
    description: 'Providers are tested and certified in their trade by NearFix quality assessors.',
    color: '#3B82F6',
  },
  {
    icon: Star,
    title: 'Community Rated',
    description: 'Real reviews from real residents. Providers with low ratings are removed from the platform.',
    color: '#F59E0B',
  },
  {
    icon: Clock,
    title: 'On-Time Guarantee',
    description: 'If your provider is more than 15 minutes late, you get a discount on your next booking.',
    color: '#FF6B00',
  },
  {
    icon: RotateCcw,
    title: 'Redo Guarantee',
    description: 'Not satisfied? We\'ll send another provider to redo the job at no extra cost within 48 hours.',
    color: '#EC4899',
  },
  {
    icon: MapPin,
    title: 'Hyperlocal Matching',
    description: 'We match you with providers in your exact neighbourhood — faster response, lower travel cost.',
    color: '#8B5CF6',
  },
];

const FAQS = [
  {
    q: 'How do I know a provider is trustworthy?',
    a: 'All NearFix providers are background-verified, skill-certified, and rated by real residents. You can see their full profile, portfolio, and reviews before booking.',
  },
  {
    q: 'What if I\'m not satisfied with the service?',
    a: 'We offer a Redo Guarantee — if you\'re not happy, we\'ll send another provider to fix it within 48 hours at no extra charge.',
  },
  {
    q: 'Can I cancel or reschedule a booking?',
    a: 'Yes. You can cancel or reschedule up to 2 hours before the scheduled time from your Resident Dashboard without any penalty.',
  },
  {
    q: 'How does pricing work?',
    a: 'Each provider sets their own base rate. You\'ll see a full price breakdown — base price, platform fee (₹29), and GST — before confirming your booking. No hidden charges.',
  },
  {
    q: 'Is NearFix available outside Bengaluru?',
    a: 'We\'re currently live in Bengaluru and expanding to Mumbai, Hyderabad, and Pune in Q3 2026. Join the waitlist to be notified.',
  },
  {
    q: 'How do I become a provider on NearFix?',
    a: 'Click "Join as Provider" and complete your profile. Our team will verify your credentials and get you live within 48 hours.',
  },
];

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  return (
    <motion.details
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="group rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <summary
        className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none text-sm font-bold text-white select-none"
        style={{ WebkitUserSelect: 'none' }}
      >
        {q}
        <ChevronRight
          className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-open:rotate-90"
          style={{ color: '#FF6B00' }}
        />
      </summary>
      <div className="px-5 pb-5">
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{a}</p>
      </div>
    </motion.details>
  );
}

// ─── Step Card ────────────────────────────────────────────────────────────────
type AnyStep = typeof RESIDENT_STEPS[0] | typeof PROVIDER_STEPS[0];

function StepCard({
  step, index, showConnector,
}: {
  step: AnyStep;
  index: number;
  showConnector: boolean;
}) {
  const Icon = step.icon;
  return (
    <div className="relative flex flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1, duration: 0.4 }}
        className="flex flex-col items-center gap-4 w-full"
      >
        {/* Number + icon */}
        <div className="relative">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: `${step.color}15`,
              border: `1px solid ${step.color}30`,
              boxShadow: `0 0 24px ${step.color}15`,
            }}
          >
            <Icon className="w-7 h-7" style={{ color: step.color }} />
          </div>
          <span
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
            style={{ background: step.color, color: 'white' }}
          >
            {index + 1}
          </span>
        </div>

        <div>
          <h3 className="text-base font-black text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            {step.title}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {step.description}
          </p>
          {'detail' in step && (
            <p className="text-xs mt-2 font-semibold" style={{ color: step.color }}>
              {step.detail}
            </p>
          )}
        </div>
      </motion.div>

      {/* Connector line (desktop) */}
      {showConnector && (
        <div
          className="hidden lg:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px"
          style={{ background: `linear-gradient(90deg, ${step.color}40, rgba(255,255,255,0.06))` }}
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HowItWorksPage() {
  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh' }}>
      <title>How It Works — NearFix</title>
      <meta
        name="description"
        content="Learn how NearFix connects residents with verified local service providers in minutes. Book, track, and pay — all in one place."
      />

      <div className="pt-24 pb-32 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <span
            className="inline-block text-xs font-bold px-3 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(255,107,0,0.12)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.2)' }}
          >
            Simple. Fast. Trusted.
          </span>
          <h1
            className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Home services,{' '}
            <span style={{ color: '#FF6B00' }}>done right</span>
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
            NearFix connects you with verified, rated local professionals in your neighbourhood — in under 60 seconds.
          </p>
        </motion.div>

        {/* ── For Residents ── */}
        <section className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 mb-10"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,107,0,0.12)' }}
            >
              <Search className="w-4 h-4" style={{ color: '#FF6B00' }} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                For Residents
              </h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Book a trusted professional in 4 easy steps
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {RESIDENT_STEPS.map((step, i) => (
              <StepCard
                key={step.number}
                step={step}
                index={i}
                showConnector={i < RESIDENT_STEPS.length - 1}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 flex justify-center"
          >
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white"
              style={{ background: '#FF6B00', boxShadow: '0 6px 24px rgba(255,107,0,0.4)' }}
            >
              Browse Services <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </section>

        {/* ── Divider ── */}
        <div
          className="h-px mb-24"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}
        />

        {/* ── For Providers ── */}
        <section className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 mb-10"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.12)' }}
            >
              <Zap className="w-4 h-4" style={{ color: '#8B5CF6' }} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                For Providers
              </h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Grow your business with zero marketing spend
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {PROVIDER_STEPS.map((step, i) => (
              <StepCard
                key={step.number}
                step={step}
                index={i}
                showConnector={i < PROVIDER_STEPS.length - 1}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-10 flex justify-center"
          >
            <Link
              to="/dashboard/provider"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold"
              style={{
                background: 'rgba(139,92,246,0.12)',
                color: '#8B5CF6',
                border: '1px solid rgba(139,92,246,0.25)',
              }}
            >
              Join as Provider <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </section>

        {/* ── Trust & Safety ── */}
        <section className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2
              className="text-2xl sm:text-3xl font-black text-white mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Built on <span style={{ color: '#FF6B00' }}>Trust</span>
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Every safeguard we've built to protect residents and providers alike
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TRUST_FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="p-5 rounded-2xl flex gap-4"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${feature.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: feature.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">{feature.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── Stats banner ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24 p-8 rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,107,0,0.1) 0%, rgba(255,107,0,0.03) 100%)',
            border: '1px solid rgba(255,107,0,0.2)',
          }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: '12,000+', label: 'Bookings Completed', color: '#FF6B00' },
              { value: '480+', label: 'Verified Providers', color: '#10B981' },
              { value: '4.8★', label: 'Average Rating', color: '#F59E0B' },
              { value: '< 60s', label: 'Avg Booking Time', color: '#3B82F6' },
            ].map(({ value, label, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <p
                  className="text-3xl font-black mb-1"
                  style={{ color, fontFamily: 'var(--font-heading)' }}
                >
                  {value}
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── FAQ ── */}
        <section className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2
              className="text-2xl sm:text-3xl font-black text-white mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Frequently Asked Questions
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Everything you need to know before your first booking
            </p>
          </motion.div>

          <div className="max-w-2xl mx-auto flex flex-col gap-3">
            {FAQS.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} index={i} />
            ))}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center p-10 rounded-3xl"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h2
            className="text-2xl sm:text-3xl font-black text-white mb-3"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Ready to get started?
          </h2>
          <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Join thousands of residents in Bengaluru who trust NearFix for every home service need.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-white"
              style={{ background: '#FF6B00', boxShadow: '0 6px 24px rgba(255,107,0,0.4)' }}
            >
              <Search className="w-4 h-4" /> Find a Provider
            </Link>
            <Link
              to="/dashboard/provider"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <CheckCircle className="w-4 h-4" /> Join as Provider
            </Link>
          </div>
        </motion.section>

      </div>
    </div>
  );
}
