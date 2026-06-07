# ── Stage 1: Build frontend ──
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npx vite build

# ── Stage 2: Production image ──
FROM node:20-alpine
WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy server code
COPY server/ ./server/

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Environment
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

EXPOSE 3001

CMD ["node", "server/index.js"]
