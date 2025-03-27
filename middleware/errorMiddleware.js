const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode || 500;
    
    // Errores de validación
    if (err.name === 'ValidationError') {
      res.status(400).json({
        message: 'Validation Error',
        errors: err.errors,
      });
      return;
    }
  
    // Errores de MongoDB
    if (err.name === 'MongoError' && err.code === 11000) {
      res.status(400).json({ message: 'Duplicate key error' });
      return;
    }
  
    // Otros errores
    res.status(statusCode).json({
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  };

export default errorHandler;