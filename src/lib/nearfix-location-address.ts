/** Pure parsing of Nominatim `address` objects — shared by client resolver and server geocode proxy. */

const LOCALITY_KEYS = [
  'neighbourhood',
  'suburb',
  'city_district',
  'village',
  'town',
  'city',
  'municipality',
] as const;

const CITY_KEYS = ['city', 'town', 'village', 'municipality', 'state'] as const;

export function labelsFromNominatimAddress(
  address: Record<string, string> | undefined
): { city: string; locality: string } {
  if (!address) {
    return { city: '', locality: '' };
  }

  let city = '';
  for (const key of CITY_KEYS) {
    const value = address[key];
    if (value && String(value).trim()) {
      city = String(value).trim();
      break;
    }
  }

  let locality = '';
  for (const key of LOCALITY_KEYS) {
    const value = address[key];
    if (value && String(value).trim()) {
      locality = String(value).trim();
      break;
    }
  }

  if (!locality) locality = city;
  if (!city) city = locality || (address.country ? String(address.country).trim() : '');

  return { city, locality };
}
