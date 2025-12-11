import express from 'express';
import { createSale, getSales, getSaleById, updateSale, deleteSale, updateSaleStatus,exportSalesToExcel } from '../controllers/saleController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/export', exportSalesToExcel);

router.post('/', protect, createSale);

router.get('/', protect, getSales);

router.get('/:id', protect, getSaleById);

router.put('/:id', protect, updateSale);

router.delete('/:id', protect, deleteSale);

router.patch('/:id/status', protect, updateSaleStatus);


export default router;