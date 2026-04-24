import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, SlidersHorizontal, Star, ShieldCheck, TrendingUp, Users, Zap, ChevronRight, ArrowRight } from 'lucide-react';
import ProviderCard from '@/components/ProviderCard';
import MapPlaceholder from '@/components/MapPlaceholder';
import { categories, providers } from '@/data/providers';
import { buildProviderDiscoverySearchParams, filterAndSortProviders } from '@/lib/provider-discovery';
import { type ProviderCategory } from '@/lib/access';
import UseMyLocationButton from '@/components/location/UseMyLocationButton';
import { discoveryLabelFromSnapshot, readStoredLocation } from '@/lib/nearfix-location-storage';

const stats = [
  { value: '50K+', label: 'Happy Customers', icon: Users },
  { value: '500+', label: 'Verified Providers', icon: ShieldCheck },
  { value: '4.8★', label: 'Average Rating', icon: Star },
  { value: '15min', label: 'Avg Response Time', icon: Zap },
];

const categoryColorMap: Record<string, string> = {
  electrician: '#FF6B00',
  plumber: '#3B82F6',
  tutor: '#10B981',
  beautician: '#EC4899',
  carpenter: '#F59E0B',
  'ac-repair': '#8B5CF6',
  'pest-control': '#EF4444',
  cleaning: '#06B6D4',
};

const heroCategoryIds: ProviderCategory[] = [
  'electrician',
  'plumber',
  'tutor',
  'beautician',
  'ac-repair',
  'carpenter',
];

const topRatedCategoryIds: Array<ProviderCategory | null> = [
  null,
  'electrician',
  'plumber',
  'tutor',
  'beautician',
  'carpenter',
  'ac-repair',
];

const bentoTileConfig: Array<{
  id: ProviderCategory;
  delay: number;
  className: string;
  baseStyle: CSSProperties;
  hoverBorder: string;
  hoverShadow: string;
  iconClassName: string;
  titleClassName: string;
  metaLabel?: string;
}> = [
  {
    id: 'electrician',
    delay: 0,
    className: 'row-span-2 rounded-2xl p-5 flex flex-col justify-between text-left relative overflow-hidden',
    baseStyle: {
      background: 'rgba(255,107,0,0.08)',
      border: '1px solid rgba(255,107,0,0.15)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    hoverBorder: 'rgba(255,107,0,0.4)',
    hoverShadow: '0 0 30px rgba(255,107,0,0.15)',
    iconClassName: 'text-4xl',
    titleClassName: 'text-base font-bold text-white mb-1',
  },
  {
    id: 'plumber',
    delay: 0.05,
    className: 'rounded-2xl p-4 flex flex-col justify-between text-left',
    baseStyle: {
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    hoverBorder: 'rgba(59,130,246,0.4)',
    hoverShadow: '0 0 24px rgba(59,130,246,0.15)',
    iconClassName: 'text-2xl',
    titleClassName: 'text-sm font-bold text-white',
  },
  {
    id: 'tutor',
    delay: 0.1,
    className: 'rounded-2xl p-4 flex flex-col justify-between text-left',
    baseStyle: {
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    hoverBorder: 'rgba(16,185,129,0.4)',
    hoverShadow: '0 0 24px rgba(16,185,129,0.15)',
    iconClassName: 'text-2xl',
    titleClassName: 'text-sm font-bold text-white',
  },
  {
    id: 'carpenter',
    delay: 0.15,
    className: 'rounded-2xl p-4 flex flex-col justify-between text-left',
    baseStyle: {
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    hoverBorder: 'rgba(245,158,11,0.4)',
    hoverShadow: '0 0 24px rgba(245,158,11,0.15)',
    iconClassName: 'text-2xl',
    titleClassName: 'text-sm font-bold text-white',
  },
  {
    id: 'ac-repair',
    delay: 0.2,
    className: 'rounded-2xl p-4 flex flex-col justify-between text-left',
    baseStyle: {
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    hoverBorder: 'rgba(139,92,246,0.4)',
    hoverShadow: '0 0 24px rgba(139,92,246,0.15)',
    iconClassName: 'text-2xl',
    titleClassName: 'text-sm font-bold text-white',
  },
  {
    id: 'beautician',
    delay: 0.25,
    className: 'col-span-2 rounded-2xl p-4 flex items-center gap-4 text-left',
    baseStyle: {
      background: 'rgba(236,72,153,0.08)',
      border: '1px solid rgba(236,72,153,0.15)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    hoverBorder: 'rgba(236,72,153,0.4)',
    hoverShadow: '0 0 30px rgba(236,72,153,0.12)',
    iconClassName: 'text-3xl',
    titleClassName: 'text-base font-bold text-white',
    metaLabel: 'Home visits available',
  },
  {
    id: 'pest-control',
    delay: 0.3,
    className: 'rounded-2xl p-4 flex flex-col justify-between text-left',
    baseStyle: {
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    hoverBorder: 'rgba(239,68,68,0.4)',
    hoverShadow: '0 0 24px rgba(239,68,68,0.12)',
    iconClassName: 'text-2xl',
    titleClassName: 'text-sm font-bold text-white',
  },
  {
    id: 'cleaning',
    delay: 0.35,
    className: 'row-span-2 rounded-2xl p-5 flex flex-col justify-between text-left relative overflow-hidden',
    baseStyle: {
      background: 'rgba(6,182,212,0.08)',
      border: '1px solid rgba(6,182,212,0.15)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      gridColumn: '4',
      gridRow: '1 / span 2',
    },
    hoverBorder: 'rgba(6,182,212,0.4)',
    hoverShadow: '0 0 30px rgba(6,182,212,0.15)',
    iconClassName: 'text-4xl',
    titleClassName: 'text-base font-bold text-white mb-1',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<ProviderCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [availability, setAvailability] = useState<'now' | 'today' | 'tomorrow' | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);

  const didHydrateLocation = useRef(false);
  useEffect(() => {
    if (didHydrateLocation.current) return;
    didHydrateLocation.current = true;
    const snap = readStoredLocation();
    if (snap) {
      setSelectedLocation(discoveryLabelFromSnapshot(snap));
    }
  }, []);

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    []
  );

  const discoveryFilters = {
    search: searchQuery,
    category: selectedCategory,
    location: selectedLocation,
    availability,
    minRating,
    maxPrice,
    maxDistanceKm,
    sortBy: 'rating' as const,
  };

  const filteredProviders = filterAndSortProviders(providers, discoveryFilters);
  const previewProviders = filteredProviders.slice(0, 8);
  const activeAdvancedFilterCount = [
    minRating !== null,
    maxPrice !== null,
    maxDistanceKm !== null,
    availability !== null,
  ].filter(Boolean).length;

  function submitDiscoverySearch() {
    const params = buildProviderDiscoverySearchParams(discoveryFilters);
    navigate({
      pathname: '/services',
      search: params.toString() ? `?${params.toString()}` : '',
    });
  }

  function toggleCategory(category: ProviderCategory | null) {
    setSelectedCategory((current) => (current === category ? null : category));
  }

  function clearAdvancedFilters() {
    setMinRating(null);
    setMaxPrice(null);
    setMaxDistanceKm(null);
    setAvailability(null);
  }

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh' }}>
      <title>NearFix — Hyperlocal Service Booking in India</title>
      <meta name="description" content="Book trusted electricians, plumbers, tutors, beauticians, carpenters, and AC repair technicians near you. India's premium hyperlocal service platform." />

      {/* ─── HERO ─── */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(255,107,0,0.08) 0%, transparent 70%)',
            transform: 'translate(20%, -20%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)',
            transform: 'translate(-30%, 30%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Headline */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
                style={{
                  background: 'rgba(255,107,0,0.1)',
                  border: '1px solid rgba(255,107,0,0.25)',
                  color: '#FF6B00',
                }}
              >
                <motion.span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#FF6B00' }}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                Now live in 50+ Indian cities
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="font-bold leading-[1.05] mb-6"
                style={{
                  fontSize: 'clamp(40px, 5vw, 68px)',
                  fontFamily: 'var(--font-heading)',
                  color: '#FFFFFF',
                }}
              >
                Your City.{' '}
                <br />
                Your Service.{' '}
                <br />
                <span style={{ color: '#FF6B00', textShadow: '0 0 40px rgba(255,107,0,0.4)' }}>
                  On Demand.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg mb-8 leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.55)', maxWidth: '440px' }}
              >
                Book verified electricians, plumbers, tutors, and more — right in your neighbourhood. Transparent pricing. Instant confirmation.
              </motion.p>

              {/* Search Bar */}
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mb-6 flex w-full max-w-2xl flex-col gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitDiscoverySearch();
                }}
              >
                <div
                  className="flex h-[52px] w-full items-center gap-3 rounded-xl px-4 transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: searchFocused ? '1px solid rgba(255,107,0,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: searchFocused ? '0 0 0 3px rgba(255,107,0,0.1)' : 'none',
                  }}
                >
                  <Search className="w-4 h-4 flex-shrink-0" style={{ color: searchFocused ? '#FF6B00' : 'rgba(255,255,255,0.3)' }} />
                  <input
                    type="text"
                    placeholder="Search service or provider..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
                  <div
                    className="flex min-h-[52px] min-w-0 flex-1 items-center gap-2 rounded-xl px-3"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: '13px',
                    }}
                  >
                    <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: '#FF6B00' }} />
                    <input
                      type="text"
                      placeholder="City, neighborhood, or area (optional)"
                      value={selectedLocation ?? ''}
                      onChange={(event) => {
                        const v = event.target.value;
                        setSelectedLocation(v === '' ? null : v);
                      }}
                      className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                      style={{ color: '#FFFFFF' }}
                    />
                  </div>
                  <UseMyLocationButton
                    variant="compact"
                    className="sm:shrink-0 sm:self-center"
                    onResolved={(snapshot) => setSelectedLocation(discoveryLabelFromSnapshot(snapshot))}
                  />
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    className="h-[52px] w-full shrink-0 rounded-xl px-5 text-sm font-bold text-white sm:w-auto sm:min-w-[100px]"
                    style={{
                      background: '#FF6B00',
                      boxShadow: '0 4px 20px rgba(255,107,0,0.4)',
                    }}
                  >
                    Search
                  </motion.button>
                </div>
              </motion.form>

              {/* Category Pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-wrap gap-2"
              >
                {heroCategoryIds.map((categoryId, i) => {
                  const category = categoriesById.get(categoryId);
                  const active = selectedCategory === categoryId;

                  if (!category) return null;

                  return (
                    <motion.button
                      key={category.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
                      style={{
                        background: active ? `${categoryColorMap[category.id]}20` : 'rgba(255,255,255,0.06)',
                        border: active
                          ? `1px solid ${categoryColorMap[category.id]}55`
                          : '1px solid rgba(255,255,255,0.1)',
                        color: active ? categoryColorMap[category.id] : 'rgba(255,255,255,0.7)',
                      }}
                      onClick={() => toggleCategory(category.id)}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.borderColor = 'rgba(255,107,0,0.4)';
                          e.currentTarget.style.color = '#FF6B00';
                          e.currentTarget.style.background = 'rgba(255,107,0,0.08)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                          e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        }
                      }}
                    >
                      {category.label}
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>

            {/* Right: Floating Provider Card Preview */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:flex justify-center items-center relative"
            >
              {/* Glow behind card */}
              <div
                className="absolute w-72 h-72 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(255,107,0,0.12) 0%, transparent 70%)' }}
              />

              {/* Main floating card */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' as const }}
                className="relative w-72 rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,107,0,0.1)',
                }}
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src="https://ui-avatars.com/api/?name=Rajesh+Kumar&background=1a1a1a&color=FF6B00&size=400&bold=true"
                    alt="Rajesh Kumar"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
                    style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', color: '#10B981', backdropFilter: 'blur(8px)' }}
                  >
                    <motion.span className="w-1.5 h-1.5 rounded-full bg-green-400" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    Available Now
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#FF6B00' }}>Electrician</p>
                  <h3 className="text-base font-bold text-white mb-1">Rajesh Kumar</h3>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3" style={{ fill: '#FF6B00', color: '#FF6B00' }} />
                      ))}
                      <span className="text-xs text-white ml-1">4.8 (124)</span>
                    </div>
                    <span className="text-sm font-bold text-white">₹299/visit</span>
                  </div>
                  <div
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white text-center"
                    style={{ background: '#FF6B00', boxShadow: '0 4px 16px rgba(255,107,0,0.4)' }}
                  >
                    Book Now
                  </div>
                </div>
              </motion.div>

              {/* Floating mini card — rating */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' as const, delay: 0.5 }}
                className="absolute -bottom-4 -left-8 px-3 py-2 rounded-xl"
                style={{
                  background: 'rgba(16,185,129,0.15)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <p className="text-xs font-bold text-white">⭐ 4.9 Rating</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Top Provider</p>
              </motion.div>

              {/* Floating mini card — bookings */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' as const, delay: 1 }}
                className="absolute -top-4 -right-4 px-3 py-2 rounded-xl"
                style={{
                  background: 'rgba(255,107,0,0.15)',
                  border: '1px solid rgba(255,107,0,0.3)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <p className="text-xs font-bold text-white">312 Jobs Done</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>This month</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {stats.map(({ value, label, icon: Icon }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col items-center justify-center py-8 px-4 text-center"
                style={{ background: '#0D0D0D' }}
              >
                <Icon className="w-5 h-5 mb-2" style={{ color: '#FF6B00' }} />
                <p className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{value}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MAP SECTION ─── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: '#FF6B00' }}
              >
                Live Map
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl font-bold text-white"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Providers Near You
              </motion.h2>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="hidden sm:flex items-center gap-4 text-xs"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {[
                { color: '#FF6B00', label: 'Electrician' },
                { color: '#3B82F6', label: 'Plumber' },
                { color: '#10B981', label: 'Tutor' },
                { color: '#EC4899', label: 'Beautician' },
                { color: '#F59E0B', label: 'Carpenter' },
                { color: '#8B5CF6', label: 'AC Repair' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                  {label}
                </div>
              ))}
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <MapPlaceholder />
          </motion.div>
        </div>
      </section>

      {/* ─── CATEGORY GRID (BENTO) ─── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: '#FF6B00' }}
            >
              Browse by Category
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-white"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              What do you need fixed?
            </motion.h2>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-4 grid-rows-2 gap-3" style={{ height: '340px' }}>
            {bentoTileConfig.map((tile) => {
              const category = categoriesById.get(tile.id);
              const isActive = selectedCategory === tile.id;

              if (!category) return null;

              return (
                <motion.button
                  key={tile.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: tile.delay }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  className={tile.className}
                  style={{
                    ...tile.baseStyle,
                    border: isActive
                      ? `1px solid ${categoryColorMap[tile.id]}80`
                      : tile.baseStyle.border,
                    boxShadow: isActive ? `0 0 24px ${categoryColorMap[tile.id]}20` : 'none',
                  }}
                  onClick={() => toggleCategory(tile.id)}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = tile.hoverBorder;
                      e.currentTarget.style.boxShadow = tile.hoverShadow;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = String(tile.baseStyle.border);
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <span className={tile.iconClassName}>{category.icon}</span>
                  <div>
                    <p className={tile.titleClassName}>{category.label}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {category.count} providers
                      {tile.metaLabel ? ` · ${tile.metaLabel}` : ''}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-white/45">
            Explore popular services today, and much more coming.
          </p>
        </div>
      </section>

      {/* ─── PROVIDER CARDS ─── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: '#FF6B00' }}
              >
                Top Rated
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl font-bold text-white"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Top Rated Near You
              </motion.h2>
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-2">
              {topRatedCategoryIds.map((categoryId) => {
                const active = selectedCategory === categoryId || (!selectedCategory && categoryId === null);
                const label = categoryId ? categoriesById.get(categoryId)?.label ?? categoryId : 'All';

                return (
                  <motion.button
                    key={categoryId ?? 'all'}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(categoryId)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                    style={{
                      background: active ? '#FF6B00' : 'rgba(255,255,255,0.06)',
                      border: active ? '1px solid #FF6B00' : '1px solid rgba(255,255,255,0.1)',
                      color: active ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                      boxShadow: active ? '0 4px 12px rgba(255,107,0,0.3)' : 'none',
                    }}
                  >
                    {label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Filters row */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => setShowAdvancedFilters((current) => !current)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                background: showAdvancedFilters || activeAdvancedFilterCount
                  ? 'rgba(255,107,0,0.12)'
                  : 'rgba(255,255,255,0.06)',
                border: showAdvancedFilters || activeAdvancedFilterCount
                  ? '1px solid rgba(255,107,0,0.25)'
                  : '1px solid rgba(255,255,255,0.1)',
                color: showAdvancedFilters || activeAdvancedFilterCount
                  ? '#FF6B00'
                  : 'rgba(255,255,255,0.6)',
              }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {showAdvancedFilters ? 'Hide Filters' : 'Filters'}
              {activeAdvancedFilterCount > 0 ? ` (${activeAdvancedFilterCount})` : ''}
            </button>
            {showAdvancedFilters && (
              <>
                <button
                  onClick={() => setMinRating((current) => (current === 4.5 ? null : 4.5))}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hidden sm:block"
                  style={{
                    background: minRating === 4.5 ? 'rgba(255,107,0,0.12)' : 'rgba(255,255,255,0.04)',
                    border: minRating === 4.5 ? '1px solid rgba(255,107,0,0.28)' : '1px solid rgba(255,255,255,0.08)',
                    color: minRating === 4.5 ? '#FF6B00' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  Rating 4.5+
                </button>
                <button
                  onClick={() => setMaxPrice((current) => (current === 500 ? null : 500))}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hidden sm:block"
                  style={{
                    background: maxPrice === 500 ? 'rgba(255,107,0,0.12)' : 'rgba(255,255,255,0.04)',
                    border: maxPrice === 500 ? '1px solid rgba(255,107,0,0.28)' : '1px solid rgba(255,255,255,0.08)',
                    color: maxPrice === 500 ? '#FF6B00' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  Under ₹500
                </button>
                <button
                  onClick={() => setMaxDistanceKm((current) => (current === 2 ? null : 2))}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hidden sm:block"
                  style={{
                    background: maxDistanceKm === 2 ? 'rgba(255,107,0,0.12)' : 'rgba(255,255,255,0.04)',
                    border: maxDistanceKm === 2 ? '1px solid rgba(255,107,0,0.28)' : '1px solid rgba(255,255,255,0.08)',
                    color: maxDistanceKm === 2 ? '#FF6B00' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  Within 2km
                </button>
                <button
                  onClick={() => setAvailability((current) => (current === 'now' ? null : 'now'))}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hidden sm:block"
                  style={{
                    background: availability === 'now' ? 'rgba(255,107,0,0.12)' : 'rgba(255,255,255,0.04)',
                    border: availability === 'now' ? '1px solid rgba(255,107,0,0.28)' : '1px solid rgba(255,255,255,0.08)',
                    color: availability === 'now' ? '#FF6B00' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  Available Now
                </button>
                {activeAdvancedFilterCount > 0 && (
                  <button
                    onClick={clearAdvancedFilters}
                    className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.65)',
                    }}
                  >
                    Clear
                  </button>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {previewProviders.map((provider, i) => (
              <ProviderCard key={provider.id} provider={provider} index={i} />
            ))}
          </div>

          {previewProviders.length === 0 && (
            <div className="text-center py-16">
              <p className="text-white/40 text-sm">No providers found. Try a different filter.</p>
            </div>
          )}

          {previewProviders.length > 0 && filteredProviders.length > previewProviders.length && (
            <p className="mt-4 text-sm text-white/45">
              Showing 8 of {filteredProviders.length} matching providers here. Open the full list to browse the rest.
            </p>
          )}

          <div className="mt-10 text-center">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={submitDiscoverySearch}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              View All Providers
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: '#FF6B00' }}
            >
              Simple Process
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-white"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Book in 3 steps
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Search & Filter', desc: 'Find verified providers near you by service, rating, price, and availability.', icon: Search },
              { step: '02', title: 'Book a Slot', desc: 'Pick your preferred date and time. Add your address and describe the problem.', icon: MapPin },
              { step: '03', title: 'Pay & Relax', desc: 'Pay securely via UPI, card, or wallet. Track your provider in real-time.', icon: TrendingUp },
            ].map(({ step, title, desc, icon: Icon }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-6 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.2)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: '#FF6B00' }} />
                </div>
                <span
                  className="absolute top-6 right-6 text-4xl font-black"
                  style={{ color: 'rgba(255,255,255,0.04)', fontFamily: 'var(--font-heading)' }}
                >
                  {step}
                </span>
                <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Provider CTA */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative p-8 rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,107,0,0.15) 0%, rgba(255,107,0,0.05) 100%)',
                border: '1px solid rgba(255,107,0,0.2)',
              }}
            >
              <div
                className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(255,107,0,0.15) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
              />
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#FF6B00' }}>For Professionals</p>
              <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                Are you a service provider?
              </h3>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Join 500+ verified professionals earning on NearFix. Set your own schedule, grow your client base, and get paid instantly.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard/provider"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200"
                  style={{ background: '#FF6B00', boxShadow: '0 4px 16px rgba(255,107,0,0.4)' }}
                >
                  Join as Provider
                </Link>
                <button
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  Learn More <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>

            {/* Trust CTA */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative p-8 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Why NearFix</p>
              <h3 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
                Built on trust. Backed by verification.
              </h3>
              <div className="flex flex-col gap-3">
                {[
                  { icon: ShieldCheck, text: 'All providers are background-verified' },
                  { icon: Star, text: 'Transparent ratings from real customers' },
                  { icon: Zap, text: 'Instant booking confirmation & live tracking' },
                  { icon: TrendingUp, text: 'Secure payments with full refund protection' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,107,0,0.1)' }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: '#FF6B00' }} />
                    </div>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
