# Multi-stage Dockerfile for JOSUDO production deployment
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat curl python3 make g++

# Install dependencies and build
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Clean npm cache and install dependencies
RUN npm cache clean --force && \
    npm install && \
    chmod -R 755 node_modules

# Copy source code
COPY . .

# Build the application (frontend + backend) using JS APIs to avoid shell permission issues
RUN node scripts/docker-build.mjs

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Install all dependencies (including devDependencies for migrations)
COPY package.json package-lock.json* ./
RUN npm ci --include=dev

# Create necessary directories
RUN mkdir -p /app/logs && chown -R nodeuser:nodejs /app/logs

# Set ownership
RUN chown -R nodeuser:nodejs /app

USER nodeuser

EXPOSE 5000

ENV PORT=5000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "dist/index.js"]
