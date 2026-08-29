# Stage 1: Build & Prisma Generation (Alpine)
FROM node:20-alpine AS builder

# Install OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy dependency specifications and Prisma schema
COPY package*.json tsconfig*.json nest-cli.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies needed for build)
RUN npm ci

# Generate Prisma client for linux-musl-openssl
RUN npx prisma generate

# Copy application source
COPY src ./src/

# Compile TypeScript to JavaScript
RUN npm run build

# Prune devDependencies to keep final bundle minimal
RUN npm prune --omit=dev


# Stage 2: Minimal Production Runtime (Alpine)
FROM node:20-alpine AS runner

# Install runtime OpenSSL and CA certificates for secure connections
RUN apk add --no-cache openssl ca-certificates libc6-compat curl

WORKDIR /app

# Copy production node_modules, Prisma client and compiled output from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Create storage directories for resumes and JSON documents
RUN mkdir -p storage/uploads storage/sessions storage/converted_images logs && \
    chmod -R 777 storage logs

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "dist/main.js"]
