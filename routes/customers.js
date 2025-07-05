import express from 'express';
import {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    toggleCustomerStatus,
    searchCustomers
} from '../controllers/customerController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Clientes
 *   description: Gestión de clientes del sistema
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Direccion:
 *       type: object
 *       properties:
 *         street:
 *           type: string
 *           example: "Av. República 123"
 *         city:
 *           type: string
 *           example: "Asunción"
 *         neighborhood:
 *           type: string
 *           example: "San Roque"
 *         reference:
 *           type: string
 *           example: "Cerca del shopping"
 * 
 *     Cliente:
 *       type: object
 *       required:
 *         - ruc
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           example: "60b5f7f4a4f8d73444d5f88a"
 *         ruc:
 *           type: string
 *           pattern: "^[0-9]{7,15}$"
 *           example: "80012345"
 *           description: RUC del cliente (7-15 dígitos)
 *         name:
 *           type: string
 *           example: "Juan Pérez"
 *           minLength: 1
 *           maxLength: 100
 *         email:
 *           type: string
 *           format: email
 *           example: "juan@empresa.com"
 *         phone:
 *           type: string
 *           pattern: "^[0-9\\s+-]{6,20}$"  # Corrección aquí: \\s en lugar de \s
 *           example: "0981123456"
 *         address:
 *           $ref: '#/components/schemas/Direccion'
 *         isActive:
 *           type: boolean
 *           default: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-06-15T14:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-06-15T14:30:00.000Z"
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Crear un nuevo cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cliente'
 *     responses:
 *       201:
 *         description: Cliente creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cliente'
 *       400:
 *         description: |
 *           Error de validación:
 *           - RUC inválido (debe tener 7-15 dígitos)
 *           - RUC duplicado
 *           - Email inválido
 *           - Teléfono inválido
 *           - Faltan campos requeridos
 *       401:
 *         description: No autorizado (token inválido o no proporcionado)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', protect, createCustomer);

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Obtener listado de clientes con paginación
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Límite de resultados por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Texto para buscar en RUC, nombre o email
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo/inactivo
 *     responses:
 *       200:
 *         description: Lista de clientes paginada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Cliente'
 *                 totalCustomers:
 *                   type: integer
 *                   example: 25
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', protect, getCustomers);
/**
 * @swagger
 * /api/customers/search:
 *   get:
 *     summary: Búsqueda rápida de clientes (autocompletado)
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: term
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Texto para buscar en RUC o nombre (mínimo 1 carácter)
 *     responses:
 *       200:
 *         description: Lista de clientes encontrados (solo campos básicos)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "60b5f7f4a4f8d73444d5f88a"
 *                   ruc:
 *                     type: string
 *                     example: "80012345"
 *                   name:
 *                     type: string
 *                     example: "Juan Pérez"
 *                   phone:
 *                     type: string
 *                     example: "0981123456"
 *       400:
 *         description: Término de búsqueda inválido o muy corto
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/search', protect, searchCustomers);
/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Obtener un cliente por ID
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         description: ID del cliente en formato MongoDB
 *     responses:
 *       200:
 *         description: Detalles del cliente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cliente'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', protect, getCustomerById);

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Actualizar completamente un cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         description: ID del cliente en formato MongoDB
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cliente'
 *     responses:
 *       200:
 *         description: Cliente actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cliente'
 *       400:
 *         description: |
 *           Error de validación:
 *           - ID inválido
 *           - RUC inválido
 *           - Email inválido
 *           - Teléfono inválido
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id', protect, updateCustomer);

/**
 * @swagger
 * /api/customers/{id}/toggle-status:
 *   patch:
 *     summary: Cambiar estado activo/inactivo de un cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         description: ID del cliente en formato MongoDB
 *     responses:
 *       200:
 *         description: Estado del cliente cambiado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cliente desactivado correctamente"
 *                 customer:
 *                   $ref: '#/components/schemas/Cliente'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/toggle-status', protect, toggleCustomerStatus);



export default router;