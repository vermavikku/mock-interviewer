// Global error handler middleware
const { ApiError } = require('../utils/apiError');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error = new ApiError(400, Object.values(err.errors).map((e) => e.message).join(', '));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    error = new ApiError(400, 'Duplicate field value entered');
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    error = new ApiError(404, `Resource not found with id: ${err.value}`);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  logger.error(`${req.method} ${req.originalUrl} - ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

module.exports = errorHandler;