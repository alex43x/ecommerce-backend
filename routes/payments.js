
import express from 'express';
import { createPayment, getPayments, getPaymentById, updatePayment, deletePayment } from '../controllers/paymentController.js'
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Rutas protegidas para los pagos
router.post('/', protect, createPayment); // Crear pago
router.get('/', protect, getPayments); // Obtener todos los pagos
router.get('/:id', protect, getPaymentById); // Obtener pago por ID
router.put('/:id', protect, updatePayment); // Actualizar pago
router.delete('/:id', protect, deletePayment); // Eliminar pago

export default router;
