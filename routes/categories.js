
import express from 'express';
import { createCategory, getCategories,getCategoryById, updateCategory, deleteCategory } from '../controllers/categoryController.js'
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createCategory); // Crear categoria

router.get('/', protect, getCategories); // Obtener todos los categorias

router.get('/:id', protect, getCategoryById); // Obtener categoria por ID

router.put('/:id', protect, updateCategory); // Actualizar categoria

router.delete('/:id', protect, deleteCategory); // Eliminar categoria

export default router;
