# Stage 1: Build TypeScript source
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace configuration & manifests
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install dependencies across workspaces
RUN npm ci

# Copy source codes
COPY shared/ ./shared/
COPY backend/ ./backend/

# Build shared library first, then backend
RUN npm run build -w shared
RUN npm run build -w backend

# Stage 2: Production runtime
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy root workspace manifests
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled shared package
COPY --from=builder /app/shared/dist ./shared/dist

# Copy compiled backend & migrations
COPY --from=builder /app/backend/dist ./backend/dist
COPY database/migrations ./database/migrations

# Run as non-root node user
USER node

WORKDIR /app/backend
EXPOSE 3000

CMD ["node", "dist/server.js"]
