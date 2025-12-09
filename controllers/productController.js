import { Product } from "../models/product.js";
import Sale from "../models/sales.js";
import { body, param, validationResult } from 'express-validator';
import logger from '../config/logger.js';
import mongoose from 'mongoose';

// Validaciones comunes para datos de producto
const productDataValidations = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),

  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Máximo 500 caracteres'),

  body('category')
    .notEmpty().withMessage('La categoría es requerida')
    .isLength({ max: 50 }).withMessage('Máximo 50 caracteres'),

  body('price')
    .isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),

  body('cost')
    .optional()
    .isFloat({ min: 0 }).withMessage('El costo debe ser un número positivo'),

  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('El stock debe ser un entero positivo'),

  body('variants.*.name')
    .optional()
    .isLength({ max: 50 }).withMessage('Máximo 50 caracteres para el nombre de variante'),

  body('variants.*.barcode')
    .optional()
    .isLength({ max: 50 }).withMessage('Máximo 50 caracteres para el código de barras'),

  body('variants.*.price')
    .optional()
    .isFloat({ min: 0 }).withMessage('El precio de variante debe ser un número positivo'),

  body('active')
    .optional()
    .isBoolean().withMessage('El estado activo debe ser un valor booleano')
];

// Validación de ID en parámetros
const idValidation = [
  param('id')
    .notEmpty().withMessage('El ID es requerido')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID no válido')
];

// Validación de código de barras
const barcodeValidation = [
  param('barcode')
    .notEmpty().withMessage('El código de barras es requerido')
    .isLength({ max: 50 }).withMessage('Máximo 50 caracteres')
];

// Middleware para validar resultados
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      location: error.location,
      value: error.value
    }));

    logger.warn('Errores de validación', {
      path: req.path,
      method: req.method,
      errors: formattedErrors
    });

    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: formattedErrors
    });
  }
  next();
};

export const createProduct = [
  ...productDataValidations,
  validateRequest,
  async (req, res, next) => {
    try {
      const newProduct = new Product(req.body);
      await newProduct.save();

      logger.info(`Producto creado: ${newProduct._id}`, { productId: newProduct._id });

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: {
          id: newProduct._id,
          name: newProduct.name,
          category: newProduct.category,
          price: newProduct.price,
          active: newProduct.active
        }
      });
    } catch (error) {
      if (error.code === 11000) {
        logger.warn(`Intento de crear producto con nombre duplicado: ${req.body.name}`);
        error.statusCode = 409;
        error.clientMessage = 'El nombre de producto ya existe';
        error.clientDetails = { field: 'name' };
      }
      next(error);
    }
  }
];

export const getProducts = async (req, res, next) => {
  const { page = 1, limit = 10, category, search, sortBy } = req.query;

  try {
    const query = {};

    if (category === 'noBebidas') {
      query.category = { $ne: 'Bebidas' };
    } else if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);

    let products = [];
    let totalProducts = 0;

    // Caso especial: categoría "desayuno" -> ordenar por más vendido hoy
    if (category === 'Desayuno') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mostSoldToday = await Sale.aggregate([
        { $match: { date: { $gte: today }, status: 'completed' } },
        { $unwind: "$products" },
        {
          $lookup: {
            from: "products",
            localField: "products.productId",
            foreignField: "_id",
            as: "productInfo"
          }
        },
        { $unwind: "$productInfo" },
        { $match: { "productInfo.category": "Desayuno" } },
        {
          $group: {
            _id: "$products.productId",
            totalSold: { $sum: "$products.quantity" }
          }
        }
      ]);

      const allProducts = await Product.find({ category: "Desayuno" }).lean();

      const soldMap = {};
      mostSoldToday.forEach(p => {
        soldMap[p._id.toString()] = p.totalSold;
      });

      const enrichedProducts = allProducts
        .map(p => ({
          ...p,
          totalSold: soldMap[p._id.toString()] || 0
        }))
        .sort((a, b) => b.totalSold - a.totalSold);

      totalProducts = enrichedProducts.length;
      products = enrichedProducts.slice(skip, skip + parsedLimit);
    } else {
      // Caso normal para otras categorías
      let sort = {};
      const sortOptions = {
        'priceAsc': { price: 1 },
        'priceDesc': { price: -1 },
        'nameAsc': { name: 1 },
        'nameDesc': { name: -1 },
        'dateAsc': { createdAt: 1 },
        'dateDesc': { createdAt: -1 }
      };
      if (sortBy && sortOptions[sortBy]) sort = sortOptions[sortBy];

      [products, totalProducts] = await Promise.all([
        Product.find(query)
          .skip(skip)
          .limit(parsedLimit)
          .collation({ locale: "en", strength: 1 })
          .sort(sort)
          .lean(),
        Product.countDocuments(query)
      ]);
    }

    res.status(200).json({
      success: true,
      count: products.length,
      totalItems: totalProducts,
      totalPages: Math.ceil(totalProducts / parsedLimit),
      currentPage: parseInt(page),
      itemsPerPage: parsedLimit,
      data: products
    });

  } catch (error) {
    next(error);
  }
};

export const getProductbyID = [
  ...idValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.id).lean();

      if (!product) {
        logger.warn(`Producto no encontrado: ${req.params.id}`);
        const error = new Error('Producto no encontrado');
        error.statusCode = 404;
        throw error;
      }

      res.status(200).json({
        success: true,
        data: product
      });

    } catch (error) {
      logger.error(`Error al obtener producto por ID: ${error.message}`, {
        productId: req.params.id
      });
      next(error);
    }
  }
];

export const updateProduct = [
  ...idValidation,
  ...productDataValidations,
  validateRequest,
  async (req, res, next) => {
    try {
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).lean();

      if (!updatedProduct) {
        logger.warn(`Producto no encontrado para actualización: ${req.params.id}`);
        const error = new Error('Producto no encontrado');
        error.statusCode = 404;
        throw error;
      }

      logger.info(`Producto actualizado: ${updatedProduct._id}`);

      res.status(200).json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: updatedProduct
      });

    } catch (error) {
      if (error.code === 11000) {
        logger.warn(`Intento de actualizar a nombre de producto duplicado: ${req.body.name}`);
        error.statusCode = 409;
        error.clientMessage = 'El nombre de producto ya existe';
        error.clientDetails = { field: 'name' };
      }
      logger.error(`Error al actualizar producto: ${error.message}`, {
        productId: req.params.id
      });
      next(error);
    }
  }
];

export const deleteProduct = [
  ...idValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const product = await Product.findByIdAndDelete(req.params.id).lean();

      if (!product) {
        logger.warn(`Producto no encontrado para eliminación: ${req.params.id}`);
        const error = new Error('Producto no encontrado');
        error.statusCode = 404;
        throw error;
      }

      logger.info(`Producto eliminado: ${product._id}`);

      res.status(200).json({
        success: true,
        message: 'Producto eliminado exitosamente',
        data: { id: product._id }
      });

    } catch (error) {
      logger.error(`Error al eliminar producto: ${error.message}`, {
        productId: req.params.id
      });
      next(error);
    }
  }
];

export const getTopSellingProducts = async (req, res, next) => {
  try {
    const products = await Product.aggregate([
      { $lookup: { from: "sales", localField: "_id", foreignField: "items.product", as: "sales_info" } },
      { $addFields: { salesCount: { $size: "$sales_info" } } },
      { $sort: { salesCount: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: products
    });

  } catch (error) {
    logger.error(`Error al obtener productos más vendidos: ${error.message}`);
    next(error);
  }
};

export const getProductByBarcode = [
  ...barcodeValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const { barcode } = req.params;

      const result = await Product.aggregate([
        { $match: { "variants.barcode": barcode } },
        { $unwind: "$variants" },
        { $match: { "variants.barcode": barcode } },
        {
          $project: {
            name: 1,
            category: 1,
            variants: "$variants",
          }
        }
      ]);

      if (!result.length) {
        logger.warn(`Producto con código de barras no encontrado: ${barcode}`);
        const error = new Error('Producto no encontrado');
        error.statusCode = 404;
        throw error;
      }

      res.status(200).json({
        success: true,
        data: result[0]
      });

    } catch (error) {
      logger.error(`Error al buscar producto por código de barras: ${error.message}`, {
        barcode: req.params.barcode
      });
      next(error);
    }
  }
];