# Production Dockerfile for Image Processing Microservice (MuPDF WASM + Sharp Engine)
FROM node:20-alpine

RUN apk add --no-cache ca-certificates curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install npm dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Create uploads storage directories with proper permissions
RUN mkdir -p uploads/documents logs

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "src/server.js"]
