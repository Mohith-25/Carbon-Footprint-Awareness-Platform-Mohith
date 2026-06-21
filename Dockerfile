# Stage 1: Build stage
FROM node:20-alpine AS builder

# Install build tools required to compile better-sqlite3 native C++ addon
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files and install all dependencies (including devDependencies for building)
COPY package*.json ./
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build both client and server projects
RUN npm run build

# Prune node_modules to keep only production dependencies
RUN npm prune --production

# Stage 2: Production run stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7860

# Copy package files
COPY package*.json ./

# Copy compiled files and required migration sources
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/migrations ./server/migrations

# Copy compiled production node_modules from the builder stage
COPY --from=builder /app/node_modules ./node_modules

# Create the data directory for SQLite and grant ownership to the non-root 'node' user
RUN mkdir -p /app/data && chown -R node:node /app/data

# Use the non-root user 'node'
USER node

# Expose the port (Hugging Face automatically exposes 7860)
EXPOSE 7860

# Start the application (which runs migrations automatically on startup)
CMD ["node", "dist/server/index.js"]
