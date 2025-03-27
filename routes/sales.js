import express from 'express';

import { createSale, getSales, getSaleById, updateSale, deleteSale } from '../controllers/saleController.js';

import protect from '../middleware/authMiddleware.js';
const router = express.Router();

// Rutas protegidas para las ventas
router.post('/', protect, createSale); // Crear venta
router.get('/', protect, getSales); // Obtener todas las ventas
router.get('/:id', protect, getSaleById); // Obtener venta por ID
router.put('/:id', protect, updateSale); // Actualizar venta
router.delete('/:id', protect, deleteSale); // Eliminar venta

export default router;
