# syntax=docker/dockerfile:1
# Multi-stage: build Vite client + server bundle, then run with npm start (run-prod.mjs + PORT).

FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* at build time — required for a working client bundle.
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_PUBLIC_URL=http://localhost:8080
ARG VITE_APP_NAME=NearFix
ARG VITE_API_URL=http://localhost:8080/api

ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_PUBLIC_URL=$VITE_PUBLIC_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts

EXPOSE 10000
ENV PORT=10000

CMD ["npm", "start"]
