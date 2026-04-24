import { MapPin, RotateCcw } from 'lucide-react';

import type { NearFixLocationSnapshot } from '@/lib/nearfix-location-storage';
import { useNearFixLocation } from '@/lib/useNearFixLocation';

type Variant = 'inline' | 'compact';

export interface UseMyLocationButtonProps {
  variant?: Variant;
  className?: string;
  /** Called after a successful resolve with the snapshot (e.g. sync discovery filters). */
  onResolved?: (snapshot: NearFixLocationSnapshot) => void;
  /** Called after user clears saved device location (clear localStorage + reset discovery field). */
  onLocationCleared?: () => void;
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
  onLocationCleared,
}: UseMyLocationButtonProps) {
  const { status, requestLocation, errorMessage, discoveryLabel, snapshot, clearLocation } = useNearFixLocation();
  const loading = status === 'loading';
  const ready = status === 'ready';
  const showReset = Boolean(snapshot) && !loading;

  async function handleClick() {
    const next = await requestLocation();
    if (next) {
      onResolved?.(next);
    }
  }

  function handleReset() {
    clearLocation();
    onLocationCleared?.();
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
        <div className="flex items-stretch gap-1">
          <button
            type="button"
            onClick={handleClick}
            disabled={loading}
            title={title}
            className="inline-flex min-w-0 max-w-[min(11rem,42vw)] flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.06] px-2.5 py-2 text-left text-xs font-semibold text-white/75 transition hover:border-[#FF6B00]/35 hover:text-white disabled:opacity-50 sm:max-w-[13rem]"
          >
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-[#FF6B00]" />
            <span className="min-w-0 flex-1 truncate">{label}</span>
          </button>
          {showReset ? (
            <button
              type="button"
              onClick={handleReset}
              title="Clear saved location and area filter"
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-2 py-2 text-white/50 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white/85"
              aria-label="Reset location"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
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
      <div className="flex items-stretch gap-1">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          title={title}
          className="inline-flex min-w-0 max-w-[min(100%,14rem)] flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white/75 transition hover:border-[#FF6B00]/35 hover:text-white disabled:opacity-50 sm:max-w-[16rem]"
        >
          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-[#FF6B00]" />
          <span className="min-w-0 truncate">{label}</span>
        </button>
        {showReset ? (
          <button
            type="button"
            onClick={handleReset}
            title="Clear saved location"
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-2.5 py-2 text-white/50 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white/85"
            aria-label="Reset location"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      {errorMessage ? (
        <span className="max-w-full truncate text-[11px] text-red-300/90" title={errorMessage}>
          {errorMessage}
        </span>
      ) : null}
    </div>
  );
}
