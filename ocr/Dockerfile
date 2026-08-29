# Production Dockerfile for OCR Microservice
FROM node:20-alpine

RUN apk add --no-cache ca-certificates curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install npm dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Create logs directory
RUN mkdir -p logs

EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production

CMD ["node", "src/server.js"]
