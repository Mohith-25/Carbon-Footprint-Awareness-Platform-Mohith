# Stage 1: Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build both client and server projects
RUN npm run build

# Stage 2: Production run stage
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7860

# Copy package files and install production-only dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled files and required migration sources
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/migrations ./server/migrations

# Create the data directory for SQLite and grant ownership to the non-root 'node' user
RUN mkdir -p /app/data && chown -R node:node /app/data

# Use the non-root user 'node'
USER node

# Expose the port (Hugging Face automatically exposes 7860)
EXPOSE 7860

# Start the application (which runs migrations automatically on startup)
CMD ["node", "dist/server/index.js"]
