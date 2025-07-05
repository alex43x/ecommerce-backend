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
 *     SalesTotalResponse:
 *       type: object
 *       properties:
 *         day:
 *           type: number
 *           example: 1250.75
 *           description: Total de ventas del día actual
 *         week:
 *           type: number
 *           example: 8750.50
 *           description: Total de ventas de la semana actual
 *         month:
 *           type: number
 *           example: 32500.25
 *           description: Total de ventas del mes actual
 * 
 *     SalesByDayResponse:
 *       type: array
 *       items:
 *         type: object
 *         properties:
 *           date:
 *             type: string
 *             format: date
 *             example: "2023-08-01"
 *           totalSales:
 *             type: number
 *             example: 1500.75
 * 
 *     PaymentMethodReport:
 *       type: object
 *       properties:
 *         paymentMethod:
 *           type: string
 *           example: "cash"
 *         totalSales:
 *           type: number
 *           example: 5000.75
 *         transactionCount:
 *           type: integer
 *           example: 42
 * 
 *     CategoryReport:
 *       type: object
 *       properties:
 *         category:
 *           type: string
 *           example: "Bebidas"
 *         totalSales:
 *           type: number
 *           example: 7500.50
 *         transactionCount:
 *           type: integer
 *           example: 120
 * 
 *     SellerReport:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           example: "60d21b4667d0d8992e610c85"
 *         sellerName:
 *           type: string
 *           example: "Juan Pérez"
 *         totalSales:
 *           type: number
 *           example: 12500.25
 *         transactionCount:
 *           type: integer
 *           example: 85
 * 
 *     ProductVariantReport:
 *       type: object
 *       properties:
 *         variantId:
 *           type: string
 *           example: "60d21b4667d0d8992e610c85"
 *         name:
 *           type: string
 *           example: "Coca Cola 1L"
 *         totalQuantity:
 *           type: integer
 *           example: 150
 *         totalRevenue:
 *           type: number
 *           example: 3750.00
 * 
 *     WeeklyProductSales:
 *       type: object
 *       properties:
 *         labels:
 *           type: array
 *           items:
 *             type: string
 *             example: "01/08 - 07/08"
 *         datasets:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               variantId:
 *                 type: string
 *               name:
 *                 type: string
 *               data:
 *                 type: array
 *                 items:
 *                   type: number
 * 
 *     CashClosingResponse:
 *       type: object
 *       properties:
 *         details:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               paymentMethod:
 *                 type: string
 *               totalAmount:
 *                 type: number
 *               totalIVA:
 *                 type: number
 *               count:
 *                 type: integer
 *         totals:
 *           type: object
 *           properties:
 *             totalAmount:
 *               type: number
 *             totalIVA:
 *               type: number
 *             totalCount:
 *               type: integer
 * 
 *     DashboardMetrics:
 *       type: object
 *       properties:
 *         today:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *             count:
 *               type: integer
 *         month:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *             count:
 *               type: integer
 *         bestSellingProducts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductVariantReport'
 *         salesByCategory:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *               totalSales:
 *                 type: number
 *         paymentMethods:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               method:
 *                 type: string
 *               total:
 *                 type: number
 *               count:
 *                 type: integer
 *               percentage:
 *                 type: number
 */

/**
 * @swagger
 * tags:
 *   - name: Reportes
 *     description: Endpoints para generación de reportes de ventas
 */

// =============================================
// REPORTES DE VENTAS
// =============================================

/**
 * @swagger
 * /api/reports/totals:
 *   get:
 *     tags: [Reportes]
 *     summary: Obtener totales de ventas (día, semana, mes)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Totales de ventas calculados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SalesTotalResponse'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/reports/daily:
 *   get:
 *     tags: [Reportes]
 *     summary: Ventas diarias (últimos 7 días)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         description: Fecha de inicio (YYYY-MM-DD)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de ventas por día
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SalesByDayResponse'
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/reports/payment-method:
 *   get:
 *     tags: [Reportes]
 *     summary: Ventas por método de pago
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         description: Fecha de inicio (YYYY-MM-DD)
 *         schema:
 *           type: string
 *       - name: endDate
 *         in: query
 *         description: Fecha de fin (YYYY-MM-DD)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reporte de ventas por método de pago
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PaymentMethodReport'
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/reports/category:
 *   get:
 *     tags: [Reportes]
 *     summary: Ventas por categoría
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         description: Fecha de inicio (YYYY-MM-DD)
 *         schema:
 *           type: string
 *       - name: endDate
 *         in: query
 *         description: Fecha de fin (YYYY-MM-DD)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reporte de ventas por categoría
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CategoryReport'
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/reports/seller:
 *   get:
 *     tags: [Reportes]
 *     summary: Ventas por vendedor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         description: Fecha de inicio (YYYY-MM-DD)
 *         schema:
 *           type: string
 *       - name: endDate
 *         in: query
 *         description: Fecha de fin (YYYY-MM-DD)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reporte de ventas por vendedor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SellerReport'
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/reports/products:
 *   get:
 *     tags: [Reportes]
 *     summary: Ventas por productos específicos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: productIds
 *         in: query
 *         required: true
 *         description: IDs de productos separados por coma
 *         schema:
 *           type: string
 *           example: "60d21b4667d0d8992e610c85,60d21b4667d0d8992e610c86"
 *       - name: startDate
 *         in: query
 *         description: Fecha de inicio (YYYY-MM-DD)
 *         schema:
 *           type: string
 *       - name: endDate
 *         in: query
 *         description: Fecha de fin (YYYY-MM-DD)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reporte de ventas por productos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductVariantReport'
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/reports/products/weekly:
 *   get:
 *     tags: [Reportes]
 *     summary: Ventas semanales por productos (últimas 8 semanas)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: productIds
 *         in: query
 *         required: true
 *         description: IDs de productos separados por coma
 *         schema:
 *           type: string
 *           example: "60d21b4667d0d8992e610c85,60d21b4667d0d8992e610c86"
 *     responses:
 *       200:
 *         description: Datos de ventas semanales
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/WeeklyProductSales'
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/reports/cash-closing:
 *   get:
 *     tags: [Reportes]
 *     summary: Cierre de caja por día
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: day
 *         in: query
 *         required: true
 *         description: Fecha para el cierre (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           example: "2023-08-01"
 *     responses:
 *       200:
 *         description: Detalles del cierre de caja
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CashClosingResponse'
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/reports/sales/dashboard:
 *   get:
 *     tags: [Reportes]
 *     summary: Métricas combinadas para dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métricas para el dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DashboardMetrics'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /api/reports/sales/variants:
 *   get:
 *     tags: [Reportes]
 *     summary: Búsqueda de variantes de productos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: q
 *         in: query
 *         required: true
 *         description: Término de búsqueda (mínimo 3 caracteres)
 *         schema:
 *           type: string
 *           example: "coca"
 *     responses:
 *       200:
 *         description: Lista de variantes encontradas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       variantId:
 *                         type: string
 *                       name:
 *                         type: string
 *       400:
 *         description: Parámetros inválidos
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */

// Exportación para swagger-jsdoc
export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Sales Reports API Documentation',
    version: '1.0.0',
    description: 'API para generación de reportes de ventas con manejo de zona horaria de Paraguay'
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Servidor de desarrollo local'
    },
    {
      url: 'https://api.tusistema.com/v1',
      description: 'Servidor de producción'
    }
  ],
  tags: [
    {
      name: 'Reportes',
      description: 'Endpoints para generación de reportes de ventas'
    }
  ]
};