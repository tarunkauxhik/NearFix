import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'motion/react';
import { Search, Star, MapPin, ChevronRight, BadgeCheck, Zap, Filter } from 'lucide-react';
import { providers, categories } from '@/data/providers';
import {
  buildProviderDiscoverySearchParams,
  filterAndSortProviders,
  parseProviderDiscoveryFilters,
  type ProviderSortOption,
} from '@/lib/provider-discovery';
import {
  getSignedInHome,
  getViewerStateFromSession,
  type ProviderCategory,
} from '@/lib/access';
import { useViewer } from '@/lib/useViewer';
import UseMyLocationButton from '@/components/location/UseMyLocationButton';
import { discoveryLabelFromSnapshot, readStoredLocation } from '@/lib/nearfix-location-storage';

const CATEGORY_COLORS: Record<string, string> = {
  electrician: '#F59E0B',
  plumber:     '#3B82F6',
  tutor:       '#10B981',
  beautician:  '#EC4899',
  carpenter:   '#F97316',
  'ac-repair': '#8B5CF6',
  'pest-control': '#84CC16',
  cleaning:    '#06B6D4',
};

const SORT_OPTIONS = [
  { value: 'rating', label: 'Top Rated' },
  { value: 'distance', label: 'Nearest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const AVAILABILITY_OPTIONS: Array<{
  value: 'now' | 'today' | 'tomorrow' | null;
  label: string;
}> = [
  { value: null, label: 'Any time' },
  { value: 'now', label: 'Available Now' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
];

export default function ServicesPage() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const viewerQuery = useViewer();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = useMemo(
    () => parseProviderDiscoveryFilters(searchParams),
    [searchParams]
  );

  const [search, setSearch] = useState(() => initialFilters.search);
  const [selectedCategory, setSelectedCategory] = useState<ProviderCategory | null>(
    () => initialFilters.category
  );
  const [selectedLocation, setSelectedLocation] = useState<string | null>(() => initialFilters.location);
  const [selectedAvailability, setSelectedAvailability] = useState<'now' | 'today' | 'tomorrow' | null>(
    () => initialFilters.availability
  );
  const [minRating, setMinRating] = useState<number | null>(() => initialFilters.minRating);
  const [maxPrice, setMaxPrice] = useState<number | null>(() => initialFilters.maxPrice);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | null>(() => initialFilters.maxDistanceKm);
  const [sortBy, setSortBy] = useState<ProviderSortOption>(() => initialFilters.sortBy);

  const locationHydrated = useRef(false);
  useEffect(() => {
    if (locationHydrated.current) return;
    locationHydrated.current = true;
    if (searchParams.get('location')) return;
    const snap = readStoredLocation();
    if (snap) {
      setSelectedLocation(discoveryLabelFromSnapshot(snap));
    }
  }, [searchParams]);

  const discoveryFilters = useMemo(
    () => ({
      search,
      category: selectedCategory,
      location: selectedLocation,
      availability: selectedAvailability,
      minRating,
      maxPrice,
      maxDistanceKm,
      sortBy,
    }),
    [search, selectedCategory, selectedLocation, selectedAvailability, minRating, maxPrice, maxDistanceKm, sortBy]
  );

  const sorted = filterAndSortProviders(providers, discoveryFilters);
  const viewerState = getViewerStateFromSession(Boolean(isSignedIn), viewerQuery.data);

  function handleRequestService() {
    if (!isSignedIn) {
      navigate('/booking');
      return;
    }

    if (!viewerQuery.data) {
      navigate('/auth/post-auth');
      return;
    }

    if (viewerState === 'customer') {
      navigate('/booking');
      return;
    }

    if (viewerState === 'signed_in_unassigned') {
      navigate('/onboarding');
      return;
    }

    navigate(getSignedInHome(viewerQuery.data));
  }

  const requestServiceLabel =
    viewerState === 'signed_in_unassigned'
      ? 'Complete Setup First'
      : viewerState === 'customer' || viewerState === 'visitor'
        ? 'Request a Service'
        : 'Go to My Home';

  useEffect(() => {
    const nextParams = buildProviderDiscoverySearchParams(discoveryFilters);
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    discoveryFilters,
    searchParams,
    setSearchParams,
  ]);

  return (
    <div style={{ background: '#0D0D0D', minHeight: '100vh' }}>
      <title>Browse Services — NearFix</title>
      <meta name="description" content="Find trusted local service providers near you — electricians, plumbers, tutors, beauticians and more in Bengaluru." />

      <div className="pt-24 pb-32 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Page header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1
            className="text-3xl sm:text-4xl font-black text-white mb-2"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Browse <span style={{ color: '#FF6B00' }}>Services</span>
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {providers.length} verified providers near {selectedLocation || 'you'}
          </p>
        </motion.div>

        {/* ── Search bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative mb-6"
        >
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          />
          <input
            type="text"
            placeholder="Search by service, provider name, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm text-white outline-none transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255,107,0,0.5)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          />
        </motion.div>

        {/* ── Category chips ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none"
        >
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0 transition-all duration-200"
            style={{
              background: !selectedCategory ? '#FF6B00' : 'rgba(255,255,255,0.06)',
              color: !selectedCategory ? 'white' : 'rgba(255,255,255,0.5)',
              boxShadow: !selectedCategory ? '0 3px 12px rgba(255,107,0,0.35)' : 'none',
            }}
          >
            All
          </button>
          {categories.map((cat) => {
            const color = CATEGORY_COLORS[cat.id] || '#FF6B00';
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(active ? null : cat.id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0 transition-all duration-200"
                style={{
                  background: active ? `${color}20` : 'rgba(255,255,255,0.06)',
                  color: active ? color : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${active ? color + '40' : 'transparent'}`,
                }}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            );
          })}
        </motion.div>

        {/* ── Filters row ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between gap-4 mb-6 flex-wrap"
        >
          {/* Availability + advanced filters */}
          <div className="flex gap-2 flex-wrap">
            {AVAILABILITY_OPTIONS.map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setSelectedAvailability(value)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                style={{
                  background: selectedAvailability === value ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
                  color: selectedAvailability === value ? '#10B981' : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${selectedAvailability === value ? 'rgba(16,185,129,0.25)' : 'transparent'}`,
                }}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setMinRating((current) => (current === 4.5 ? null : 4.5))}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{
                background: minRating === 4.5 ? 'rgba(255,107,0,0.12)' : 'rgba(255,255,255,0.05)',
                color: minRating === 4.5 ? '#FF6B00' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${minRating === 4.5 ? 'rgba(255,107,0,0.25)' : 'transparent'}`,
              }}
            >
              Rating 4.5+
            </button>
            <button
              onClick={() => setMaxPrice((current) => (current === 500 ? null : 500))}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{
                background: maxPrice === 500 ? 'rgba(255,107,0,0.12)' : 'rgba(255,255,255,0.05)',
                color: maxPrice === 500 ? '#FF6B00' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${maxPrice === 500 ? 'rgba(255,107,0,0.25)' : 'transparent'}`,
              }}
            >
              Under ₹500
            </button>
            <button
              onClick={() => setMaxDistanceKm((current) => (current === 2 ? null : 2))}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{
                background: maxDistanceKm === 2 ? 'rgba(255,107,0,0.12)' : 'rgba(255,255,255,0.05)',
                color: maxDistanceKm === 2 ? '#FF6B00' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${maxDistanceKm === 2 ? 'rgba(255,107,0,0.25)' : 'transparent'}`,
              }}
            >
              Within 2km
            </button>
          </div>

          {/* Location + Sort */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex min-w-[min(100%,220px)] flex-1 items-center gap-2 rounded-xl px-2 py-1.5 sm:min-w-[200px] sm:max-w-md"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" style={{ color: '#FF6B00' }} />
              <input
                type="text"
                placeholder="City, area, or neighborhood (optional)"
                value={selectedLocation ?? ''}
                onChange={(event) => {
                  const v = event.target.value;
                  setSelectedLocation(v === '' ? null : v);
                }}
                className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-white placeholder:text-white/25 outline-none"
                style={{ color: 'rgba(255,255,255,0.85)' }}
              />
            </div>
            <UseMyLocationButton
              variant="compact"
              className="shrink-0"
              onResolved={(snapshot) => setSelectedLocation(discoveryLabelFromSnapshot(snapshot))}
              onLocationCleared={() => setSelectedLocation(null)}
            />
            <Filter className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.35)' }} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ProviderSortOption)}
              className="cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} style={{ background: '#1A1A1A' }}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory(null);
                setSelectedLocation(null);
                setSelectedAvailability(null);
                setMinRating(null);
                setMaxPrice(null);
                setMaxDistanceKm(null);
                setSortBy('rating');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.45)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              Reset
            </button>
          </div>
        </motion.div>

        {/* ── Results count ── */}
        <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Showing <span className="text-white font-semibold">{sorted.length}</span> provider{sorted.length !== 1 ? 's' : ''}
          {selectedCategory && (
            <> in <span className="text-white font-semibold capitalize">{selectedCategory.replace('-', ' ')}</span></>
          )}
        </p>

        {/* ── Provider grid ── */}
        {sorted.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-20 gap-4"
          >
            <Search className="w-12 h-12" style={{ color: 'rgba(255,255,255,0.1)' }} />
            <p className="text-base font-bold text-white">No providers found</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Try adjusting your search or filters
            </p>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory(null);
                setSelectedLocation(null);
                setSelectedAvailability(null);
                setMinRating(null);
                setMaxPrice(null);
                setMaxDistanceKm(null);
                setSortBy('rating');
              }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: '#FF6B00' }}
            >
              Clear Filters
            </button>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((provider, i) => {
              const color = CATEGORY_COLORS[provider.category] || '#FF6B00';
              const availColor =
                provider.availability === 'now' ? '#10B981' :
                provider.availability === 'today' ? '#3B82F6' : 'rgba(255,255,255,0.4)';

              return (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group rounded-2xl overflow-hidden flex flex-col"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${color}30`;
                    e.currentTarget.style.boxShadow = `0 8px 32px ${color}12`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Photo */}
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={provider.photo}
                      alt={provider.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&background=1a1a1a&color=FF6B00&size=200&bold=true`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />

                    {/* Availability badge */}
                    <div
                      className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ background: 'rgba(0,0,0,0.7)', color: availColor, backdropFilter: 'blur(8px)' }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: availColor,
                          boxShadow: provider.availability === 'now' ? `0 0 6px ${availColor}` : 'none',
                        }}
                      />
                      {provider.availabilityLabel}
                    </div>

                    {/* Verified badge */}
                    {provider.verified && (
                      <div
                        className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(0,0,0,0.7)', color: '#10B981', backdropFilter: 'blur(8px)' }}
                      >
                        <BadgeCheck className="w-3 h-3" />
                        Verified
                      </div>
                    )}

                    {/* Category pill */}
                    <div
                      className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ background: `${color}25`, color, backdropFilter: 'blur(8px)', border: `1px solid ${color}30` }}
                    >
                      {provider.service}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-black text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                          {provider.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <MapPin className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.35)' }} />
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            {provider.location} · {provider.distance}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-black" style={{ color: '#FF6B00' }}>
                          {provider.price}
                        </p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          per {provider.priceUnit}
                        </p>
                      </div>
                    </div>

                    {/* Rating + jobs */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" style={{ fill: '#FF6B00', color: '#FF6B00' }} />
                        <span className="text-sm font-bold text-white">{provider.rating}</span>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          ({provider.reviews})
                        </span>
                      </div>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.35)' }} />
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          {provider.completedJobs} jobs done
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="flex gap-2 mt-auto pt-1">
                      <Link
                        to={`/provider/${provider.id}`}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center transition-all duration-200"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          color: 'rgba(255,255,255,0.6)',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        View Profile
                      </Link>
                      <Link
                        to={`/provider/${provider.id}`}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-center text-white transition-all duration-200 flex items-center justify-center gap-1.5"
                        style={{ background: '#FF6B00', boxShadow: '0 4px 14px rgba(255,107,0,0.3)' }}
                      >
                        Book <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Bottom CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 p-8 rounded-3xl text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255,107,0,0.1) 0%, rgba(255,107,0,0.04) 100%)',
            border: '1px solid rgba(255,107,0,0.2)',
          }}
        >
          <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Don't see what you need?
          </h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
            We're adding new service categories every week. Tell us what you're looking for.
          </p>
          <button
            onClick={handleRequestService}
            className="px-8 py-3.5 rounded-xl text-sm font-bold text-white"
            style={{ background: '#FF6B00', boxShadow: '0 6px 24px rgba(255,107,0,0.4)' }}
          >
            {requestServiceLabel}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
