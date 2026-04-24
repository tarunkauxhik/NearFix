import { motion } from 'motion/react';
import { providers } from '@/data/providers';
import { Navigation } from 'lucide-react';

export default function MapPlaceholder() {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        height: '420px',
        background: '#111111',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Grid lines simulating map */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          </pattern>
          <pattern id="grid-major" width="180" height="180" patternUnits="userSpaceOnUse">
            <path d="M 180 0 L 0 0 0 180" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <rect width="100%" height="100%" fill="url(#grid-major)" />

        {/* Simulated roads */}
        <line x1="0" y1="35%" x2="100%" y2="35%" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <line x1="0" y1="65%" x2="100%" y2="65%" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <line x1="30%" y1="0" x2="30%" y2="100%" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <line x1="65%" y1="0" x2="65%" y2="100%" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />

        {/* Simulated blocks */}
        <rect x="5%" y="5%" width="20%" height="25%" rx="4" fill="rgba(255,255,255,0.02)" />
        <rect x="35%" y="5%" width="25%" height="25%" rx="4" fill="rgba(255,255,255,0.02)" />
        <rect x="70%" y="5%" width="25%" height="25%" rx="4" fill="rgba(255,255,255,0.02)" />
        <rect x="5%" y="40%" width="20%" height="20%" rx="4" fill="rgba(255,255,255,0.02)" />
        <rect x="35%" y="40%" width="25%" height="20%" rx="4" fill="rgba(255,255,255,0.02)" />
        <rect x="70%" y="40%" width="25%" height="20%" rx="4" fill="rgba(255,255,255,0.02)" />
        <rect x="5%" y="70%" width="20%" height="25%" rx="4" fill="rgba(255,255,255,0.02)" />
        <rect x="35%" y="70%" width="25%" height="25%" rx="4" fill="rgba(255,255,255,0.02)" />
        <rect x="70%" y="70%" width="25%" height="25%" rx="4" fill="rgba(255,255,255,0.02)" />
      </svg>

      {/* User location pulse */}
      <div
        className="absolute"
        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 60,
            height: 60,
            background: 'rgba(255,107,0,0.15)',
            border: '1px solid rgba(255,107,0,0.3)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
        <div
          className="relative w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
          style={{ background: '#FF6B00', boxShadow: '0 0 12px rgba(255,107,0,0.6)' }}
        >
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
      </div>

      {/* Provider Pins */}
      {providers.map((provider, i) => (
        <motion.div
          key={provider.id}
          className="absolute cursor-pointer group"
          style={{ left: `${provider.mapX}%`, top: `${provider.mapY}%`, transform: 'translate(-50%, -50%)' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.1 + 0.3, type: 'spring', stiffness: 300 }}
          whileHover={{ scale: 1.2, zIndex: 10 }}
        >
          {/* Pin */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg"
            style={{
              background: provider.pinColor,
              boxShadow: `0 4px 16px ${provider.pinColor}60`,
              border: '2px solid rgba(255,255,255,0.3)',
            }}
          >
            {provider.service === 'Electrician' && '⚡'}
            {provider.service === 'Plumber' && '🔧'}
            {provider.service === 'Home Tutor' && '📚'}
            {provider.service === 'Beautician' && '💅'}
            {provider.service === 'Carpenter' && '🪚'}
            {provider.service === 'AC Repair' && '❄️'}
          </div>

          {/* Tooltip on hover */}
          <div
            className="absolute bottom-full left-1/2 mb-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{
              background: 'rgba(13,13,13,0.95)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
              color: 'white',
              transform: 'translateX(-50%)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            <span className="font-bold">{provider.name}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}> · {provider.price}/{provider.priceUnit}</span>
          </div>
        </motion.div>
      ))}

      {/* Overlay: Stats panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
        className="absolute top-4 left-4 px-4 py-3 rounded-xl"
        style={{
          background: 'rgba(13,13,13,0.85)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
          <span className="text-sm font-semibold text-white">6 providers found within 3km</span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Bengaluru, Karnataka</p>
      </motion.div>

      {/* Locate me button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
        style={{
          background: 'rgba(13,13,13,0.85)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(16px)',
          color: '#FF6B00',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Navigation className="w-4 h-4" />
      </motion.button>
    </div>
  );
}
