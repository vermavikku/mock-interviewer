# Stage 1: Build React SPA bundle (Alpine)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY package*.json ./

RUN npm ci

# Copy source files
COPY . .

# Build argument for backend URL
ARG VITE_BACKEND_URL=http://localhost:5000
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}

# Build static assets
RUN npm run build


# Stage 2: Serve with Nginx Alpine
FROM nginx:1.25-alpine AS runner

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built SPA from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
