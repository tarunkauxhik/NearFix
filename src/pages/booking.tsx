import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useUser, SignInButton } from '@clerk/clerk-react';
import {
  MapPin, Clock, ShieldCheck, ChevronRight, Check,
  User, Home, FileText, CreditCard, Smartphone,
  Wallet, Zap, Star, BadgeCheck, ArrowLeft, Lock,
} from 'lucide-react';
import { getProviderDetail } from '@/data/providerDetails';
import { providers } from '@/data/providers';
import { getSignedInHome } from '@/lib/access';
import { useViewer } from '@/lib/useViewer';

type PaymentMethod = 'upi' | 'card' | 'wallet' | 'cod';

const PLATFORM_FEE = 29;
const GST_RATE = 0.18;

function parsePrice(price: string): number {
  return parseInt(price.replace(/[^0-9]/g, ''), 10) || 0;
}

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const viewerQuery = useViewer();

  const providerId = searchParams.get('provider') || '';
  const serviceId = searchParams.get('service') || '';
  const dateStr = searchParams.get('date') || '';
  const timeStr = searchParams.get('time') || '';

  const providerBase = providers.find((p) => p.id === providerId);
  const providerDetail = getProviderDetail(providerId);
  const service = providerDetail?.services.find((s) => s.id === serviceId);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    landmark: '',
    notes: '',
  });

  // Pre-fill from Clerk user
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: user.fullName || '',
        phone: user.primaryPhoneNumber?.phoneNumber || '',
      }));
    }
  }, [user]);

  const basePrice = service ? parsePrice(service.price) : 0;
  const gst = Math.round(basePrice * GST_RATE);
  const total = basePrice + PLATFORM_FEE + gst;

  const formattedDate = dateStr
    ? new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  const isFormValid = form.name.trim() && form.phone.trim().length >= 10 && form.address.trim();

  function handlePay() {
    if (!isFormValid) return;
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      const bookingId = `BK${Date.now()}`;
      navigate(`/booking/confirmation?id=${bookingId}&provider=${providerId}&service=${serviceId}&date=${dateStr}&time=${timeStr}&total=${total}`);
    }, 2200);
  }

  if (!providerBase || !providerDetail || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D0D' }}>
        <div className="text-center">
          <p className="text-white/50 mb-4">Booking details not found.</p>
          <Link to="/" className="text-sm font-semibold" style={{ color: '#FF6B00' }}>← Back to Home</Link>
        </div>
      </div>
    );
  }

  const canBookAsCustomer = Boolean(
    viewerQuery.data && (viewerQuery.data.role === 'customer' || viewerQuery.data.canActAsBoth)
  );

  if (isSignedIn && viewerQuery.data && !canBookAsCustomer) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0D0D0D' }}>
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF6B00]">Customer booking only</p>
          <h1 className="mt-3 text-2xl font-black">This booking flow is not available for your current role</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            NearFix keeps customer booking separate from provider and admin workspaces. Switch back to your allowed
            area to continue.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={getSignedInHome(viewerQuery.data)}
              className="rounded-2xl bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-white"
            >
              Go to my home
            </Link>
            <Link
              to="/services"
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/80"
            >
              Browse services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh' }}>
      <title>Confirm Booking — NearFix</title>
      <meta name="description" content={`Book ${providerDetail.name} for ${service.name} on NearFix.`} />

      <div className="pt-20 pb-32 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm mb-6 transition-colors duration-200"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#FF6B00'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to provider
        </button>

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            Confirm Your Booking
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Review details and complete payment to lock in your slot
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {(['Details', 'Payment', 'Review'] as const).map((label, i) => {
            const stepNum = (i + 1) as 1 | 2 | 3;
            const done = step > stepNum;
            const active = step === stepNum;
            return (
              <div key={label} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                    style={{
                      background: done ? '#10B981' : active ? '#FF6B00' : 'rgba(255,255,255,0.08)',
                      color: done || active ? 'white' : 'rgba(255,255,255,0.3)',
                      boxShadow: active ? '0 0 12px rgba(255,107,0,0.4)' : 'none',
                    }}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : stepNum}
                  </div>
                  <span
                    className="text-sm font-medium hidden sm:block"
                    style={{ color: active ? '#FF6B00' : done ? '#10B981' : 'rgba(255,255,255,0.3)' }}
                  >
                    {label}
                  </span>
                </div>
                {i < 2 && (
                  <div className="w-8 h-px" style={{ background: done ? '#10B981' : 'rgba(255,255,255,0.1)' }} />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* ── LEFT: Steps ── */}
          <div>
            <AnimatePresence mode="wait">

              {/* STEP 1: Address & Details */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-5"
                >
                  {/* Auth gate */}
                  {!isSignedIn && (
                    <div
                      className="p-5 rounded-2xl flex items-center justify-between gap-4"
                      style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.25)' }}
                    >
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 flex-shrink-0" style={{ color: '#FF6B00' }} />
                        <div>
                          <p className="text-sm font-bold text-white">Sign in to continue</p>
                          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            Create a free account to track your bookings
                          </p>
                        </div>
                      </div>
                      <SignInButton mode="modal">
                        <button
                          className="px-4 py-2 rounded-xl text-sm font-bold text-white flex-shrink-0 transition-all duration-200"
                          style={{ background: '#FF6B00', boxShadow: '0 4px 14px rgba(255,107,0,0.4)' }}
                        >
                          Sign In
                        </button>
                      </SignInButton>
                    </div>
                  )}

                  {/* Contact details */}
                  <div
                    className="p-5 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <User className="w-4 h-4" style={{ color: '#FF6B00' }} />
                      Contact Details
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Your full name"
                          className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-all duration-200"
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255,107,0,0.5)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-all duration-200"
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255,107,0,0.5)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div
                    className="p-5 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <Home className="w-4 h-4" style={{ color: '#FF6B00' }} />
                      Service Address
                    </h2>
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          Full Address *
                        </label>
                        <textarea
                          value={form.address}
                          onChange={(e) => setForm({ ...form, address: e.target.value })}
                          placeholder="Flat / House No., Building, Street, Area"
                          rows={3}
                          className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none resize-none transition-all duration-200"
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255,107,0,0.5)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          Landmark (optional)
                        </label>
                        <input
                          type="text"
                          value={form.landmark}
                          onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                          placeholder="Near metro station, mall, etc."
                          className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-all duration-200"
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255,107,0,0.5)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div
                    className="p-5 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4" style={{ color: '#FF6B00' }} />
                      Special Instructions
                      <span className="text-xs font-normal" style={{ color: 'rgba(255,255,255,0.35)' }}>optional</span>
                    </h2>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Any specific requirements, access instructions, or things the provider should know..."
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none resize-none transition-all duration-200"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255,107,0,0.5)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    />
                  </div>

                  <button
                    onClick={() => isFormValid && setStep(2)}
                    disabled={!isFormValid}
                    className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200"
                    style={{
                      background: isFormValid ? '#FF6B00' : 'rgba(255,255,255,0.08)',
                      color: isFormValid ? 'white' : 'rgba(255,255,255,0.3)',
                      boxShadow: isFormValid ? '0 6px 24px rgba(255,107,0,0.35)' : 'none',
                      cursor: isFormValid ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Continue to Payment <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/* STEP 2: Payment Method */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-5"
                >
                  <div
                    className="p-5 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" style={{ color: '#FF6B00' }} />
                      Choose Payment Method
                    </h2>

                    <div className="flex flex-col gap-3">
                      {/* UPI */}
                      <button
                        onClick={() => setPaymentMethod('upi')}
                        className="w-full p-4 rounded-xl text-left transition-all duration-200"
                        style={{
                          background: paymentMethod === 'upi' ? 'rgba(255,107,0,0.1)' : 'rgba(255,255,255,0.04)',
                          border: paymentMethod === 'upi' ? '1px solid rgba(255,107,0,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(255,107,0,0.15)' }}
                          >
                            <Smartphone className="w-5 h-5" style={{ color: '#FF6B00' }} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white">UPI</p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                              GPay, PhonePe, Paytm, BHIM
                            </p>
                          </div>
                          <div
                            className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                            style={{
                              borderColor: paymentMethod === 'upi' ? '#FF6B00' : 'rgba(255,255,255,0.2)',
                              background: paymentMethod === 'upi' ? '#FF6B00' : 'transparent',
                            }}
                          >
                            {paymentMethod === 'upi' && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                        {paymentMethod === 'upi' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 pt-3"
                            style={{ borderTop: '1px solid rgba(255,107,0,0.2)' }}
                          >
                            <input
                              type="text"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              placeholder="yourname@upi"
                              className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-all duration-200"
                              style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                              }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255,107,0,0.5)'; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                            />
                          </motion.div>
                        )}
                      </button>

                      {/* Card */}
                      <button
                        onClick={() => setPaymentMethod('card')}
                        className="w-full p-4 rounded-xl text-left transition-all duration-200"
                        style={{
                          background: paymentMethod === 'card' ? 'rgba(255,107,0,0.1)' : 'rgba(255,255,255,0.04)',
                          border: paymentMethod === 'card' ? '1px solid rgba(255,107,0,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(59,130,246,0.15)' }}
                          >
                            <CreditCard className="w-5 h-5" style={{ color: '#3B82F6' }} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white">Credit / Debit Card</p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                              Visa, Mastercard, RuPay
                            </p>
                          </div>
                          <div
                            className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                            style={{
                              borderColor: paymentMethod === 'card' ? '#FF6B00' : 'rgba(255,255,255,0.2)',
                              background: paymentMethod === 'card' ? '#FF6B00' : 'transparent',
                            }}
                          >
                            {paymentMethod === 'card' && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                        {paymentMethod === 'card' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 pt-3 flex flex-col gap-3"
                            style={{ borderTop: '1px solid rgba(255,107,0,0.2)' }}
                          >
                            <input
                              type="text"
                              placeholder="Card number"
                              maxLength={19}
                              className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="MM / YY"
                                maxLength={5}
                                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                              />
                              <input
                                type="text"
                                placeholder="CVV"
                                maxLength={4}
                                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                              />
                            </div>
                          </motion.div>
                        )}
                      </button>

                      {/* Wallet */}
                      <button
                        onClick={() => setPaymentMethod('wallet')}
                        className="w-full p-4 rounded-xl text-left transition-all duration-200"
                        style={{
                          background: paymentMethod === 'wallet' ? 'rgba(255,107,0,0.1)' : 'rgba(255,255,255,0.04)',
                          border: paymentMethod === 'wallet' ? '1px solid rgba(255,107,0,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(16,185,129,0.15)' }}
                          >
                            <Wallet className="w-5 h-5" style={{ color: '#10B981' }} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white">Wallet</p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                              Paytm Wallet, Amazon Pay, Mobikwik
                            </p>
                          </div>
                          <div
                            className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                            style={{
                              borderColor: paymentMethod === 'wallet' ? '#FF6B00' : 'rgba(255,255,255,0.2)',
                              background: paymentMethod === 'wallet' ? '#FF6B00' : 'transparent',
                            }}
                          >
                            {paymentMethod === 'wallet' && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                      </button>

                      {/* COD */}
                      <button
                        onClick={() => setPaymentMethod('cod')}
                        className="w-full p-4 rounded-xl text-left transition-all duration-200"
                        style={{
                          background: paymentMethod === 'cod' ? 'rgba(255,107,0,0.1)' : 'rgba(255,255,255,0.04)',
                          border: paymentMethod === 'cod' ? '1px solid rgba(255,107,0,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(245,158,11,0.15)' }}
                          >
                            <Zap className="w-5 h-5" style={{ color: '#F59E0B' }} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white">Pay After Service</p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                              Cash or UPI directly to provider
                            </p>
                          </div>
                          <div
                            className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                            style={{
                              borderColor: paymentMethod === 'cod' ? '#FF6B00' : 'rgba(255,255,255,0.2)',
                              background: paymentMethod === 'cod' ? '#FF6B00' : 'transparent',
                            }}
                          >
                            {paymentMethod === 'cod' && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-3.5 rounded-xl text-sm font-bold transition-all duration-200"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="flex-[2] py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200"
                      style={{
                        background: '#FF6B00',
                        boxShadow: '0 6px 24px rgba(255,107,0,0.35)',
                      }}
                    >
                      Review Order <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Review & Confirm */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-5"
                >
                  {/* Booking summary */}
                  <div
                    className="p-5 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <h2 className="text-sm font-bold text-white mb-4">Booking Summary</h2>
                    <div className="flex flex-col gap-3">
                      {[
                        { label: 'Provider', value: providerDetail.name },
                        { label: 'Service', value: service.name },
                        { label: 'Date', value: formattedDate },
                        { label: 'Time', value: timeStr },
                        { label: 'Address', value: form.address + (form.landmark ? `, ${form.landmark}` : '') },
                        { label: 'Contact', value: `${form.name} · ${form.phone}` },
                        { label: 'Payment', value: paymentMethod === 'upi' ? `UPI — ${upiId || 'Not entered'}` : paymentMethod === 'card' ? 'Credit / Debit Card' : paymentMethod === 'wallet' ? 'Wallet' : 'Pay After Service' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between gap-4 text-sm">
                          <span style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
                          <span className="text-white text-right">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Terms */}
                  <div
                    className="p-4 rounded-xl flex items-start gap-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#10B981' }} />
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      By confirming, you agree to NearFix's{' '}
                      <span style={{ color: '#FF6B00' }}>Terms of Service</span> and{' '}
                      <span style={{ color: '#FF6B00' }}>Cancellation Policy</span>.
                      Free cancellation up to 2 hours before the scheduled time.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-3.5 rounded-xl text-sm font-bold transition-all duration-200"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePay}
                      disabled={isProcessing}
                      className="flex-[2] py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 relative overflow-hidden"
                      style={{
                        background: isProcessing ? 'rgba(255,107,0,0.6)' : '#FF6B00',
                        boxShadow: '0 6px 24px rgba(255,107,0,0.4)',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isProcessing ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          />
                          Processing…
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          {paymentMethod === 'cod' ? 'Confirm Booking' : `Pay ₹${total.toLocaleString('en-IN')}`}
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── RIGHT: Price Summary ── */}
          <div className="lg:sticky lg:top-24 h-fit flex flex-col gap-4">
            {/* Provider card */}
            <div
              className="p-4 rounded-2xl flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div
                className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                style={{ border: '1px solid rgba(255,107,0,0.3)' }}
              >
                <img
                  src={providerDetail.photo}
                  alt={providerDetail.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(providerDetail.name)}&background=1a1a1a&color=FF6B00&size=48&bold=true`;
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-white truncate">{providerDetail.name}</p>
                  {providerDetail.verified && <BadgeCheck className="w-4 h-4 flex-shrink-0" style={{ color: '#FF6B00' }} />}
                </div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{providerDetail.service}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3" style={{ fill: '#FF6B00', color: '#FF6B00' }} />
                  <span className="text-xs font-medium text-white">{providerDetail.rating}</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>({providerDetail.reviews})</span>
                </div>
              </div>
            </div>

            {/* Slot info */}
            <div
              className="p-4 rounded-2xl flex flex-col gap-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#FF6B00' }} />
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{providerDetail.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#FF6B00' }} />
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {formattedDate} at {timeStr}
                </span>
              </div>
            </div>

            {/* Price breakdown */}
            <div
              className="p-5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h3 className="text-sm font-bold text-white mb-4">Price Breakdown</h3>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{service.name}</span>
                  <span className="text-white">₹{basePrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Platform fee</span>
                  <span className="text-white">₹{PLATFORM_FEE}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>GST (18%)</span>
                  <span className="text-white">₹{gst}</span>
                </div>
                <div
                  className="flex justify-between text-base font-bold pt-3 mt-1"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <span className="text-white">Total</span>
                  <span style={{ color: '#FF6B00' }}>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Trust */}
            <div className="flex flex-col gap-2">
              {[
                { icon: ShieldCheck, text: 'Secure & encrypted payment' },
                { icon: BadgeCheck, text: 'Background-verified provider' },
                { icon: Clock, text: 'Free cancellation up to 2 hrs before' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#FF6B00' }} />
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
