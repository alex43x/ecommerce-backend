import express from "express";
import {
  saveCashClosing,
  getCashClosingByDate,
  getAllCashClosings,
  closeCashClosing,
  deleteCashClosing
} from "../controllers/cashClosingController.js";
import protect  from "../middleware/authMiddleware.js"; // Tu middleware de autenticación

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Guardar o actualizar cierre de caja
router.post("/", saveCashClosing);

// Obtener cierre de caja por fecha
router.get("/by-date", getCashClosingByDate);

// Obtener todos los cierres (solo admin/spadmin)
router.get("/", protect,getAllCashClosings);

// Cerrar caja (finalizar)
router.patch("/:id/close", closeCashClosing);

// Eliminar cierre de caja (solo admin/spadmin)
router.delete("/:id",protect,  deleteCashClosing);

export default router;


