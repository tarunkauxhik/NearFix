/**
 * Production entry: maps common PaaS `PORT` to vite-plugin-api-routes' `SERVER_PORT`
 * and binds on all interfaces unless `SERVER_HOST` is set.
 */
import { pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.SERVER_PORT && process.env.PORT) {
  process.env.SERVER_PORT = process.env.PORT;
}
if (!process.env.SERVER_HOST) {
  process.env.SERVER_HOST = '0.0.0.0';
}

const bundleHref = pathToFileURL(resolve(__dirname, '../dist/server.bundle.mjs')).href;
await import(bundleHref);
