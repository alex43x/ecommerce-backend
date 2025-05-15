import express from "express";
import {
    getSalesTotalAllPeriods,
    getSalesByDayLast7Days,
    getSalesByPaymentMethod,
    getSalesByCategory,
    getSalesBySeller,
    getSalesByProducts,
    getVariants,
} from "../controllers/reportController.js"

const router = express.Router();

// ✅ Ventas del día, semana y mes
router.get("/totals", getSalesTotalAllPeriods);

// ✅ Ventas por día (últimos 7 días)
router.get("/daily", getSalesByDayLast7Days);

// ✅ Ventas por método de pago (últimos 30 días o con rango)
router.get("/payment-method", getSalesByPaymentMethod);

// ✅ Ventas por categoría (últimos 30 días o con rango)
router.get("/category", getSalesByCategory);

// ✅ Ventas por vendedor (últimos 30 días o con rango)
router.get("/seller", getSalesBySeller);

router.get("/variants/search",getVariants)//Obtiene variantes vendidas

router.get("/products", getSalesByProducts);//Por producto
export default router;
