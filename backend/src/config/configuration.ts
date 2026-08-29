export default () => ({
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mock_interviewer?schema=public',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  microservices: {
    imageProcessingUrl: process.env.IMAGE_PROCESSING_URL || 'http://localhost:3000',
    ocrServiceUrl: process.env.OCR_SERVICE_URL || 'http://localhost:3001',
  },
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  },
});
