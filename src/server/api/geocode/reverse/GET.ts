import type { Request, Response } from 'express';

import { labelsFromNominatimAddress } from '@/lib/nearfix-location-address';

const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

function nominatimEmailQuery(): string {
  const email = (process.env.NOMINATIM_EMAIL || process.env.VITE_NOMINATIM_EMAIL || '').trim();
  return email ? `&email=${encodeURIComponent(email)}` : '';
}

export default async function handler(req: Request, res: Response) {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon ?? req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: 'lat and lon (or lng) query parameters are required' });
  }

  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lon),
  });
  const url = `${NOMINATIM_REVERSE}?${params.toString()}${nominatimEmailQuery()}`;

  const userAgent =
    process.env.NOMINATIM_USER_AGENT?.trim() ||
    'NearFix/1.0 (https://nearfix.app; geocode reverse proxy)';

  try {
    const upstream = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': userAgent,
      },
    });

    if (!upstream.ok) {
      console.warn('Nominatim reverse failed:', upstream.status);
      return res.status(502).json({ error: 'Geocoder unavailable' });
    }

    const data = (await upstream.json()) as { address?: Record<string, string> };
    const { city, locality } = labelsFromNominatimAddress(data.address);
    return res.json({
      city: city || 'Unknown',
      locality: locality || city || 'Unknown',
    });
  } catch (error) {
    console.error('geocode/reverse error:', error);
    return res.status(502).json({ error: 'Geocoder request failed' });
  }
}
