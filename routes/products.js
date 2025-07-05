import express from "express";

const router = express.Router();

import { createProduct, getProductbyID, getProducts, updateProduct, deleteProduct, getTopSellingProducts, getProductByBarcode } from "../controllers/productController.js";
import protect from '../middleware/authMiddleware.js';

router.post('/', protect, createProduct); // Crear producto

router.get('/', protect, getProducts); // Obtener todos los productos

router.get('/:id', protect, getProductbyID); // Obtener producto por ID

router.get('/barcode/:barcode', protect, getProductByBarcode)// Obtener producto por Código de Barras

router.put('/:id', protect, updateProduct); // Actualizar producto

router.delete('/:id', protect, deleteProduct); // Eliminar producto

router.get('/reports/top-selling', protect, getTopSellingProducts);

export default router;
