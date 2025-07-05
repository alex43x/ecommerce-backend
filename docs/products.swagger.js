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
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "60d21b4667d0d8992e610c85"
 *         name:
 *           type: string
 *           example: "Coca Cola 1L"
 *         description:
 *           type: string
 *           example: "Refresco de cola en botella de 1 litro"
 *         category:
 *           type: string
 *           example: "Bebidas"
 *         price:
 *           type: number
 *           format: float
 *           example: 12.50
 *         cost:
 *           type: number
 *           format: float
 *           example: 8.00
 *         stock:
 *           type: integer
 *           example: 100
 *         variants:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Botella de vidrio"
 *               barcode:
 *                 type: string
 *                 example: "123456789012"
 *               price:
 *                 type: number
 *                 example: 13.50
 *         active:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2021-06-23T14:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2021-06-23T14:30:00.000Z"
 * 
 *     ProductInput:
 *       type: object
 *       required: [name, category, price]
 *       properties:
 *         name:
 *           type: string
 *           example: "Coca Cola 1L"
 *         description:
 *           type: string
 *           example: "Refresco de cola en botella de 1 litro"
 *         category:
 *           type: string
 *           example: "Bebidas"
 *         price:
 *           type: number
 *           format: float
 *           example: 12.50
 *         cost:
 *           type: number
 *           format: float
 *           example: 8.00
 *         stock:
 *           type: integer
 *           example: 100
 *         variants:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Botella de vidrio"
 *               barcode:
 *                 type: string
 *                 example: "123456789012"
 *               price:
 *                 type: number
 *                 example: 13.50
 *         active:
 *           type: boolean
 *           example: true
 * 
 *     BarcodeProduct:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Coca Cola 1L"
 *         category:
 *           type: string
 *           example: "Bebidas"
 *         variants:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "Botella de vidrio"
 *             barcode:
 *               type: string
 *               example: "123456789012"
 *             price:
 *               type: number
 *               example: 13.50
 * 
 *     TopSellingProduct:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "60d21b4667d0d8992e610c85"
 *         name:
 *           type: string
 *           example: "Coca Cola 1L"
 *         salesCount:
 *           type: integer
 *           example: 150
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
 *                     example: "price"
 *                   location:
 *                     type: string
 *                     example: "body"
 * 
 *     PaginatedProductsResponse:
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
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * tags:
 *   - name: Productos
 *     description: Operaciones de Gestión de Productos
 *   - name: Reportes
 *     description: Reportes y estadísticas de productos
 */

// =============================================
// PRODUCT MANAGEMENT ENDPOINTS
// =============================================

/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Productos]
 *     summary: Crear un nuevo producto
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
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
 *                   example: "Producto creado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
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
 *       409:
 *         description: El producto ya existe
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
 *     tags: [Productos]
 *     summary: Obtener productos con filtros y paginación
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
 *       - name: category
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           example: "Bebidas"
 *         description: "Filtrar por categoría (especial 'noBebidas' para excluir)"
 *       - name: search
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           example: "cola"
 *         description: "Buscar en nombre y descripción"
 *       - name: sortBy
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum: [priceAsc, priceDesc, nameAsc, nameDesc, dateAsc, dateDesc]
 *           example: "priceAsc"
 *         description: "Criterio de ordenamiento"
 *     responses:
 *       200:
 *         description: Lista de productos paginada y filtrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedProductsResponse'
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
 * /api/products/{id}:
 *   get:
 *     tags: [Productos]
 *     summary: Obtener producto por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Detalles del producto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Se recibió un parámetro no válido
 *         content:
 *           application/json:
 *             schema: 
 *               $ref: '#/components/schemas/ValidationError'
 *       404:
 *         description: Producto no encontrado
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
 *     tags: [Productos]
 *     summary: Actualizar un producto
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
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
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
 *                   example: "Producto actualizado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
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
 *         description: Producto no encontrado
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
 *     tags: [Productos]
 *     summary: Eliminar un producto
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
 *         description: Producto eliminado exitosamente
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
 *                   example: "Producto eliminado exitosamente"
 *       401:
 *         description: Credenciales inválidas/No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Producto no encontrado
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

// =============================================
// PRODUCT REPORTS ENDPOINTS
// =============================================

/**
 * @swagger
 * /api/products/top-selling:
 *   get:
 *     tags: [Reportes]
 *     summary: Obtener los productos más vendidos
 *     responses:
 *       200:
 *         description: Lista de productos más vendidos
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
 *                     $ref: '#/components/schemas/TopSellingProduct'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/products/barcode/{barcode}:
 *   get:
 *     tags: [Productos]
 *     summary: Buscar producto por código de barras
 *     parameters:
 *       - in: path
 *         name: barcode
 *         required: true
 *         schema:
 *           type: string
 *         example: "123456789012"
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/BarcodeProduct'
 *       404:
 *         description: Producto no encontrado
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
    title: 'Products API Documentation',
    version: '1.0.0',
    description: 'API for managing products and product reports'
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
      name: 'Productos',
      description: 'Operaciones de Gestión de Productos'
    },
    {
      name: 'Reportes',
      description: 'Reportes y estadísticas de productos'
    }
  ]
};