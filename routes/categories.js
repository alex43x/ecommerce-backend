
import express from 'express';
import { createcategory, getcategories, getcategoryById, updatecategory, deletecategory } from '../controllers/categoryController.js'
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Rutas protegidas para los categorias
/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Crear una nueva categoria
 *     tags: [Categorias]
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
 *                 example: Categoria X
 *     responses:
 *       201:
 *         description: categoria creada exitosamente
 */
router.post('/', protect, createcategory); // Crear categoria


/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Obtener todos las categorias
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorias
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: categ x
 */
router.get('/', protect, getcategories); // Obtener todos los categorias

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Obtener una categoria por ID
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la categoria
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: categoria encontrada
 *       404:
 *         description: categoria no encontrada
 */
router.get('/:id', protect, getcategoryById); // Obtener categoria por ID

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Actualizar una categoria por ID
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la categoria
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: categoria actualizada
 *       404:
 *         description: categoria no encontrada
 */
router.put('/:id', protect, updatecategory); // Actualizar categoria

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Eliminar un categoria por ID
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de la categoria
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: categoria eliminada
 *       404:
 *         description: categoria no encontrada
 */
router.delete('/:id', protect, deletecategory); // Eliminar categoria

export default router;
