import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { 
  createTimbrado, 
  getTimbrados, 
  getActiveTimbrado, 
  timbradoValidations, 
  validateTimbradoRequest 
} from '../controllers/timbradoController.js';

const router = express.Router();

// Crear un timbrado
router.post('/', timbradoValidations, validateTimbradoRequest, createTimbrado);

// Listar todos los timbrados
router.get('/', protect, getTimbrados);

// Obtener timbrado activo según fecha
router.get('/active', protect, getActiveTimbrado);

export default router;
