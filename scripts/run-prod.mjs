/**
 * Production entry: maps common PaaS `PORT` to vite-plugin-api-routes' `SERVER_PORT`
 * and binds on all interfaces unless `SERVER_HOST` is set.
 *
 * The bundled server resolves listen port via dotenv-local from `.env` files, not from
 * `process.env` alone. When no `.env` exists (Docker image, Render, etc.), write a minimal
 * file so `SERVER_PORT` matches the platform `PORT`.
 */
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.SERVER_PORT && process.env.PORT) {
  process.env.SERVER_PORT = process.env.PORT;
}
if (!process.env.SERVER_HOST) {
  process.env.SERVER_HOST = '0.0.0.0';
}

const cwd = process.cwd();
const rootEnvPath = resolve(cwd, '.env');
if (!existsSync(rootEnvPath) && process.env.PORT) {
  writeFileSync(
    rootEnvPath,
    `SERVER_PORT=${process.env.SERVER_PORT}\nSERVER_HOST=${process.env.SERVER_HOST}\n`,
    'utf8'
  );
}

const bundleHref = pathToFileURL(resolve(__dirname, '../dist/server.bundle.mjs')).href;
await import(bundleHref);
