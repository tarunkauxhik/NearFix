import { motion } from 'motion/react';
import { Star, MapPin, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Provider } from '@/data/providers';

interface ProviderCardProps {
  provider: Provider;
  index?: number;
}

export default function ProviderCard({ provider, index = 0 }: ProviderCardProps) {
  const availabilityColor =
    provider.availability === 'now'
      ? '#10B981'
      : provider.availability === 'today'
      ? '#F59E0B'
      : '#6B7280';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: 'easeOut' as const }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,107,0,0.3)';
        e.currentTarget.style.borderColor = 'rgba(255,107,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.4)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
      }}
    >
      {/* Photo */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={provider.photo}
          alt={provider.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&background=1a1a1a&color=FF6B00&size=200&bold=true`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Availability Badge */}
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
          style={{
            background: `${availabilityColor}20`,
            border: `1px solid ${availabilityColor}50`,
            color: availabilityColor,
            backdropFilter: 'blur(8px)',
          }}
        >
          {provider.availability === 'now' && (
            <motion.span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: availabilityColor }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
          {provider.availabilityLabel}
        </div>

        {/* Verified Badge */}
        {provider.verified && (
          <div
            className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
            style={{
              background: 'rgba(255,107,0,0.15)',
              border: '1px solid rgba(255,107,0,0.3)',
              color: '#FF6B00',
              backdropFilter: 'blur(8px)',
            }}
          >
            <ShieldCheck className="w-3 h-3" />
            Verified
          </div>
        )}

        {/* Distance */}
        <div
          className="absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs flex items-center gap-1"
          style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)' }}
        >
          <MapPin className="w-3 h-3" />
          {provider.distance}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#FF6B00' }}>
            {provider.service}
          </p>
          <h3 className="text-base font-bold text-white">{provider.name}</h3>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {provider.location}
          </p>
        </div>

        {/* Rating + Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-3.5 h-3.5"
                  style={{
                    fill: i < Math.floor(provider.rating) ? '#FF6B00' : 'transparent',
                    color: i < Math.floor(provider.rating) ? '#FF6B00' : 'rgba(255,255,255,0.2)',
                  }}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-white">{provider.rating}</span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>({provider.reviews})</span>
          </div>
          <div className="text-right">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>From </span>
            <span className="text-sm font-bold text-white">{provider.price}</span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>/{provider.priceUnit}</span>
          </div>
        </div>

        {/* Jobs done */}
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {provider.completedJobs} jobs completed
        </p>

        {/* Book Now */}
        <Link
          to={`/provider/${provider.id}`}
          className="mt-auto block w-full py-2.5 rounded-xl text-sm font-bold text-white text-center transition-all duration-200"
          style={{
            background: '#FF6B00',
            boxShadow: '0 4px 16px rgba(255,107,0,0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(255,107,0,0.5)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,107,0,0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Book Now
        </Link>
      </div>
    </motion.div>
  );
}
