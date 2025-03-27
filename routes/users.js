import express from 'express';
import { loginUser, createUser, getUsers, getUserById, updateUser, deleteUser } from '../controllers/userController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Ruta para el login
router.post('/login', loginUser);
router.post('/create', createUser); // Crear usuario

// Rutas protegidas para el CRUD de usuarios
router.get('/', protect, getUsers); // Obtener todos los usuarios
router.get('/:id', protect, getUserById); // Obtener un usuario por su ID
router.put('/:id', protect, updateUser); // Actualizar usuario
router.delete('/:id', protect, deleteUser); // Eliminar usuario

export default router;
