// Express application setup for OCR Microservice
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const cookieParser = require('cookie-parser');
const ocrRoutes = require('./modules/ocr/ocr.routes');
const { swaggerSpec, swaggerUi } = require('./config/swagger');
const errorHandler = require('./shared/middleware/errorHandler');
const { ApiError } = require('./shared/utils/apiError');
const logger = require('./shared/utils/logger');

const app = express();

// Global middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Swagger Documentation endpoints
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check endpoint (public)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ocr-service', timestamp: new Date().toISOString() });
});

// Internal microservice security middleware
const validateServiceSecret = (req, res, next) => {
  const secret = req.headers['x-internal-secret'];
  const expected = process.env.INTERNAL_SERVICE_SECRET;
  if (expected && secret !== expected) {
    return res.status(403).json({ success: false, message: 'Forbidden: Unauthorized microservice access' });
  }
  next();
};

// API routes (Protected by Internal Service Secret)
app.use('/api/ocr', validateServiceSecret, ocrRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'OCR Microservice API',
    version: '1.0.0',
    docs: '/api/docs',
  });
});

// 404 handler
app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
});

// Global error handler
app.use(errorHandler);

module.exports = app;
