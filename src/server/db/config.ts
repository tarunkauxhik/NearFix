/**
 * Database configuration loader.
 *
 * Reads the Postgres connection string from the DATABASE_URL environment
 * variable. Use a Neon (https://neon.tech) connection string in production
 * and a local Postgres URL during development.
 */
import '@/server/lib/env';

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy env.example to .env and configure it.'
    );
  }
  return url;
}
