import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  CheckCircle, Clock, MapPin, Phone, Star,
  Share2, Download, ChevronRight, Calendar,
  MessageCircle, ShieldCheck, Zap,
} from 'lucide-react';
import { getProviderDetail } from '@/data/providerDetails';

type TrackStep = 'confirmed' | 'assigned' | 'en_route' | 'arrived' | 'completed';

const TRACK_STEPS: { id: TrackStep; label: string; sub: string; icon: typeof Clock }[] = [
  { id: 'confirmed', label: 'Booking Confirmed', sub: 'Your slot is locked in', icon: CheckCircle },
  { id: 'assigned', label: 'Provider Assigned', sub: 'Provider notified', icon: ShieldCheck },
  { id: 'en_route', label: 'Provider En Route', sub: 'On the way to you', icon: MapPin },
  { id: 'arrived', label: 'Provider Arrived', sub: 'Work in progress', icon: Clock },
  { id: 'completed', label: 'Job Completed', sub: 'Rate your experience', icon: Star },
];

export default function BookingConfirmationPage() {
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<TrackStep>('confirmed');
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const bookingId = searchParams.get('id') || `BK${Date.now()}`;
  const providerId = searchParams.get('provider') || '';
  const serviceId = searchParams.get('service') || '';
  const dateStr = searchParams.get('date') || '';
  const timeStr = searchParams.get('time') || '';
  const total = searchParams.get('total') || '0';

  const providerDetail = getProviderDetail(providerId);
  const service = providerDetail?.services.find((s) => s.id === serviceId);

  const formattedDate = dateStr
    ? new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  // Simulate live status progression for demo
  useEffect(() => {
    const steps: TrackStep[] = ['confirmed', 'assigned', 'en_route', 'arrived', 'completed'];
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      if (idx < steps.length) {
        setCurrentStep(steps[idx]);
        if (steps[idx] === 'completed') {
          setTimeout(() => setShowRating(true), 800);
          clearInterval(interval);
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const stepIndex = TRACK_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh' }}>
      <title>Booking Confirmed — NearFix</title>
      <meta name="description" content={`Your NearFix booking ${bookingId} is confirmed.`} />

      <div className="pt-20 pb-32 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Success hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
          className="text-center mb-10"
        >
          {/* Animated checkmark */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(16,185,129,0.15)',
                border: '2px solid rgba(16,185,129,0.4)',
                boxShadow: '0 0 40px rgba(16,185,129,0.2)',
              }}
            >
              <CheckCircle className="w-10 h-10" style={{ color: '#10B981' }} />
            </motion.div>
            {/* Pulse rings */}
            {[1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full"
                style={{ border: '2px solid rgba(16,185,129,0.3)' }}
                animate={{ scale: [1, 1.8, 2.4], opacity: [0.6, 0.2, 0] }}
                transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
              />
            ))}
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-black text-white mb-2"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Booking Confirmed!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Booking ID:{' '}
            <span
              className="font-mono font-bold px-2 py-0.5 rounded"
              style={{ background: 'rgba(255,107,0,0.15)', color: '#FF6B00' }}
            >
              {bookingId}
            </span>
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-[1fr_320px] gap-6">
          {/* LEFT */}
          <div className="flex flex-col gap-5">

            {/* Live Status Tracker */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-bold text-white">Live Status</h2>
                <div className="flex items-center gap-1.5">
                  <motion.div
                    className="w-2 h-2 rounded-full"
                    style={{ background: '#10B981' }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="text-xs font-medium" style={{ color: '#10B981' }}>Live</span>
                </div>
              </div>

              <div className="flex flex-col gap-0">
                {TRACK_STEPS.map((step, i) => {
                  const done = i < stepIndex;
                  const active = i === stepIndex;
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="flex gap-4">
                      {/* Line + dot */}
                      <div className="flex flex-col items-center">
                        <motion.div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                          animate={{
                            background: done ? '#10B981' : active ? '#FF6B00' : 'rgba(255,255,255,0.08)',
                            boxShadow: active ? '0 0 16px rgba(255,107,0,0.5)' : 'none',
                          }}
                          transition={{ duration: 0.4 }}
                        >
                          <Icon className="w-4 h-4 text-white" />
                        </motion.div>
                        {i < TRACK_STEPS.length - 1 && (
                          <motion.div
                            className="w-0.5 flex-1 my-1"
                            style={{ minHeight: '24px' }}
                            animate={{ background: done ? '#10B981' : 'rgba(255,255,255,0.08)' }}
                            transition={{ duration: 0.4 }}
                          />
                        )}
                      </div>
                      {/* Text */}
                      <div className="pb-5 flex-1">
                        <p
                          className="text-sm font-semibold"
                          style={{ color: done || active ? 'white' : 'rgba(255,255,255,0.3)' }}
                        >
                          {step.label}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {step.sub}
                        </p>
                        {active && (
                          <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: '100%' }}
                            className="mt-2 h-1 rounded-full overflow-hidden"
                            style={{ background: 'rgba(255,255,255,0.08)', maxWidth: '120px' }}
                          >
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: '#FF6B00' }}
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Rating panel (appears after completion) */}
            {showRating && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="p-5 rounded-2xl"
                style={{
                  background: 'rgba(255,107,0,0.08)',
                  border: '1px solid rgba(255,107,0,0.25)',
                  boxShadow: '0 0 30px rgba(255,107,0,0.1)',
                }}
              >
                <h2 className="text-sm font-bold text-white mb-1">How was the service?</h2>
                <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Your feedback helps other residents choose the right provider
                </p>
                <div className="flex items-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      <Star
                        className="w-8 h-8 transition-all duration-150"
                        style={{
                          fill: star <= (hoverRating || rating) ? '#FF6B00' : 'transparent',
                          color: star <= (hoverRating || rating) ? '#FF6B00' : 'rgba(255,255,255,0.2)',
                        }}
                      />
                    </motion.button>
                  ))}
                </div>
                {rating > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200"
                    style={{ background: '#FF6B00', boxShadow: '0 4px 16px rgba(255,107,0,0.4)' }}
                  >
                    Submit Review
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-3"
            >
              {[
                { icon: MessageCircle, label: 'Chat with Provider', color: '#3B82F6' },
                { icon: Phone, label: 'Call Provider', color: '#10B981' },
                { icon: Share2, label: 'Share Booking', color: '#8B5CF6' },
                { icon: Download, label: 'Download Receipt', color: '#F59E0B' },
              ].map(({ icon: Icon, label, color }) => (
                <button
                  key={label}
                  className="flex items-center gap-3 p-4 rounded-xl transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <span className="text-xs font-medium text-white">{label}</span>
                </button>
              ))}
            </motion.div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-4">
            {/* Booking details card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="p-5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <h3 className="text-sm font-bold text-white mb-4">Booking Details</h3>
              {providerDetail && (
                <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div
                    className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ border: '1px solid rgba(255,107,0,0.3)' }}
                  >
                    <img
                      src={providerDetail.photo}
                      alt={providerDetail.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(providerDetail.name)}&background=1a1a1a&color=FF6B00&size=44&bold=true`;
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{providerDetail.name}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{providerDetail.service}</p>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-3">
                {[
                  { icon: Zap, label: 'Service', value: service?.name || '—' },
                  { icon: Calendar, label: 'Date', value: formattedDate },
                  { icon: Clock, label: 'Time', value: timeStr },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,107,0,0.1)' }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: '#FF6B00' }} />
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
                      <p className="text-sm font-medium text-white">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Total paid */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="p-4 rounded-2xl flex items-center justify-between"
              style={{
                background: 'rgba(255,107,0,0.08)',
                border: '1px solid rgba(255,107,0,0.2)',
              }}
            >
              <div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Total Paid</p>
                <p className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  ₹{parseInt(total).toLocaleString('en-IN')}
                </p>
              </div>
              <div
                className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}
              >
                Paid
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
              className="flex flex-col gap-2"
            >
              <Link
                to="/"
                className="w-full py-3 rounded-xl text-sm font-bold text-white text-center flex items-center justify-center gap-2 transition-all duration-200"
                style={{ background: '#FF6B00', boxShadow: '0 4px 16px rgba(255,107,0,0.35)' }}
              >
                Book Another Service <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="w-full py-3 rounded-xl text-sm font-medium text-center transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                Back to Home
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
