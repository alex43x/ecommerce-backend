import express from "express";

const router = express.Router();

import { createProduct,getProductbyID,getProducts,updateProduct, deleteProduct } from "../controllers/productController.js";
import protect from '../middleware/authMiddleware.js';

// Rutas protegidas para los pagos
router.post('/', protect, createProduct); // Crear pago
router.get('/', protect, getProducts); // Obtener todos los pagos
router.get('/:id', protect, getProductbyID); // Obtener pago por ID
router.put('/:id', protect, updateProduct); // Actualizar pago
router.delete('/:id', protect, deleteProduct); // Eliminar pago

export default router;
