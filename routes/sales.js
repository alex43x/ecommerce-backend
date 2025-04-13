import express from 'express';
import { createSale, getSales, getSaleById, updateSale, deleteSale, getSalesReport, getSalesByProduct, getSalesByPaymentMethod, getSalesByStatus } from '../controllers/saleController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();
/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Crear una nueva venta con varios productos
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       example: "60b5f7f4a4f8d73444d5f88a"
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *                     totalPrice:
 *                       type: number
 *                       example: 39.99
 *               paymentMethod:
 *                 type: string
 *                 example: "Tarjeta de crédito"
 *               user:
 *                 type: string
 *                 example: "60b5f7f4a4f8d73444d5f88a"
 *     responses:
 *       201:
 *         description: Venta creada exitosamente
 *       400:
 *         description: Error al crear la venta
 */

router.post('/', protect, createSale); // Crear venta
/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Obtener todas las ventas
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ventas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   saleId:
 *                     type: string
 *                     example: "60d3c2e4e1d3e30b71f8c5e8"
 *                   paymentMethod:
 *                     type: string
 *                     example: "Tarjeta de crédito"
 *                   totalAmount:
 *                     type: number
 *                     example: 100.50
 *                   status:
 *                     type: string
 *                     example: "Completada"
 *                   customer:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "Juan Pérez"
 *                       email:
 *                         type: string
 *                         example: "juanperez@mail.com"
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         productId:
 *                           type: string
 *                           example: "60b5f7f4a4f8d73444d5f88a"
 *                         quantity:
 *                           type: integer
 *                           example: 2
 *                         price:
 *                           type: number
 *                           example: 50.25
 *                         saleId:
 *                           type: string
 *                           example: "60d3c2e4e1d3e30b71f8c5e8"  # Referencia a la venta principal
 *       500:
 *         description: Error al obtener las ventas
 */

router.get('/', protect, getSales); // Obtener todas las ventas

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     summary: Obtener venta por ID
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la venta
 *     responses:
 *       200:
 *         description: Venta encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 saleId:
 *                   type: string
 *                   example: "60b5f7f4a4f8d73444d5f88a"
 *                 productId:
 *                   type: string
 *                   example: "60b5f7f4a4f8d73444d5f88a"
 *                 quantity:
 *                   type: integer
 *                   example: 2
 *                 totalPrice:
 *                   type: number
 *                   example: 39.99
 *                 paymentMethod:
 *                   type: string
 *                   example: "Tarjeta de crédito"
 *       404:
 *         description: Venta no encontrada
 */
router.get('/:id', protect, getSaleById); // Obtener venta por ID
/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     summary: Obtener venta por ID
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la venta
 *     responses:
 *       200:
 *         description: Venta encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 saleId:
 *                   type: string
 *                   example: "60d3c2e4e1d3e30b71f8c5e8"
 *                 paymentMethod:
 *                   type: string
 *                   example: "Tarjeta de crédito"
 *                 totalAmount:
 *                   type: number
 *                   example: 100.50
 *                 status:
 *                   type: string
 *                   example: "Completada"
 *                 customer:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Juan Pérez"
 *                     email:
 *                       type: string
 *                       example: "juanperez@mail.com"
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productId:
 *                         type: string
 *                         example: "60b5f7f4a4f8d73444d5f88a"
 *                       quantity:
 *                         type: integer
 *                         example: 2
 *                       price:
 *                         type: number
 *                         example: 50.25
 *                       saleId:
 *                         type: string
 *                         example: "60d3c2e4e1d3e30b71f8c5e8"  # Referencia a la venta principal
 *       404:
 *         description: Venta no encontrada
 */

router.put('/:id', protect, updateSale); // Actualizar venta

/**
 * @swagger
 * /api/sales/{id}:
 *   delete:
 *     summary: Eliminar una venta
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la venta
 *     responses:
 *       200:
 *         description: Venta eliminada exitosamente
 *       404:
 *         description: Venta no encontrada
 */
router.delete('/:id', protect, deleteSale); // Eliminar venta

/**
 * @swagger
 * /api/sales/reports/sales/total:
 *   get:
 *     summary: Obtener reporte de ventas totales
 *     tags: [Ventas]
 *     responses:
 *       200:
 *         description: Reporte de ventas totales
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSales:
 *                   type: number
 *                   example: 5000
 *                 totalRevenue:
 *                   type: number
 *                   example: 100000
 */
router.get('/reports/sales/total', getSalesReport); // Obtener reporte de ventas totales

/**
 * @swagger
 * /api/sales/reports/sales/products:
 *   get:
 *     summary: Obtener ventas por producto
 *     tags: [Ventas]
 *     responses:
 *       200:
 *         description: Reporte de ventas por producto
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   productId:
 *                     type: string
 *                     example: "60b5f7f4a4f8d73444d5f88a"
 *                   totalSold:
 *                     type: number
 *                     example: 120
 */
router.get('/reports/sales/products', getSalesByProduct); // Obtener ventas por producto

/**
 * @swagger
 * /api/sales/reports/sales/payment-methods:
 *   get:
 *     summary: Obtener ventas por método de pago
 *     tags: [Ventas]
 *     responses:
 *       200:
 *         description: Reporte de ventas por método de pago
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentMethod:
 *                   type: string
 *                   example: "Tarjeta de crédito"
 *                 totalSales:
 *                   type: number
 *                   example: 200
 */
router.get('/reports/sales/payment-methods', getSalesByPaymentMethod); // Obtener ventas por método de pago

/**
 * @swagger
 * /api/sales/reports/sales/status:
 *   get:
 *     summary: Obtener ventas por estado
 *     tags: [Ventas]
 *     responses:
 *       200:
 *         description: Reporte de ventas por estado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "Completado"
 *                 totalSales:
 *                   type: number
 *                   example: 150
 */
router.get('/reports/sales/status', getSalesByStatus); // Obtener ventas por estado

export default router;
