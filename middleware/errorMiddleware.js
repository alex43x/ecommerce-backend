/**
 * Middleware para manejo de errores con:
 * - Tipos de errores específicos
 * - Logging estructurado
 * - Formato de respuesta consistente
 * - Seguridad en producción
 */
const errorHandler = (err, req, res, next) => {
  // Configuración básica del error
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let errorResponse = {
    success: false,
    message: err.message || 'Internal Server Error',
    type: err.name || 'UnknownError',
  };

  // Entorno de desarrollo: agregar stack trace
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
    
    // Log completo del error en consola
    console.error('\x1b[31m', '--- ERROR DETAILS ---');
    console.error('\x1b[31m', `Timestamp: ${new Date().toISOString()}`);
    console.error('\x1b[31m', `Route: ${req.method} ${req.originalUrl}`);
    console.error('\x1b[31m', `Error: ${err.toString()}`);
    if (err.errors) console.error('\x1b[31m', 'Validation Errors:', err.errors);
    console.error('\x1b[31m', 'Stack:', err.stack);
    console.error('\x1b[31m', '--- END ERROR ---', '\x1b[0m');
  }

  // Manejo de diferentes tipos de errores
  switch (true) {
    // Errores de validación (Joi, Mongoose, etc.)
    case err.name === 'ValidationError':
      statusCode = 422; // 422 Unprocessable Entity
      errorResponse = {
        ...errorResponse,
        message: 'Validation Error',
        errors: Object.entries(err.errors).reduce((acc, [key, value]) => {
          acc[key] = value.message || value;
          return acc;
        }, {}),
      };
      break;

    // Error de duplicado en MongoDB
    case err.name === 'MongoError' && err.code === 11000:
      statusCode = 409; // 409 Conflict
      errorResponse.message = 'Duplicate key error';
      
      // Extraer el campo duplicado del mensaje de error
      const keyMatch = err.message.match(/index: (.+?)_/);
      if (keyMatch && keyMatch[1]) {
        errorResponse.errors = {
          [keyMatch[1]]: 'Este valor ya existe y debe ser único'
        };
      }
      break;

    // Errores de autenticación/autorización
    case err.name === 'UnauthorizedError':
    case err.name === 'JsonWebTokenError':
      statusCode = 401; // 401 Unauthorized
      errorResponse.message = 'Authentication failed';
      break;

    // Errores de permisos
    case err.name === 'ForbiddenError':
      statusCode = 403; // 403 Forbidden
      errorResponse.message = 'Insufficient permissions';
      break;

    // Errores de recurso no encontrado
    case err.name === 'NotFoundError':
      statusCode = 404; // 404 Not Found
      errorResponse.message = 'Resource not found';
      break;

    // Errores de límite de tasa
    case err.name === 'RateLimitError':
      statusCode = 429; // 429 Too Many Requests
      errorResponse.message = 'Too many requests, please try again later';
      break;

    // Para errores personalizados con statusCode
    case err.statusCode && typeof err.statusCode === 'number':
      statusCode = err.statusCode;
      break;

    default:
      // Para errores desconocidos en producción, mensaje genérico
      if (process.env.NODE_ENV === 'production') {
        errorResponse.message = 'Something went wrong';
      }
  }

  // Enviar respuesta de error
  res.status(statusCode).json(errorResponse);

  // Opcional: Registrar errores críticos en un servicio externo
  if (statusCode >= 500) {
    // Aquí podrías integrar Sentry, Loggly, etc.
    // logCriticalErrorToService(err, req);
  }
};

export default errorHandler;