import type { Request, Response } from 'express';

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';

function nominatimEmailQuery(): string {
  const email = (process.env.NOMINATIM_EMAIL || process.env.VITE_NOMINATIM_EMAIL || '').trim();
  return email ? `&email=${encodeURIComponent(email)}` : '';
}

export default async function handler(req: Request, res: Response) {
  const q = String(req.query.q ?? '').trim();
  if (!q) {
    return res.status(400).json({ error: 'q query parameter is required' });
  }

  const params = new URLSearchParams({
    format: 'json',
    limit: '1',
    q,
  });
  const url = `${NOMINATIM_SEARCH}?${params.toString()}${nominatimEmailQuery()}`;

  const userAgent =
    process.env.NOMINATIM_USER_AGENT?.trim() ||
    'NearFix/1.0 (https://nearfix.app; geocode search proxy)';

  try {
    const upstream = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': userAgent,
      },
    });

    if (!upstream.ok) {
      console.warn('Nominatim search failed:', upstream.status);
      return res.status(502).json({ error: 'Geocoder unavailable' });
    }

    const list = (await upstream.json()) as Array<{ lat?: string; lon?: string }>;
    const first = list[0];
    if (!first?.lat || !first?.lon) {
      return res.json({ lat: null, lng: null });
    }

    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.json({ lat: null, lng: null });
    }

    return res.json({ lat, lng });
  } catch (error) {
    console.error('geocode/search error:', error);
    return res.status(502).json({ error: 'Geocoder request failed' });
  }
}
