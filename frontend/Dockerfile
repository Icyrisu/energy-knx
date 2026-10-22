# Stage 1: Build Frontend SPA
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace manifests
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY frontend/package.json ./frontend/

# Install dependencies across workspaces
RUN npm ci

# Copy source codes
COPY shared/ ./shared/
COPY frontend/ ./frontend/

# Build shared library first, then frontend
RUN npm run build -w shared
RUN npm run build -w frontend

# Stage 2: Serve with lightweight Nginx
FROM nginx:alpine-slim AS runner

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
