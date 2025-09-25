import Sale from '../models/sales.js';
import { body, param, validationResult } from 'express-validator';
import { imprimirVenta } from '../middleware/printer.js';
import { imprimirOrdenCocina } from '../middleware/order.js';
import logger from '../config/logger.js';
import mongoose from 'mongoose';

// Validaciones comunes para datos de venta
const saleDataValidations = [
  body('products')
    .isArray({ min: 1 }).withMessage('Debe incluir al menos un producto')
    .custom(products => {
      const isValid = products.every(p =>
        p.productId && p.quantity && p.totalPrice && p.variantId
      );
      if (!isValid) {
        throw new Error('Cada producto debe tener productId, quantity, totalPrice y variantId');
      }
      return true;
    }),

  body('products.*.totalPrice')
    .isFloat({ min: 0 }).withMessage('Precio total inválido'),

  body('payment')
    .optional()
    .isArray()
    .custom((payment, { req }) => {
      if (payment && payment.length > 0) {
        const totalPayment = payment.reduce((sum, p) => sum + p.totalAmount, 0);
        const totalAmount = req.body.products.reduce((sum, p) => sum + p.totalPrice, 0);
        return totalPayment <= totalAmount;
      }
      return true;
    }).withMessage('El total de pagos excede el monto de la venta'),


  body('iva')
    .optional()
    .isFloat({ min: 0 }).withMessage('IVA debe ser un número positivo'),

  body('ruc')
    .optional()
    .isLength({ max: 20 }).withMessage('RUC demasiado largo'),

  body('status')
    .optional()
    .isIn(['completed', 'pending', 'canceled', 'annulled', 'ordered'])
    .withMessage('Estado inválido'),

  body('stage')
    .optional()
    .isIn(['delivered', 'finished', 'processed', 'closed'])
    .withMessage('Etapa inválida'),

  body('mode')
    .optional()
    .isIn(['local', 'carry', 'delivery'])
    .withMessage('Modo inválido')
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
  console.log(errors)
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

export const createSale = [
  ...saleDataValidations,
  validateRequest,
  async (req, res, next) => {
    try {
      const { products, payment, user, iva, ruc, status, stage, mode, customerName } = req.body;
      console.log(customerName)
      const totalAmount = products.reduce((sum, p) => sum + p.totalPrice, 0);

      const newSale = new Sale({
        products,
        totalAmount,
        payment: payment || [],
        user,
        ruc,
        customerName,
        iva,
        status: status || 'pending',
        stage: stage || 'processed',
        mode: mode || 'local'
      });

      await newSale.save();

      logger.info(`Venta creada: ${newSale._id}`, {
        saleId: newSale._id,
        userId: user,
        totalAmount
      });

      
      if (newSale.status === 'completed') {
        try {
          const saleWithUser = await Sale.findById(newSale._id).populate('user', 'name');
          await imprimirVenta(saleWithUser.toObject(), 'MP-4200 TH');
          logger.info(`Ticket impreso para la venta ${newSale._id}`);
        } catch (printError) {
          logger.error(`Error imprimiendo ticket para venta ${newSale._id}: ${printError.message}`);
        }
      } else {
        try {
          const saleWithUser = await Sale.findById(newSale._id).populate('user', 'name');
          await imprimirOrdenCocina(saleWithUser.toObject(), 'MP-4200 TH'); 
          logger.info(`Orden de cocina impresa para la venta ${newSale._id}`);
        } catch (printError) {
          logger.error(`Error imprimiendo orden de cocina ${newSale._id}: ${printError.message}`);
        }
      }


      res.status(201).json({
        success: true,
        message: 'Venta creada exitosamente',
        data: {
          id: newSale._id,
          totalAmount: newSale.totalAmount,
          status: newSale.status,
          stage: newSale.stage,
          date: newSale.date
        }
      });
    } catch (error) {
      logger.error(`Error al crear venta: ${error.message}`, {
        body: req.body,
        stack: error.stack
      });
      next(error);
    }
  }
];

export const getSales = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      user,
      status,
      startDate,
      endDate,
      paymentMethod,
      ruc,
      product,
    } = req.query;
    const query = {};

    if (user) query.user = user;
    if (status && status !== "all") query.status = status;
    if (paymentMethod) {
      query.payment = { $elemMatch: { paymentMethod } };
    }
    if (ruc) query.ruc = { $regex: ruc, $options: "i" };
    if (product) {
      query["products.name"] = { $regex: product, $options: "i" };
    }

    if (startDate && endDate) {
      const localToUTC = (date, isStart) => {
        const d = new Date(date);
        if (isStart) {
          return new Date(Date.UTC(
            d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate(),
            3, 0, 0, 0
          ));
        } else {
          return new Date(Date.UTC(
            d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate() + 1,
            2, 59, 59, 999
          ));
        }
      };

      const utcStart = localToUTC(startDate, true);
      const utcEnd = localToUTC(endDate, false);
      query.date = { $gte: utcStart, $lte: utcEnd };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const parsedLimit = parseInt(limit);

    const [sales, totalSales] = await Promise.all([
      Sale.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate("user", "name")
        .lean(),
      Sale.countDocuments(query)
    ]);

    logger.debug(`Obtenidas ${sales.length} ventas de ${totalSales}`, {
      queryParams: req.query
    });

    res.status(200).json({
      success: true,
      count: sales.length,
      totalItems: totalSales,
      totalPages: Math.ceil(totalSales / parsedLimit),
      currentPage: parseInt(page),
      itemsPerPage: parsedLimit,
      data: sales
    });
  } catch (error) {
    logger.error(`Error al obtener ventas: ${error.message}`, {
      queryParams: req.query
    });
    next(error);
  }
};

export const updateSaleStatus = [
  ...idValidation,
  body('status')
    .optional()
    .isIn(['completed', 'pending', 'canceled', 'annulled', 'ordered', 'ready'])
    .withMessage('Estado inválido'),
  body('ruc')
    .optional()
    .isLength({ max: 20 }).withMessage('RUC demasiado largo'),
  validateRequest,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, ruc } = req.body;

      let stage;
      if (status === "canceled" || status === "annulled") {
        stage = "closed";
      } else if (status === "completed") {
        stage = "delivered";
      } else if (status === "ready") {
        stage = "finished";
      }

      const update = status !== "ready" ? { status, ruc, stage } : { ruc, stage };

      const result = await Sale.findByIdAndUpdate(
        id,
        update,
        { new: true, runValidators: true }
      );

      if (!result) {
        logger.warn(`Venta no encontrada para actualización: ${id}`);
        const error = new Error("Venta no encontrada");
        error.statusCode = 404;
        throw error;
      }

      logger.info(`Estado de venta actualizado: ${result._id}`, {
        newStatus: status,
        newStage: stage
      });


      res.status(200).json({
        success: true,
        message: 'Estado de venta actualizado',
        data: {
          id: result._id,
          status: result.status,
          stage: result.stage
        }
      });
    } catch (error) {
      logger.error(`Error al actualizar estado de venta: ${error.message}`, {
        saleId: req.params.id
      });
      next(error);
    }
  }
];

export const getSaleById = [
  ...idValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const sale = await Sale.findById(req.params.id).lean();

      if (!sale) {
        logger.warn(`Venta no encontrada: ${req.params.id}`);
        const error = new Error('Venta no encontrada');
        error.statusCode = 404;
        throw error;
      }

      res.status(200).json({
        success: true,
        data: sale
      });
    } catch (error) {
      logger.error(`Error al obtener venta por ID: ${error.message}`, {
        saleId: req.params.id
      });
      next(error);
    }
  }
];

export const updateSale = [
  ...idValidation,
  ...saleDataValidations,
  validateRequest,
  async (req, res, next) => {
    try {
      const sale = await Sale.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('user', 'name').lean();

      if (!sale) {
        logger.warn(`Venta no encontrada para actualización: ${req.params.id}`);
        const error = new Error('Venta no encontrada');
        error.statusCode = 404;
        throw error;
      }

      logger.info(`Venta actualizada: ${sale._id}`);

      if (sale.status === 'completed') {
        try {
          await imprimirVenta(sale, 'MP-4200 TH');
          logger.info(`Ticket impreso para la venta ${sale._id}`);
        } catch (printError) {
          logger.error(`Error imprimiendo ticket para venta ${sale._id}: ${printError.message}`);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Venta actualizada exitosamente',
        data: sale
      });
    } catch (error) {
      logger.error(`Error al actualizar venta: ${error.message}`, {
        saleId: req.params.id
      });
      next(error);
    }
  }
];


export const deleteSale = [
  ...idValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const sale = await Sale.findByIdAndDelete(req.params.id).lean();

      if (!sale) {
        logger.warn(`Venta no encontrada para eliminación: ${req.params.id}`);
        const error = new Error('Venta no encontrada');
        error.statusCode = 404;
        throw error;
      }

      logger.info(`Venta eliminada: ${sale._id}`, {
        totalAmount: sale.totalAmount,
        status: sale.status
      });

      res.status(200).json({
        success: true,
        message: 'Venta eliminada exitosamente',
        data: { id: sale._id }
      });
    } catch (error) {
      logger.error(`Error al eliminar venta: ${error.message}`, {
        saleId: req.params.id
      });
      next(error);
    }
  }
];