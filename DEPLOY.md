# Deploying NearFix

This guide matches this repository’s layout: **Vite + React** client, **file-based Express** routes under `src/server/api`, **one production process** via `npm run build` and `npm start` ([`scripts/run-prod.mjs`](scripts/run-prod.mjs) maps host `PORT` → `SERVER_PORT` and binds `0.0.0.0`).

Official references:

- [Render Web Services](https://docs.render.com/docs/web-services)
- [Render environment variables (incl. `PORT`)](https://docs.render.com/docs/environment-variables)
- [Render Node.js version](https://docs.render.com/docs/node-version)
- [Clerk Dashboard](https://dashboard.clerk.com)
- [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)

Repository: **https://github.com/tarunkauxhik/NearFix**

---

## 1. Prerequisites

Before you open Render, gather:

| Item | Why |
| --- | --- |
| **GitHub** | Source for deploys; default branch should be `main` (or note the branch you select on Render). |
| **Postgres** | Any host with a `DATABASE_URL` (e.g. [Neon](https://neon.tech)). SSL URLs like `?sslmode=require` are typical. |
| **Clerk application** | `VITE_CLERK_PUBLISHABLE_KEY` (browser) and `CLERK_SECRET_KEY` (server only). |
| **Render account** | [render.com](https://render.com) — sign in with GitHub for easy repo access. |
| **Node 22 on your PC** | For local checks and for `npx drizzle-kit push` against production (same major as [`package.json` `engines`](package.json)). |

Optional: contact email for Nominatim ([policy](https://operations.osmfoundation.org/policies/nominatim/)) — set `NOMINATIM_EMAIL` on the host.

---

## 2. Pre-flight on your computer

Do this **before** the first cloud deploy to catch build errors early.

1. **Clone and install**

   ```bash
   git clone https://github.com/tarunkauxhik/NearFix.git
   cd NearFix
   cp env.example .env
   ```

2. **Edit `.env`** (never commit this file). At minimum set:

   - `DATABASE_URL`
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

3. **Install and build**

   ```bash
   npm ci
   npm run build
   ```

4. **Run production server locally**

   ```bash
   npm start
   ```

   In the log line like `Ready at http://...`, note the **port** (often `3000` locally unless you set `PORT` / `SERVER_PORT`).

5. **Health check**

   In another terminal (replace `3000` if yours differs):

   ```bash
   curl http://127.0.0.1:3000/api/health
   ```

   You should see JSON with `"status":"ok"` from [`src/server/api/health/GET.ts`](src/server/api/health/GET.ts).

6. **Stop the server** with `Ctrl+C` in the terminal where `npm start` is running.

If any step fails, fix it before continuing (TypeScript, missing env, etc.).

---

## 3. Render: create a Web Service

1. Log in at [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Under **Connect a repository**, choose **GitHub** and authorize if prompted.
4. Select **`tarunkauxhik/NearFix`** (or your fork).
5. **Branch**: `main` (or your default).
6. **Name**: e.g. `nearfix` (this affects the default hostname `nearfix.onrender.com` unless you add a custom domain later).
7. **Region**: choose closest to your users.
8. **Language**: **Node**.
9. **Instance type**: Free or paid (your choice; free tier has cold starts and limits).

Click through to the settings screen where you set build/start commands (next section).

---

## 4. Render: build and start commands

Set exactly:

| Field | Value |
| --- | --- |
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `npm start` |

Why:

- **`npm ci`** uses [`package-lock.json`](package-lock.json) for reproducible installs (same as CI).
- **`npm run build`** produces `dist/client/` and `dist/server.bundle.mjs` (Vite + server bundle).
- **`npm start`** runs [`scripts/run-prod.mjs`](scripts/run-prod.mjs), which sets `SERVER_PORT` from Render’s **`PORT`** and `SERVER_HOST` to `0.0.0.0` so the service accepts traffic ([Render port binding](https://docs.render.com/docs/web-services)).

**Advanced (recommended):**

- **Health Check Path**: `/api/health`

Save settings; you will add environment variables before or right after the first deploy (section 5).

### Native Node vs Docker on Render

- **Native Node (recommended):** Use Render’s **Node** runtime with the build/start commands in this section. Define `VITE_*` and server secrets in Render **Environment**; no Docker build args. This is the path the rest of this guide assumes.
- **Docker on Render (optional):** Point a **Docker** web service at the repo [`Dockerfile`](Dockerfile). You must supply the same **build arguments** as the Dockerfile (`VITE_CLERK_PUBLISHABLE_KEY`, optional `VITE_PUBLIC_URL`, …) in Render or a blueprint, **and** runtime variables (`CLERK_SECRET_KEY`, `DATABASE_URL`, …). Easier to misconfigure than native Node for this project.

---

## 5. Render: environment variables

In the service → **Environment** (or during creation → **Advanced**), add:

### Required (minimum)

| Key | Value / notes |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your Postgres connection string (from Neon or Render Postgres). |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (`pk_test_...` or `pk_live_...`). |
| `CLERK_SECRET_KEY` | Clerk secret (`sk_test_...` or `sk_live_...`). **Secret / sensitive.** |

### Strongly recommended

| Key | Value / notes |
| --- | --- |
| `NODE_VERSION` | `22` — matches [`package.json` engines](package.json); see [Render Node version](https://docs.render.com/docs/node-version). |

### After you know your public URL

Render assigns a URL like `https://<name>.onrender.com`.

1. Add **`VITE_PUBLIC_URL`** = that exact origin, e.g. `https://<name>.onrender.com` (no path; avoid a trailing slash unless you use the same everywhere).
2. **Redeploy** with **Clear build cache & deploy** (or at least a fresh deploy). **Reason:** Vite inlines `VITE_*` variables **at build time**; changing them without rebuilding the client leaves stale values in `dist/client`.

### Optional

| Key | Purpose |
| --- | --- |
| `NOMINATIM_EMAIL` | Contact hint for geocode proxy ([`src/server/api/geocode`](src/server/api/geocode)). |
| `NOMINATIM_USER_AGENT` | Custom User-Agent string for Nominatim. |
| `ADMIN_EMAILS` / `ADMIN_USERNAMES` / `ADMIN_USER_IDS` | Bootstrap admin for `/admin` during setup ([`env.example`](env.example)). |

**Note:** Render injects **`PORT`** for web services ([docs](https://docs.render.com/docs/environment-variables)). You do **not** need to set `SERVER_PORT` manually if you use `npm start` (see [`scripts/run-prod.mjs`](scripts/run-prod.mjs)).

---

## 6. Database schema (production)

Apply the Drizzle schema to the **same** database your app will use:

1. On your PC, set `DATABASE_URL` for **one shell session** only (PowerShell example):

   ```powershell
   $env:DATABASE_URL = "postgresql://..."   # production URL from Neon / Render
   npx drizzle-kit push
   ```

2. Do **not** paste production URLs into Git or screenshots.

[`drizzle.config.ts`](drizzle.config.ts) reads `DATABASE_URL` from the environment.

---

## 7. Clerk configuration

1. Open [Clerk Dashboard](https://dashboard.clerk.com) → your application.
2. Add your **production** domain / allowed origins for the Render URL (e.g. `https://<name>.onrender.com`).
3. Configure **redirect URLs** / session URLs so sign-in, sign-up, and post-auth routes work on that origin (paths like `/auth/sign-in`, `/auth/post-auth` — see [`src/routes.tsx`](src/routes.tsx) and [`src/main.tsx`](src/main.tsx)).
4. When moving to real users, switch to **`pk_live_` / `sk_live_`** keys and update Render env vars, then **redeploy** so the client bundle picks up the new `VITE_CLERK_PUBLISHABLE_KEY`.

---

## 8. First deploy and verification

1. On Render, click **Create Web Service** (or **Manual Deploy** if the service already exists).
2. Watch **Logs** until the build finishes and the server prints **Ready at …**.
3. **Browser checks**
   - Open `https://<name>.onrender.com` — home should load.
   - Open `https://<name>.onrender.com/api/health` — JSON `status: ok`.
   - Try **Sign in** with Clerk on that hostname.
   - Open a deep link, e.g. `https://<name>.onrender.com/services` — should load (SPA fallback from [`src/server/configure.js`](src/server/configure.js)).

4. Update your public **README** “Live demo” line with this URL and push to GitHub.

---

## 9. Troubleshooting

| Symptom | What to check |
| --- | --- |
| Build fails on `npm ci` | [`package-lock.json`](package-lock.json) committed; no conflicting `pnpm-lock.yaml` committed (this repo [`.gitignore`](.gitignore) ignores `pnpm-lock.yaml` while using npm). |
| Build fails on `vite build` | Build logs for TypeScript / missing `VITE_CLERK_PUBLISHABLE_KEY` at build time. |
| Service crashes on start | **Logs** tab: missing `DATABASE_URL` or `CLERK_SECRET_KEY`; database unreachable from Render region. |
| 502 / timeout | Cold start on free tier; retry. Check memory / crash loops in logs. |
| Clerk works locally, not on Render | Allowed origins / redirect URLs; **`VITE_PUBLIC_URL`** set to deployed origin and **client rebuilt**. |
| `/api/health` 404 | Typo in path (must be `/api/health`); service not actually running your `npm start`. |
| DB errors in app | `drizzle-kit push` run against **this** `DATABASE_URL`; SSL params in URL for Neon. |
| Geocode errors | Set `NOMINATIM_EMAIL`; upstream rate limits — check server logs. |

---

## 10. Optional: Docker (local production-style)

For debugging **the same artifact** as production without Render, use the **`Dockerfile`** and **`docker-compose.yml`** in this repo.

- **Build-time:** the image needs `VITE_CLERK_PUBLISHABLE_KEY` (and optionally `VITE_PUBLIC_URL`) as **build args** so the client bundle compiles.
- **Runtime:** pass `DATABASE_URL`, `CLERK_SECRET_KEY`, etc. (e.g. via a root `.env` file that Compose reads for substitution — **do not commit** secrets).

See comments in [`docker-compose.yml`](docker-compose.yml). Quick test:

```bash
docker compose build
docker compose up
```

On **Windows**, start **Docker Desktop** first so the engine is running (`docker version` should show a Server section). If `docker compose build` reports it cannot connect to the Docker API, the daemon is not running.

Then `curl http://localhost:8080/api/health` (host port `8080` maps to container `PORT` `10000`).

To use **Neon** instead of the bundled Postgres service, override `DATABASE_URL` in a local `docker-compose.override.yml` (keep that file out of Git if it contains secrets; you can add `docker-compose.override.yml` to `.gitignore`).

---

## 11. Optional: deploy this image to Render

Render can run a **Docker** web service instead of native Node: point Render at the repo `Dockerfile` and set the same environment variables (plus build args if you use a build pipeline that supports them). Native Node + `npm start` remains the simplest path for this project.
