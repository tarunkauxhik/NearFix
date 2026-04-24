import { MapPin } from 'lucide-react';

import type { NearFixLocationSnapshot } from '@/lib/nearfix-location-storage';
import { useNearFixLocation } from '@/lib/useNearFixLocation';

type Variant = 'inline' | 'compact';

export interface UseMyLocationButtonProps {
  variant?: Variant;
  className?: string;
  /** Called after a successful resolve with the snapshot (e.g. sync discovery filters). */
  onResolved?: (snapshot: NearFixLocationSnapshot) => void;
}

function resolvedLabel(loading: boolean, discoveryLabel: string | null, ready: boolean): string | null {
  if (loading) return null;
  if (ready && discoveryLabel?.trim()) return discoveryLabel.trim();
  return null;
}

export default function UseMyLocationButton({
  variant = 'inline',
  className = '',
  onResolved,
}: UseMyLocationButtonProps) {
  const { status, requestLocation, errorMessage, discoveryLabel } = useNearFixLocation();
  const loading = status === 'loading';
  const ready = status === 'ready';

  async function handleClick() {
    const snapshot = await requestLocation();
    if (snapshot) {
      onResolved?.(snapshot);
    }
  }

  if (variant === 'compact') {
    const resolved = resolvedLabel(loading, discoveryLabel, ready);
    const label = loading ? '…' : resolved ?? 'Near me';
    const titleParts = [
      'Uses your browser location, then falls back to IP if needed',
      resolved ?? null,
      errorMessage || null,
    ].filter(Boolean);
    const title = titleParts.join(' — ');

    return (
      <div className={`flex flex-col items-stretch gap-1 ${className}`}>
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          title={title}
          className="inline-flex max-w-[min(11rem,42vw)] items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.06] px-2.5 py-2 text-left text-xs font-semibold text-white/75 transition hover:border-[#FF6B00]/35 hover:text-white disabled:opacity-50 sm:max-w-[13rem]"
        >
          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-[#FF6B00]" />
          <span className="min-w-0 flex-1 truncate">{label}</span>
        </button>
        {errorMessage ? (
          <span className="max-w-[min(14rem,85vw)] truncate text-[11px] text-red-300/90" title={errorMessage}>
            {errorMessage}
          </span>
        ) : null}
      </div>
    );
  }

  const resolved = resolvedLabel(loading, discoveryLabel, ready);
  const label = loading ? 'Locating…' : resolved ?? 'Use my location';
  const titleParts = [
    'Uses your browser location, then falls back to IP if needed',
    resolved ?? null,
    errorMessage || null,
  ].filter(Boolean);
  const title = titleParts.join(' — ');

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        title={title}
        className="inline-flex max-w-[min(100%,14rem)] items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white/75 transition hover:border-[#FF6B00]/35 hover:text-white disabled:opacity-50 sm:max-w-[16rem]"
      >
        <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-[#FF6B00]" />
        <span className="min-w-0 truncate">{label}</span>
      </button>
      {errorMessage ? (
        <span className="max-w-full truncate text-[11px] text-red-300/90" title={errorMessage}>
          {errorMessage}
        </span>
      ) : null}
    </div>
  );
}
