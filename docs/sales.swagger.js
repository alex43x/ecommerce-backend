/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: >
 *         Incluir el token JWT obtenido al autenticarse.
 *         Ejemplo: `Authorization: Bearer {token}`
 * 
 *   schemas:
 *     Sale:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "60d21b4667d0d8992e610c85"
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *               name:
 *                 type: string
 *                 example: "Coca Cola 1L"
 *               quantity:
 *                 type: integer
 *                 example: 2
 *               price:
 *                 type: number
 *                 example: 12.50
 *               totalPrice:
 *                 type: number
 *                 example: 25.00
 *         totalAmount:
 *           type: number
 *           example: 25.00
 *         payment:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 example: "cash"
 *               totalAmount:
 *                 type: number
 *                 example: 25.00
 *               details:
 *                 type: object
 *         user:
 *           type: string
 *           example: "60d21b4667d0d8992e610c85"
 *         iva:
 *           type: number
 *           example: 3.75
 *         ruc:
 *           type: string
 *           example: "20123456789"
 *         status:
 *           type: string
 *           enum: [pending, completed, canceled, ordered, annulled, ready]
 *           example: "completed"
 *         stage:
 *           type: string
 *           enum: [preparing, delivered, finished, closed]
 *           example: "delivered"
 *         mode:
 *           type: string
 *           enum: [delivery, pickup, dine-in]
 *           example: "dine-in"
 *         date:
 *           type: string
 *           format: date-time
 *           example: "2021-06-23T14:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2021-06-23T14:30:00.000Z"
 * 
 *     SaleInput:
 *       type: object
 *       required: [products, user]
 *       properties:
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             required: [product, quantity, price]
 *             properties:
 *               product:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *               name:
 *                 type: string
 *                 example: "Coca Cola 1L"
 *               quantity:
 *                 type: integer
 *                 example: 2
 *               price:
 *                 type: number
 *                 example: 12.50
 *         payment:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 example: "cash"
 *               totalAmount:
 *                 type: number
 *                 example: 25.00
 *               details:
 *                 type: object
 *         user:
 *           type: string
 *           example: "60d21b4667d0d8992e610c85"
 *         iva:
 *           type: number
 *           example: 3.75
 *         ruc:
 *           type: string
 *           example: "20123456789"
 *         status:
 *           type: string
 *           enum: [pending, completed, canceled, ordered, annulled, ready]
 *           example: "completed"
 *         mode:
 *           type: string
 *           enum: [delivery, pickup, dine-in]
 *           example: "dine-in"
 * 
 *     SaleStatusUpdate:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, completed, canceled, ordered, annulled, ready]
 *           example: "completed"
 *         ruc:
 *           type: string
 *           example: "20123456789"
 * 
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Descripción del Error"
 * 
 *     ValidationError:
 *       allOf:
 *         - $ref: '#/components/schemas/ErrorResponse'
 *         - type: object
 *           properties:
 *             errors:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   msg:
 *                     type: string
 *                     example: "Validation error message"
 *                   param:
 *                     type: string
 *                     example: "products"
 *                   location:
 *                     type: string
 *                     example: "body"
 * 
 *     PaginatedSalesResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         count:
 *           type: integer
 *           example: 10
 *         totalItems:
 *           type: integer
 *           example: 50
 *         totalPages:
 *           type: integer
 *           example: 5
 *         currentPage:
 *           type: integer
 *           example: 1
 *         itemsPerPage:
 *           type: integer
 *           example: 10
 *         sales:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Sale'
 */

/**
 * @swagger
 * tags:
 *   - name: Ventas
 *     description: Operaciones de Gestión de Ventas
 */

// =============================================
// SALE MANAGEMENT ENDPOINTS
// =============================================

/**
 * @swagger
 * /api/sales:
 *   post:
 *     tags: [Ventas]
 *     summary: Crear una nueva venta
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SaleInput'
 *     responses:
 *       201:
 *         description: Venta creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Venta creada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Sale'
 *       400:
 *         description: Se recibió un parámetro no válido
 *         content:
 *           application/json:
 *             schema: 
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Credenciales inválidas/No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * 
 *   get:
 *     tags: [Ventas]
 *     summary: Obtener ventas con filtros y paginación
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           example: 10
 *       - name: user
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           example: "60d21b4667d0d8992e610c85"
 *         description: "Filtrar por ID de usuario"
 *       - name: status
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [pending, completed, canceled, ordered, annulled, ready, all]
 *           example: "completed"
 *         description: "Filtrar por estado (especial 'all' para todos)"
 *       - name: startDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: "2023-01-01"
 *         description: "Fecha de inicio (YYYY-MM-DD)"
 *       - name: endDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: "2023-01-31"
 *         description: "Fecha de fin (YYYY-MM-DD)"
 *       - name: paymentMethod
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           example: "cash"
 *         description: "Filtrar por método de pago"
 *       - name: ruc
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           example: "20123456789"
 *         description: "Filtrar por RUC (búsqueda parcial)"
 *       - name: product
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           example: "cola"
 *         description: "Filtrar por nombre de producto (búsqueda parcial)"
 *     responses:
 *       200:
 *         description: Lista de ventas paginada y filtrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedSalesResponse'
 *       400:
 *         description: Se recibió un parámetro no válido
 *         content:
 *           application/json:
 *             schema: 
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     tags: [Ventas]
 *     summary: Obtener venta por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Detalles de la venta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Sale'
 *       400:
 *         description: Se recibió un parámetro no válido
 *         content:
 *           application/json:
 *             schema: 
 *               $ref: '#/components/schemas/ValidationError'
 *       404:
 *         description: Venta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * 
 *   put:
 *     tags: [Ventas]
 *     summary: Actualizar una venta
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "60d21b4667d0d8992e610c85"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SaleInput'
 *     responses:
 *       200:
 *         description: Venta actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Venta actualizada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Sale'
 *       400:
 *         description: Se recibió un parámetro no válido
 *         content:
 *           application/json:
 *             schema: 
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Credenciales inválidas/No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Venta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * 
 *   delete:
 *     tags: [Ventas]
 *     summary: Eliminar una venta
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Venta eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Venta eliminada exitosamente"
 *       401:
 *         description: Credenciales inválidas/No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Venta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/sales/{id}/status:
 *   put:
 *     tags: [Ventas]
 *     summary: Actualizar estado de una venta
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "60d21b4667d0d8992e610c85"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SaleStatusUpdate'
 *     responses:
 *       200:
 *         description: Estado de venta actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Estado actualizado"
 *                 data:
 *                   $ref: '#/components/schemas/Sale'
 *       400:
 *         description: Se recibió un parámetro no válido
 *         content:
 *           application/json:
 *             schema: 
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Credenciales inválidas/No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Venta no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Exportación para uso con swagger-jsdoc
export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Sales API Documentation',
    version: '1.0.0',
    description: 'API for managing sales and orders'
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local development server'
    },
    {
      url: 'https://api.yourservice.com/v1',
      description: 'Production server'
    }
  ],
  tags: [
    {
      name: 'Ventas',
      description: 'Operaciones de Gestión de Ventas'
    }
  ]
};