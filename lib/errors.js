// lib/errors.js
// Error handling utilities

export class ValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.details = details;
  }
}

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.code = 'RESOURCE_NOT_FOUND';
  }
}

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
    this.code = 'RESOURCE_CONFLICT';
  }
}

export class AuthError extends Error {
  constructor(message, code = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ForbiddenError';
    this.code = 'FORBIDDEN';
  }
}

/**
 * Global error handler for API routes
 */
export function handleError(error, res) {
  // Ensure we always return JSON
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'application/json');
  }
  
  console.error('API Error:', error);

  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
  }

  if (error instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  if (error instanceof ConflictError) {
    return res.status(409).json({
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  if (error instanceof AuthError) {
    return res.status(401).json({
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  if (error instanceof ForbiddenError) {
    return res.status(403).json({
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
  }

  // MongoDB duplicate key error
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'RESOURCE_CONFLICT',
        message: 'Duplicate entry'
      }
    });
  }

  // MongoDB connection errors
  if (error.message && (error.message.includes('MongoDB') || error.message.includes('connection') || error.message.includes('MONGODB_URI') || error.message.includes('queryTxt') || error.message.includes('ENOTFOUND') || error.message.includes('EREFUSED'))) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database connection error. Please check MongoDB configuration and ensure MONGODB_URI is correct in .env.local'
      }
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    }
  });
}
