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
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "60d21b4667d0d8992e610c85"
 *         name:
 *           type: string
 *           example: "Bebidas"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2021-06-23T14:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2021-06-23T14:30:00.000Z"
 * 
 *     CategoryInput:
 *       type: object
 *       required: [name]
 *       properties:
 *         name:
 *           type: string
 *           example: "Bebidas"
 *           description: "Nombre único de la categoría"
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
 *                     example: "name"
 *                   location:
 *                     type: string
 *                     example: "body"
 * 
 *     PaginatedResponse:
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
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * tags:
 *   - name: Categorías
 *     description: Operaciones de Gestión de Categorías de Productos
 */

// =============================================
// CATEGORY MANAGEMENT ENDPOINTS
// =============================================

/**
 * @swagger
 * /api/categories:
 *   post:
 *     tags: [Categorías]
 *     summary: Crear una nueva categoría
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
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
 *                   example: "Categoría creada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Category'
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
 *         description: La categoría ya existe
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
 *     tags: [Categorías]
 *     summary: Obtener todas las categorías (con paginación)
 *     security:
 *       - bearerAuth: []
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
 *       - name: search
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           example: "beb"
 *         description: "Texto para buscar en nombres de categorías"
 *     responses:
 *       200:
 *         description: Lista de categorías paginada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
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
 * /api/categories/{id}:
 *   get:
 *     tags: [Categorías]
 *     summary: Obtener categoría por ID
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
 *         description: Detalles de la categoría
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Se recibió un parámetro no válido
 *         content:
 *           application/json:
 *             schema: 
 *               $ref: '#/components/schemas/ValidationError'
 *       404:
 *         description: Categoría no encontrada
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
 *     tags: [Categorías]
 *     summary: Actualizar una categoría
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
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente
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
 *                   example: "Categoría actualizada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Category'
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
 *         description: Categoría no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: El nombre de categoría ya existe
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
 *     tags: [Categorías]
 *     summary: Eliminar una categoría
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
 *         description: Categoría eliminada exitosamente
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
 *                   example: "Categoría eliminada exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c85"
 *                     name:
 *                       type: string
 *                       example: "Bebidas"
 *       401:
 *         description: Credenciales inválidas/No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Categoría no encontrada
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
    title: 'Categories API Documentation',
    version: '1.0.0',
    description: 'API for managing product categories'
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
      name: 'Categorías',
      description: 'Operaciones de Gestión de Categorías de Productos'
    }
  ]
};