import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let envLoaded = false;

function parseEnvFile(contents: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

export function ensureServerEnv(): void {
  if (envLoaded) return;
  envLoaded = true;

  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  const values = parseEnvFile(readFileSync(envPath, 'utf-8'));

  for (const [key, value] of Object.entries(values)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

ensureServerEnv();
