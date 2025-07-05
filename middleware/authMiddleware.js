import jwt from 'jsonwebtoken';
import logger from '../config/logger.js'; 
import User from '../models/users.js';
const protect = async (req, res, next) => {
  // 1. Extraer el token del header
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    logger.warn('Intento de acceso sin token');
    return res.status(401).json({ 
      success: false,
      error: 'Acceso no autorizado. Token requerido.' 
    });
  }

  const token = authHeader.split(' ')[1]; // Extrae el token después de 'Bearer '
  try {
    //  Verifica y decodifica el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Verifica si el usuario aún existe en la base de datos 
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      logger.warn(`Token válido pero usuario no encontrado: ${decoded.id}`);
      return res.status(401).json({ 
        success: false,
        error: 'Usuario asociado al token no existe.' 
      });
    }

    // Adjunta información útil a la solicitud
    req.user = {
      id: user._id,
      role: user.role,
      // Otros campos necesarios
    };

    logger.info(`Acceso autorizado para usuario: ${user._id}`);
    next();

  } catch (error) {
    // Manejo específico de errores de JWT
    let errorMessage = 'Token inválido';
    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token expirado';
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Token malformado';
    }

    logger.error(`Error de autenticación: ${errorMessage}`, { error: error.message });
    res.status(401).json({ 
      success: false,
      error: errorMessage 
    });
  }
};

export default protect;