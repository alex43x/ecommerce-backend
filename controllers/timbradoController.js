import Timbrado from "../models/timbrado.js";
import { body, validationResult } from "express-validator";
import logger from "../config/logger.js";

/* ================= VALIDACIONES ================= */

export const timbradoValidations = [
  body("code")
    .isLength({ min: 8, max: 8 })
    .withMessage("El timbrado debe tener 8 dígitos"),
];

export const validateTimbradoRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación",
      errors: errors.array(),
    });
  }
  next();
};

/* ================= CONTROLLERS ================= */

// Crear timbrado
export const createTimbrado = async (req, res, next) => {
  try {
    const { code, issuedAt, expiresAt } = req.body;

    const now = new Date();

    // NO permitir otro timbrado activo
    const activeExists = await Timbrado.findOne({
      issuedAt: { $lte: now },
      expiresAt: { $gte: now },
    });

    if (activeExists) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un timbrado activo",
      });
    }

    // Evitar duplicados
    const exists = await Timbrado.findOne({ code });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "El timbrado ya existe",
      });
    }

    // 🔹 AJUSTE CLAVE: expiración a 23:59:59.999
    const issuedDate = new Date(issuedAt);
    const expirationDate = new Date(expiresAt);
    expirationDate.setHours(23, 59, 59, 999);
    expirationDate.setDate(expirationDate.getDate() + 1); // incluir todo el día 

    const timbrado = new Timbrado({
      code,
      issuedAt: issuedDate,
      expiresAt: expirationDate,
    });

    await timbrado.save();

    logger.info(`Timbrado creado: ${code}`, {
      issuedAt: issuedDate,
      expiresAt: expirationDate,
    });

    res.status(201).json({
      success: true,
      data: timbrado,
    });
  } catch (error) {
    logger.error(error.message);
    next(error);
  }
};

// Listar timbrados
export const getTimbrados = async (req, res, next) => {
  try {
    const timbrados = await Timbrado.find().sort({ issuedAt: -1 }).lean();
    res.json({ success: true, data: timbrados });
  } catch (error) {
    next(error);
  }
};

// Obtener timbrado activo
export const getActiveTimbrado = async (req, res, next) => {
  try {
    const now = new Date();
    const timbrado = await Timbrado.findOne({
      issuedAt: { $lte: now },
      expiresAt: { $gte: now },
    }).lean();

    if (!timbrado) {
      return res.status(404).json({
        success: false,
        message: "No hay timbrado activo",
      });
    }

    res.json({ success: true, data: timbrado });
  } catch (error) {
    next(error);
  }
};