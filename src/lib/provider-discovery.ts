import type { Provider } from '@/data/providers';
import { providerCategories, providerCategoryLabels, type ProviderCategory } from '@/lib/access';

export const providerSortOptions = ['rating', 'distance', 'price_asc', 'price_desc'] as const;
export type ProviderSortOption = typeof providerSortOptions[number];

export interface ProviderDiscoveryFilters {
  search: string;
  category: ProviderCategory | null;
  location: string | null;
  availability: Provider['availability'] | null;
  minRating: number | null;
  maxPrice: number | null;
  maxDistanceKm: number | null;
  sortBy: ProviderSortOption;
}

export const DEFAULT_PROVIDER_DISCOVERY_FILTERS: ProviderDiscoveryFilters = {
  search: '',
  category: null,
  location: null,
  availability: null,
  minRating: null,
  maxPrice: null,
  maxDistanceKm: null,
  sortBy: 'rating',
};

function parsePrice(price: string): number {
  return Number.parseInt(price.replace(/[^\d]/g, ''), 10);
}

function parseDistance(distance: string): number {
  return Number.parseFloat(distance.replace(/[^\d.]/g, ''));
}

function normalizeCategory(value: string | null): ProviderCategory | null {
  if (!value) return null;
  return providerCategories.includes(value as ProviderCategory)
    ? (value as ProviderCategory)
    : null;
}

function normalizeAvailability(
  value: string | null
): ProviderDiscoveryFilters['availability'] {
  return value === 'now' || value === 'today' || value === 'tomorrow' ? value : null;
}

function normalizeSort(value: string | null): ProviderSortOption {
  return providerSortOptions.includes(value as ProviderSortOption)
    ? (value as ProviderSortOption)
    : DEFAULT_PROVIDER_DISCOVERY_FILTERS.sortBy;
}

function normalizeNumber(value: string | null): number | null {
  if (!value) return null;

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseProviderDiscoveryFilters(
  searchParams: URLSearchParams
): ProviderDiscoveryFilters {
  return {
    search: searchParams.get('q')?.trim() ?? '',
    category: normalizeCategory(searchParams.get('category')),
    location: searchParams.get('location')?.trim() || null,
    availability: normalizeAvailability(searchParams.get('availability')),
    minRating: normalizeNumber(searchParams.get('minRating')),
    maxPrice: normalizeNumber(searchParams.get('maxPrice')),
    maxDistanceKm: normalizeNumber(searchParams.get('maxDistanceKm')),
    sortBy: normalizeSort(searchParams.get('sort')),
  };
}

export function buildProviderDiscoverySearchParams(
  filters: ProviderDiscoveryFilters
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search.trim()) params.set('q', filters.search.trim());
  if (filters.category) params.set('category', filters.category);
  if (filters.location) params.set('location', filters.location);
  if (filters.availability) params.set('availability', filters.availability);
  if (filters.minRating !== null) params.set('minRating', String(filters.minRating));
  if (filters.maxPrice !== null) params.set('maxPrice', String(filters.maxPrice));
  if (filters.maxDistanceKm !== null) params.set('maxDistanceKm', String(filters.maxDistanceKm));
  if (filters.sortBy !== DEFAULT_PROVIDER_DISCOVERY_FILTERS.sortBy) {
    params.set('sort', filters.sortBy);
  }

  return params;
}

export function filterAndSortProviders(
  providers: Provider[],
  filters: ProviderDiscoveryFilters
): Provider[] {
  const normalizedSearch = filters.search.trim().toLowerCase();
  const normalizedLocation = filters.location?.trim().toLowerCase() ?? null;

  const filtered = providers.filter((provider) => {
    const searchable = [
      provider.name,
      provider.service,
      provider.location,
      providerCategoryLabels[provider.category],
    ]
      .join(' ')
      .toLowerCase();

    if (normalizedSearch && !searchable.includes(normalizedSearch)) {
      return false;
    }

    if (filters.category && provider.category !== filters.category) {
      return false;
    }

    if (normalizedLocation && !provider.location.toLowerCase().includes(normalizedLocation)) {
      return false;
    }

    if (filters.availability && provider.availability !== filters.availability) {
      return false;
    }

    if (filters.minRating !== null && provider.rating < filters.minRating) {
      return false;
    }

    if (filters.maxPrice !== null && parsePrice(provider.price) > filters.maxPrice) {
      return false;
    }

    if (filters.maxDistanceKm !== null && parseDistance(provider.distance) > filters.maxDistanceKm) {
      return false;
    }

    return true;
  });

  return [...filtered].sort((left, right) => {
    if (filters.sortBy === 'distance') {
      return parseDistance(left.distance) - parseDistance(right.distance);
    }

    if (filters.sortBy === 'price_asc') {
      return parsePrice(left.price) - parsePrice(right.price);
    }

    if (filters.sortBy === 'price_desc') {
      return parsePrice(right.price) - parsePrice(left.price);
    }

    if (right.rating !== left.rating) {
      return right.rating - left.rating;
    }

    return right.reviews - left.reviews;
  });
}
