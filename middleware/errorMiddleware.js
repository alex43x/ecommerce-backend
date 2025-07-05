import logger from '../config/logger.js'; // Asume logger configurado

/**
 * Enhanced Error Handler Middleware
 * Features:
 * - Structured error classification
 * - Production-safe error responses
 * - Detailed development logging
 * - Support for custom error classes
 * - Rate limiting integration
 */
const errorHandler = (err, req, res, next) => {
  // Determine status code
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  
  // Base error response
  const errorResponse = {
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    type: err.name || 'InternalError',
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Handle specific error types
  switch (err.name) {
    case 'ValidationError':
      Object.assign(errorResponse, {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: formatValidationErrors(err.errors)
      });
      res.status(422);
      break;

    case 'MongoServerError':
      if (err.code === 11000) {
        Object.assign(errorResponse, {
          message: 'Duplicate field value',
          code: 'DUPLICATE_KEY',
          field: extractDuplicateField(err),
          value: extractDuplicateValue(err)
        });
        res.status(409);
      }
      break;

    case 'JsonWebTokenError':
      Object.assign(errorResponse, {
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
      res.status(401);
      break;

    case 'TokenExpiredError':
      Object.assign(errorResponse, {
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
      res.status(401);
      break;

    case 'RateLimitError':
      Object.assign(errorResponse, {
        message: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: `${err.retryAfter} seconds`
      });
      res.status(429);
      break;

    default:
      res.status(statusCode);
  }

  // Development logging
  if (process.env.NODE_ENV === 'development') {
    logger.error(`[${err.name}] ${err.message}`, {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      stack: err.stack,
      ...(err.errors && { validationErrors: err.errors })
    });
  } else {
    logger.error(`[${err.name}] ${err.message}`, {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      user: req.user?.id
    });
  }

  // Final response
  res.json(errorResponse);
};

// Helper functions
const formatValidationErrors = (errors) => {
  return Object.entries(errors).reduce((acc, [key, value]) => {
    acc[key] = value.message || value;
    return acc;
  }, {});
};

const extractDuplicateField = (err) => {
  const keyMatch = err.message.match(/index: (.+?)_/);
  return keyMatch ? keyMatch[1] : 'unknown_field';
};

const extractDuplicateValue = (err) => {
  const valueMatch = err.message.match(/dup key: { (.+?): "(.+?)" }/);
  return valueMatch ? valueMatch[2] : 'unknown_value';
};

export default errorHandler;