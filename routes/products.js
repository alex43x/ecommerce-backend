import express from "express";

const router = express.Router();

import { createProduct, getProductbyID, getProducts, updateProduct, deleteProduct, getTopSellingProducts } from "../controllers/productController.js";
import protect from '../middleware/authMiddleware.js';


// Rutas protegidas para los productos
/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Crear un nuevo producto
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Camiseta
 *               price:
 *                 type: number
 *                 example: 19.99
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 */

router.post('/', protect, createProduct); // Crear producto
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Obtener todos los productos
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: Camiseta
 *                   price:
 *                     type: number
 *                     example: 19.99
 */
router.get('/', protect, getProducts); // Obtener todos los productos
    /**
     * @swagger
     * /api/products/{id}:
     *   get:
     *     summary: Obtener un producto por ID
     *     tags: [Productos]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         description: ID del producto
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Producto encontrado
     *       404:
     *         description: Producto no encontrado
     */

router.get('/:id', protect, getProductbyID); // Obtener producto por ID
/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Actualizar un producto por ID
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del producto
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Camiseta actualizada
 *               price:
 *                 type: number
 *                 example: 25.99
 *     responses:
 *       200:
 *         description: Producto actualizado
 *       404:
 *         description: Producto no encontrado
 */

router.put('/:id', protect, updateProduct); // Actualizar producto
/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Eliminar un producto por ID
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del producto
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Producto eliminado
 *       404:
 *         description: Producto no encontrado
 */

router.delete('/:id', protect, deleteProduct); // Eliminar producto
/**
 * @swagger
 * /api/products/reports/top-selling:
 *   get:
 *     summary: Obtener los productos más vendidos
 *     tags: [Productos]
 *     security: 
 *     - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos más vendidos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: Camiseta
 *                   totalSold:
 *                     type: number
 *                     example: 120
 */

router.get('/reports/top-selling', protect, getTopSellingProducts);

export default router;
