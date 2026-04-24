/**
 * Database connection setup using Drizzle ORM with node-postgres.
 *
 * Neon (and most managed Postgres providers) require SSL. The pool is
 * lazily created at import time and shared across requests.
 */
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { getDatabaseUrl } from './config';
import * as schema from './schema';

let pool: Pool | null = null;
let db: (NodePgDatabase<typeof schema> & { $client: Pool }) | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      ssl: { rejectUnauthorized: false },
      max: 10,
    });
  }

  return pool;
}

export function getDb(): NodePgDatabase<typeof schema> & { $client: Pool } {
  if (!db) {
    db = drizzle(getPool(), { schema });
  }

  return db;
}

export async function testConnection(): Promise<boolean> {
  try {
    const client = await getPool().connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch {
    return false;
  }
}

export async function closeConnection(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}
