/**
 * Drizzle Kit configuration for database migrations.
 *
 * Reads the connection string from the DATABASE_URL environment variable.
 *
 * Usage:
 *   npx drizzle-kit generate   # generate SQL migrations from schema.ts
 *   npx drizzle-kit push       # apply schema directly to the database
 */
import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    'DATABASE_URL is not set. Copy env.example to .env and configure it before running drizzle-kit.'
  );
}

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url,
    ssl: { rejectUnauthorized: false },
  },
  verbose: true,
  strict: false,
});
