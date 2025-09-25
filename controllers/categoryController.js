import Category from '../models/categories.js';
import { Product } from '../models/product.js';
import { body, param, validationResult } from 'express-validator';
import logger from '../config/logger.js';
import mongoose from 'mongoose';

// Validaciones para datos de categoría
const categoryDataValidations = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ max: 50 }).withMessage('Máximo 50 caracteres')
    .matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Nombre contiene caracteres inválidos')
];

// Validación de ID en parámetros
const idValidation = [
  param('id')
    .notEmpty().withMessage('El ID es requerido')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID no válido')
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

export const createCategory = [
  ...categoryDataValidations,
  validateRequest,
  async (req, res, next) => {
    try {
      const { name } = req.body;

      // Verificar si la categoría ya existe
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        logger.warn(`Intento de crear categoría duplicada: ${name}`);
        return res.status(409).json({
          success: false,
          message: 'La categoría ya existe',
          field: 'name'
        });
      }

      const newCategory = new Category({ name });
      await newCategory.save();

      logger.info(`Categoría creada: ${newCategory._id}`, { 
        categoryId: newCategory._id,
        name: newCategory.name
      });

      res.status(201).json({
        success: true,
        message: 'Categoría creada exitosamente',
        data: {
          id: newCategory._id,
          name: newCategory.name,
          createdAt: newCategory.createdAt
        }
      });
    } catch (error) {
      logger.error(`Error al crear categoría: ${error.message}`, {
        body: req.body,
        stack: error.stack
      });
      next(error);
    }
  }
];

export const getCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);

    const query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const [categories, total] = await Promise.all([
      Category.find(query)
        .skip(skip)
        .limit(parsedLimit)
        .sort({ name: 1 })
        .lean(),
      Category.countDocuments(query)
    ]);

    logger.debug(`Obtenidas ${categories.length} categorías de ${total}`);

    res.status(200).json({
      success: true,
      count: categories.length,
      totalItems: total,
      totalPages: Math.ceil(total / parsedLimit),
      currentPage: parseInt(page),
      itemsPerPage: parsedLimit,
      data: categories
    });
  } catch (error) {
    logger.error(`Error al obtener categorías: ${error.message}`, {
      queryParams: req.query
    });
    next(error);
  }
};

export const getCategoryById = [
  ...idValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const category = await Category.findById(req.params.id).lean();

      if (!category) {
        logger.warn(`Categoría no encontrada: ${req.params.id}`);
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      res.status(200).json({
        success: true,
        data: category
      });
    } catch (error) {
      logger.error(`Error al obtener categoría por ID: ${error.message}`, {
        categoryId: req.params.id
      });
      next(error);
    }
  }
];

export const updateCategory = [
  ...idValidation,
  ...categoryDataValidations,
  validateRequest,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const category = await Category.findById(id);
      if (!category) {
        logger.warn(`Categoría no encontrada para actualización: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      // Verificar si el nuevo nombre ya existe en otra categoría
      if (name && name !== category.name) {
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
          logger.warn(`Intento de actualizar a nombre de categoría duplicado: ${name}`);
          return res.status(409).json({
            success: false,
            message: 'El nombre de categoría ya existe',
            field: 'name'
          });
        }
      }

      const oldName = category.name;
      category.name = name || category.name;

      await category.save();

      // Actualizar productos con la categoría modificada
      if (oldName !== category.name) {
        await Product.updateMany(
          { category: oldName },
          { $set: { category: category.name } }
        );
        logger.info(`Actualizados productos con categoría: ${oldName} → ${category.name}`);
      }

      logger.info(`Categoría actualizada: ${category._id}`, {
        oldName,
        newName: category.name
      });

      res.status(200).json({
        success: true,
        message: 'Categoría actualizada exitosamente',
        data: {
          id: category._id,
          name: category.name,
          updatedAt: category.updatedAt
        }
      });
    } catch (error) {
      logger.error(`Error al actualizar categoría: ${error.message}`, {
        categoryId: req.params.id
      });
      next(error);
    }
  }
];

export const deleteCategory = [
  ...idValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const category = await Category.findByIdAndDelete(req.params.id);
      
      if (!category) {
        logger.warn(`Categoría no encontrada para eliminación: ${req.params.id}`);
        return res.status(404).json({
          success: false,
          message: 'Categoría no encontrada'
        });
      }

      // Eliminar categoría de los productos asociados
      await Product.updateMany(
        { category: category.name },
        { $pull: { category: category.name } }
      );
      logger.info(`Eliminada categoría de productos: ${category.name}`);

      logger.info(`Categoría eliminada: ${category._id}`, {
        name: category.name
      });

      res.status(200).json({
        success: true,
        message: 'Categoría eliminada exitosamente',
        data: {
          id: category._id,
          name: category.name
        }
      });
    } catch (error) {
      logger.error(`Error al eliminar categoría: ${error.message}`, {
        categoryId: req.params.id
      });
      next(error);
    }
  }
];