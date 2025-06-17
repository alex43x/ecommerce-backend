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
 *             type: object
 *             required:
 *               - ruc
 *               - name
 *             properties:
 *               ruc:
 *                 type: string
 *                 example: "80012345"
 *                 description: RUC del cliente (7-15 dígitos)
 *               name:
 *                 type: string
 *                 example: "Juan Pérez"
 *               email:
 *                 type: string
 *                 example: "juan@empresa.com"
 *               phone:
 *                 type: string
 *                 example: "0981123456"
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: "Av. República 123"
 *                   city:
 *                     type: string
 *                     example: "Asunción"
 *                   neighborhood:
 *                     type: string
 *                     example: "San Roque"
 *                   reference:
 *                     type: string
 *                     example: "Cerca del shopping"
 *     responses:
 *       201:
 *         description: Cliente creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Error de validación (RUC duplicado o datos inválidos)
 *       401:
 *         description: No autorizado (token inválido o no proporcionado)
 */
router.post('/', protect, createCustomer);

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Obtener listado de clientes
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
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
 *                     $ref: '#/components/schemas/Customer'
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
 *         description: No autorizado (token inválido o no proporcionado)
 */
router.get('/', protect, getCustomers);

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
 *         description: ID del cliente
 *     responses:
 *       200:
 *         description: Detalles del cliente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Cliente no encontrado
 *       401:
 *         description: No autorizado (token inválido o no proporcionado)
 */
router.get('/:id', protect, getCustomerById);

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Actualizar un cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ruc:
 *                 type: string
 *                 example: "80012345"
 *               name:
 *                 type: string
 *                 example: "Juan Pérez Modificado"
 *               email:
 *                 type: string
 *                 example: "nuevo@email.com"
 *               phone:
 *                 type: string
 *                 example: "0981765432"
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   neighborhood:
 *                     type: string
 *                   reference:
 *                     type: string
 *     responses:
 *       200:
 *         description: Cliente actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Customer'
 *       400:
 *         description: Error de validación (RUC duplicado o datos inválidos)
 *       401:
 *         description: No autorizado (token inválido o no proporcionado)
 *       404:
 *         description: Cliente no encontrado
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
 *         description: ID del cliente
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
 *                   $ref: '#/components/schemas/Customer'
 *       401:
 *         description: No autorizado (token inválido o no proporcionado)
 *       404:
 *         description: Cliente no encontrado
 */
router.patch('/:id/toggle-status', protect, toggleCustomerStatus);

/**
 * @swagger
 * /api/customers/search:
 *   get:
 *     summary: Buscar clientes (para autocompletar)
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: term
 *         required: true
 *         schema:
 *           type: string
 *         description: Texto para buscar en RUC o nombre
 *     responses:
 *       200:
 *         description: Lista de clientes encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   ruc:
 *                     type: string
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *       401:
 *         description: No autorizado (token inválido o no proporcionado)
 */
router.get('/search', protect, searchCustomers);

/**
 * @swagger
 * components:
 *   schemas:
 *     Customer:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "60b5f7f4a4f8d73444d5f88a"
 *         ruc:
 *           type: string
 *           example: "80012345"
 *         name:
 *           type: string
 *           example: "Juan Pérez"
 *         email:
 *           type: string
 *           example: "juan@empresa.com"
 *         phone:
 *           type: string
 *           example: "0981123456"
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             neighborhood:
 *               type: string
 *             reference:
 *               type: string
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

export default router;