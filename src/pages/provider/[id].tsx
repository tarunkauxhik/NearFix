import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star, MapPin, ShieldCheck, Clock, MessageCircle, Heart,
  Share2, ChevronLeft, ChevronRight, Check, Zap, Award,
  Languages, ArrowRight, ThumbsUp, BadgeCheck,
} from 'lucide-react';
import { providers } from '@/data/providers';
import { getProviderDetail } from '@/data/providerDetails';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return { day: DAYS[d.getDay()], date: d.getDate(), month: MONTHS[d.getMonth()] };
}

export default function ProviderProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const provider = providers.find((p) => p.id === id);
  const detail = id ? getProviderDetail(id) : null;

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [beforeAfterPos, setBeforeAfterPos] = useState(50); // slider %
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'portfolio' | 'reviews'>('services');
  const [calendarWeekStart, setCalendarWeekStart] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  // Generate 7 days from today
  const today = new Date();
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + calendarWeekStart);
    return d.toISOString().split('T')[0];
  });

  // Before/after drag
  const handleSliderDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    setBeforeAfterPos(pct);
  };

  useEffect(() => {
    if (detail?.services[0]) setSelectedService(detail.services[0].id);
  }, [detail]);

  if (!provider || !detail) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D0D' }}>
        <div className="text-center">
          <p className="text-white/50 mb-4">Provider not found</p>
          <Link to="/" className="text-sm font-semibold" style={{ color: '#FF6B00' }}>← Back to Home</Link>
        </div>
      </div>
    );
  }

  const selectedServiceData = detail.services.find((s) => s.id === selectedService);
  const availableSlots = selectedDate ? (detail.availability[selectedDate] || []) : [];
  const canBook = selectedService && selectedDate && selectedTime;

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh' }}>
      <title>{detail.name} — {detail.service} | NearFix</title>
      <meta name="description" content={`Book ${detail.name}, verified ${detail.service} in ${detail.location}. ${detail.rating}★ rating, ${detail.completedJobs} jobs completed.`} />

      {/* Back nav */}
      <div className="pt-20 pb-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm transition-colors duration-200"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#FF6B00'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
        >
          <ChevronLeft className="w-4 h-4" />
          Back to results
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-8">

            {/* Hero Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Cover / Photo */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={detail.photo}
                  alt={detail.name}
                  className="w-full h-full object-cover object-top"
                  style={{ filter: 'brightness(0.6)' }}
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(detail.name)}&background=1a1a1a&color=FF6B00&size=400&bold=true`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Action buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSaved(!saved)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                    style={{
                      background: saved ? 'rgba(239,68,68,0.2)' : 'rgba(0,0,0,0.5)',
                      border: saved ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <Heart className="w-4 h-4" style={{ fill: saved ? '#EF4444' : 'transparent', color: saved ? '#EF4444' : 'white' }} />
                  </motion.button>
                  <button
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
                  >
                    <Share2 className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Provider info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-end gap-4">
                    {/* Avatar */}
                    <div
                      className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0"
                      style={{ border: '2px solid rgba(255,107,0,0.5)', boxShadow: '0 0 20px rgba(255,107,0,0.3)' }}
                    >
                      <img
                        src={detail.photo}
                        alt={detail.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(detail.name)}&background=1a1a1a&color=FF6B00&size=64&bold=true`;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>{detail.name}</h1>
                        {detail.verified && (
                          <BadgeCheck className="w-5 h-5 flex-shrink-0" style={{ color: '#FF6B00' }} />
                        )}
                      </div>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{detail.tagline}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div
                className="grid grid-cols-4 divide-x"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                {[
                  { label: 'Rating', value: `${detail.rating}★`, sub: `${detail.reviews} reviews` },
                  { label: 'Jobs Done', value: detail.completedJobs.toString(), sub: 'Completed' },
                  { label: 'Response', value: detail.responseTime, sub: 'Avg time' },
                  { label: 'Member', value: detail.memberSince, sub: 'Since' },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="flex flex-col items-center py-4 px-2 text-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <p className="text-base font-bold text-white">{value}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap gap-2"
            >
              {detail.badges.map((badge) => (
                <div
                  key={badge}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    background: 'rgba(255,107,0,0.1)',
                    border: '1px solid rgba(255,107,0,0.2)',
                    color: '#FF6B00',
                  }}
                >
                  <Award className="w-3 h-3" />
                  {badge}
                </div>
              ))}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
              >
                <MapPin className="w-3 h-3" />
                {detail.location} · {detail.serviceRadius} radius
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
              >
                <Languages className="w-3 h-3" />
                {detail.languages.join(', ')}
              </div>
            </motion.div>

            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div
                className="flex gap-1 p-1 rounded-xl mb-6"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {(['services', 'portfolio', 'reviews'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200"
                    style={{
                      background: activeTab === tab ? '#FF6B00' : 'transparent',
                      color: activeTab === tab ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                      boxShadow: activeTab === tab ? '0 4px 12px rgba(255,107,0,0.3)' : 'none',
                    }}
                  >
                    {tab === 'reviews' ? `Reviews (${detail.reviews_list.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {/* SERVICES TAB */}
                {activeTab === 'services' && (
                  <motion.div
                    key="services"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-3"
                  >
                    {/* About */}
                    <div
                      className="p-5 rounded-2xl"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <h3 className="text-sm font-bold text-white mb-2">About</h3>
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{detail.about}</p>
                    </div>

                    {/* Services */}
                    <h3 className="text-sm font-bold text-white mt-2">Services & Pricing</h3>
                    {detail.services.map((svc) => (
                      <motion.button
                        key={svc.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedService(svc.id)}
                        className="w-full text-left p-4 rounded-2xl transition-all duration-200 relative"
                        style={{
                          background: selectedService === svc.id ? 'rgba(255,107,0,0.1)' : 'rgba(255,255,255,0.04)',
                          border: selectedService === svc.id ? '1px solid rgba(255,107,0,0.4)' : '1px solid rgba(255,255,255,0.07)',
                          boxShadow: selectedService === svc.id ? '0 0 20px rgba(255,107,0,0.1)' : 'none',
                        }}
                      >
                        {svc.popular && (
                          <span
                            className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: 'rgba(255,107,0,0.2)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.3)' }}
                          >
                            Popular
                          </span>
                        )}
                        <div className="flex items-start justify-between gap-4 pr-16">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {selectedService === svc.id && (
                                <div
                                  className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{ background: '#FF6B00' }}
                                >
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                              )}
                              <p className="text-sm font-bold text-white">{svc.name}</p>
                            </div>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{svc.description}</p>
                            <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                              <Clock className="w-3 h-3" /> {svc.duration}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-base font-bold text-white">{svc.price}</p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>onwards</p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}

                {/* PORTFOLIO TAB */}
                {activeTab === 'portfolio' && (
                  <motion.div
                    key="portfolio"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-6"
                  >
                    {/* Before/After Slider */}
                    {detail.beforeAfter.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-white mb-3">Before & After</h3>
                        {detail.beforeAfter.map((ba, i) => (
                          <div key={i} className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div
                              ref={sliderRef}
                              className="relative select-none cursor-col-resize"
                              style={{ height: '260px' }}
                              onMouseMove={(e) => isDragging && handleSliderDrag(e)}
                              onMouseDown={() => setIsDragging(true)}
                              onMouseUp={() => setIsDragging(false)}
                              onMouseLeave={() => setIsDragging(false)}
                              onTouchMove={handleSliderDrag}
                            >
                              {/* After (full) */}
                              <img
                                src={ba.after}
                                alt="After"
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                              {/* Before (clipped) */}
                              <div
                                className="absolute inset-0 overflow-hidden"
                                style={{ width: `${beforeAfterPos}%` }}
                              >
                                <img
                                  src={ba.before}
                                  alt="Before"
                                  className="absolute inset-0 w-full h-full object-cover"
                                  style={{ width: `${100 / (beforeAfterPos / 100)}%`, maxWidth: 'none' }}
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              </div>
                              {/* Divider */}
                              <div
                                className="absolute top-0 bottom-0 w-0.5"
                                style={{ left: `${beforeAfterPos}%`, background: 'white', boxShadow: '0 0 8px rgba(0,0,0,0.5)' }}
                              >
                                <div
                                  className="absolute top-1/2 left-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                                  style={{
                                    transform: 'translate(-50%, -50%)',
                                    background: 'white',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
                                  }}
                                >
                                  <ChevronLeft className="w-3 h-3 text-gray-700" />
                                  <ChevronRight className="w-3 h-3 text-gray-700" />
                                </div>
                              </div>
                              {/* Labels */}
                              <div className="absolute top-3 left-3 px-2 py-1 rounded text-xs font-bold text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>BEFORE</div>
                              <div className="absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>AFTER</div>
                            </div>
                            <div className="px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{ba.caption}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Portfolio Grid */}
                    <div>
                      <h3 className="text-sm font-bold text-white mb-3">Work Portfolio</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {detail.portfolio.map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.06 }}
                            className="rounded-xl overflow-hidden relative group"
                            style={{ height: '160px', border: '1px solid rgba(255,255,255,0.07)' }}
                          >
                            <img
                              src={item.slot}
                              alt={item.caption}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.parentElement!.style.background = 'rgba(255,255,255,0.04)';
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            <p
                              className="absolute bottom-2 left-2 right-2 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            >
                              {item.caption}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* REVIEWS TAB */}
                {activeTab === 'reviews' && (
                  <motion.div
                    key="reviews"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-4"
                  >
                    {/* Rating summary */}
                    <div
                      className="p-5 rounded-2xl flex items-center gap-6"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <div className="text-center">
                        <p className="text-5xl font-black text-white" style={{ fontFamily: 'var(--font-heading)' }}>{detail.rating}</p>
                        <div className="flex items-center justify-center gap-0.5 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4" style={{ fill: i < Math.floor(detail.rating) ? '#FF6B00' : 'transparent', color: i < Math.floor(detail.rating) ? '#FF6B00' : 'rgba(255,255,255,0.2)' }} />
                          ))}
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{detail.reviews} reviews</p>
                      </div>
                      <div className="flex-1 flex flex-col gap-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = detail.reviews_list.filter((r) => r.rating === star).length;
                          const pct = detail.reviews_list.length > 0 ? (count / detail.reviews_list.length) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2">
                              <span className="text-xs w-3 text-right" style={{ color: 'rgba(255,255,255,0.4)' }}>{star}</span>
                              <Star className="w-3 h-3 flex-shrink-0" style={{ fill: '#FF6B00', color: '#FF6B00' }} />
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#FF6B00' }} />
                              </div>
                              <span className="text-xs w-4" style={{ color: 'rgba(255,255,255,0.3)' }}>{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Review cards */}
                    {detail.reviews_list.map((review, i) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="p-5 rounded-2xl"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: 'rgba(255,107,0,0.15)', color: '#FF6B00', border: '1px solid rgba(255,107,0,0.2)' }}
                          >
                            {review.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold text-white">{review.author}</p>
                              <p className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>{review.date}</p>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-3 h-3" style={{ fill: i < review.rating ? '#FF6B00' : 'transparent', color: i < review.rating ? '#FF6B00' : 'rgba(255,255,255,0.2)' }} />
                              ))}
                              <span className="text-xs ml-1" style={{ color: 'rgba(255,255,255,0.35)' }}>· {review.service}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{review.text}</p>
                        <button
                          className="flex items-center gap-1.5 mt-3 text-xs transition-colors duration-200"
                          style={{ color: 'rgba(255,255,255,0.3)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#FF6B00'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          Helpful ({review.helpful})
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: Booking Panel ── */}
          <div ref={stickyRef} className="lg:sticky lg:top-24 h-fit">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
              }}
            >
              {/* Panel header */}
              <div
                className="px-5 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#FF6B00' }}>Book a Slot</p>
                    <p className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                      {selectedServiceData ? selectedServiceData.price : 'Select a service'}
                      {selectedServiceData && <span className="text-sm font-normal ml-1" style={{ color: 'rgba(255,255,255,0.4)' }}>onwards</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
                    <span className="text-xs font-medium" style={{ color: '#10B981' }}>Available</span>
                  </div>
                </div>
              </div>

              <div className="p-5 flex flex-col gap-5">
                {/* Step 1: Service */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: selectedService ? '#FF6B00' : 'rgba(255,255,255,0.1)', color: 'white' }}
                    >
                      {selectedService ? <Check className="w-3 h-3" /> : '1'}
                    </span>
                    Select Service
                  </p>
                  <div className="flex flex-col gap-2">
                    {detail.services.map((svc) => (
                      <button
                        key={svc.id}
                        onClick={() => setSelectedService(svc.id)}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-200"
                        style={{
                          background: selectedService === svc.id ? 'rgba(255,107,0,0.12)' : 'rgba(255,255,255,0.04)',
                          border: selectedService === svc.id ? '1px solid rgba(255,107,0,0.4)' : '1px solid rgba(255,255,255,0.07)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0"
                            style={{
                              borderColor: selectedService === svc.id ? '#FF6B00' : 'rgba(255,255,255,0.2)',
                              background: selectedService === svc.id ? '#FF6B00' : 'transparent',
                            }}
                          >
                            {selectedService === svc.id && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <span className="text-xs font-medium text-white">{svc.name}</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color: '#FF6B00' }}>{svc.price}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Date */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: selectedDate ? '#FF6B00' : 'rgba(255,255,255,0.1)', color: 'white' }}
                    >
                      {selectedDate ? <Check className="w-3 h-3" /> : '2'}
                    </span>
                    Pick a Date
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => setCalendarWeekStart(Math.max(0, calendarWeekStart - 7))}
                      disabled={calendarWeekStart === 0}
                      className="p-1 rounded-lg transition-all"
                      style={{ color: calendarWeekStart === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)' }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {MONTHS[new Date(weekDates[0]).getMonth()]} {new Date(weekDates[0]).getFullYear()}
                    </span>
                    <button
                      onClick={() => setCalendarWeekStart(calendarWeekStart + 7)}
                      className="p-1 rounded-lg transition-all"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {weekDates.map((dateStr) => {
                      const { day, date } = formatDate(dateStr);
                      const hasSlots = (detail.availability[dateStr] || []).length > 0;
                      const isSelected = selectedDate === dateStr;
                      const isPast = new Date(dateStr) < new Date(new Date().toDateString());
                      return (
                        <button
                          key={dateStr}
                          onClick={() => { if (!isPast && hasSlots) { setSelectedDate(dateStr); setSelectedTime(null); } }}
                          disabled={isPast || !hasSlots}
                          className="flex flex-col items-center py-2 rounded-xl transition-all duration-200"
                          style={{
                            background: isSelected ? '#FF6B00' : hasSlots && !isPast ? 'rgba(255,255,255,0.05)' : 'transparent',
                            border: isSelected ? '1px solid #FF6B00' : '1px solid rgba(255,255,255,0.07)',
                            opacity: isPast || !hasSlots ? 0.3 : 1,
                            boxShadow: isSelected ? '0 4px 12px rgba(255,107,0,0.3)' : 'none',
                            cursor: isPast || !hasSlots ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <span className="text-[9px] font-semibold uppercase" style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)' }}>{day}</span>
                          <span className="text-sm font-bold" style={{ color: isSelected ? 'white' : 'rgba(255,255,255,0.8)' }}>{date}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 3: Time */}
                {selectedDate && availableSlots.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ background: selectedTime ? '#FF6B00' : 'rgba(255,255,255,0.1)', color: 'white' }}
                      >
                        {selectedTime ? <Check className="w-3 h-3" /> : '3'}
                      </span>
                      Pick a Time
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className="py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                          style={{
                            background: selectedTime === slot ? '#FF6B00' : 'rgba(255,255,255,0.05)',
                            border: selectedTime === slot ? '1px solid #FF6B00' : '1px solid rgba(255,255,255,0.08)',
                            color: selectedTime === slot ? 'white' : 'rgba(255,255,255,0.7)',
                            boxShadow: selectedTime === slot ? '0 4px 12px rgba(255,107,0,0.3)' : 'none',
                          }}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Summary */}
                {canBook && selectedServiceData && selectedDate && selectedTime && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl"
                    style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)' }}
                  >
                    <p className="text-xs font-semibold text-white mb-2">Booking Summary</p>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Service</span>
                        <span className="text-white font-medium">{selectedServiceData.name}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Date & Time</span>
                        <span className="text-white font-medium">
                          {new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {selectedTime}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Provider</span>
                        <span className="text-white font-medium">{detail.name}</span>
                      </div>
                      <div
                        className="flex justify-between text-xs pt-2 mt-1"
                        style={{ borderTop: '1px solid rgba(255,107,0,0.2)' }}
                      >
                        <span className="font-semibold text-white">Total</span>
                        <span className="font-bold" style={{ color: '#FF6B00' }}>{selectedServiceData.price}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Book Now CTA */}
                <Link
                  to={canBook ? `/booking?provider=${detail.id}&service=${selectedService}&date=${selectedDate}&time=${selectedTime}` : '#'}
                  onClick={(e) => { if (!canBook) e.preventDefault(); }}
                  className="block w-full py-3.5 rounded-xl text-sm font-bold text-white text-center transition-all duration-200"
                  style={{
                    background: canBook ? '#FF6B00' : 'rgba(255,255,255,0.08)',
                    boxShadow: canBook ? '0 6px 24px rgba(255,107,0,0.4)' : 'none',
                    color: canBook ? 'white' : 'rgba(255,255,255,0.3)',
                    cursor: canBook ? 'pointer' : 'not-allowed',
                  }}
                >
                  {canBook ? (
                    <span className="flex items-center justify-center gap-2">
                      Confirm Booking <ArrowRight className="w-4 h-4" />
                    </span>
                  ) : (
                    'Select service, date & time'
                  )}
                </Link>

                {/* Trust signals */}
                <div className="flex flex-col gap-2">
                  {[
                    { icon: ShieldCheck, text: 'Background verified provider' },
                    { icon: Zap, text: 'Instant booking confirmation' },
                    { icon: MessageCircle, text: 'Free cancellation up to 2 hrs before' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#FF6B00' }} />
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
