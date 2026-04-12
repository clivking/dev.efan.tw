# Build Stage (Alpine is fine for building)
FROM node:22-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm config delete proxy || true \
    && npm config delete https-proxy || true \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm install --no-audit --no-fund

# Copy the rest of the code (CACHEBUST forces rebuild when code changes)
ARG CACHEBUST=1
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js app. Use Webpack in the Linux builder to avoid the
# Turbopack NFT warning on the uploads file-serving route.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build:webpack

# Production Stage — use Debian slim for Chromium compatibility
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install Chromium dependencies and CJK fonts for PDF generation
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    fonts-wqy-zenhei \
    fonts-freefont-ttf \
    ca-certificates \
    fontconfig \
    && fc-cache -f \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copy package metadata first so the sharp install layer stays cacheable when
# application code changes.
COPY --from=builder /app/package*.json ./

# Install sharp for image optimization
RUN npm config delete proxy || true \
    && npm config delete https-proxy || true \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm install --no-audit --no-fund sharp

# Copy files from builder stage
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
