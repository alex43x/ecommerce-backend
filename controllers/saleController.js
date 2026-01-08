import Sale from '../models/sales.js';
import { body, param, validationResult } from 'express-validator';
import { imprimirVenta } from '../middleware/printer.js';
import { imprimirFacturaDesdeURL } from '../middleware/factura.js';
import { imprimirOrdenCocina } from '../middleware/order.js';
import logger from '../config/logger.js';
import Timbrado from '../models/timbrado.js';

import mongoose from 'mongoose';
import ExcelJS from 'exceljs';

// Validaciones comunes para datos de venta
export const saleDataValidations = [
  body('products')
    .isArray({ min: 1 }).withMessage('Debe incluir al menos un producto')
    .custom(products => {
      const isValid = products.every(p =>
        p.productId && p.quantity != null && p.totalPrice != null && p.ivaRate != null
      );
      if (!isValid) {
        throw new Error('Cada producto debe tener productId, quantity, totalPrice y ivaRate');
      }
      return true;
    }),

  body('products.*.totalPrice')
    .isFloat({ min: 0 }).withMessage('Precio total inválido'),
  body('products.*.ivaRate')
    .isIn([0, 5, 10]).withMessage('IVA debe ser 0, 5 o 10%'),
  body('products.*.ivaAmount')
    .isFloat({ min: 0 }).withMessage('IVA debe ser un número positivo'),

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
    .withMessage('Modo inválido'),

  // Validaciones condicionales
  body('creditTerm')
    .if(body('invoiceType').equals('credito'))
    .notEmpty().withMessage('Plazo de crédito es requerido'),

  body('timbradoNumber')
    .if(body('documentType').equals('printed'))
    .notEmpty().withMessage('Timbrado es requerido para documento impreso'),

  body('timbradoExpiration')
    .if(body('documentType').equals('printed'))
    .isDate().withMessage('Fecha de expiración de timbrado inválida')
];

export const idValidation = [
  param('id')
    .notEmpty().withMessage('El ID es requerido')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID no válido')
];

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));

    // 🔴 LOG CLARO Y ÚTIL
    logger.warn('Error de validación en request', {
      path: req.originalUrl,
      method: req.method,
      errors: formattedErrors,
      body: req.body
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
      const {
        products,
        payment = [],
        user,
        ruc,
        customerName,
        status = 'pending',
        stage = 'processed',
        mode = 'local',
        invoiced = false,
        invoiceType = 'contado',
        creditTerm,
        documentType = 'electronic'
      } = req.body;

      const totalAmount = products.reduce(
        (sum, p) => sum + p.totalPrice,
        0
      );

      const sale = new Sale({
        products,
        totalAmount,
        payment,
        user,
        ruc,
        customerName,
        status,
        stage,
        mode,
        invoiceType,
        creditTerm,
        documentType,
        invoiced: false // siempre false al crear
      });

      await sale.save();

      logger.info(`Venta creada`, {
        saleId: sale._id,
        totalAmount,
        invoicedRequested: invoiced
      });

      // FACTURACIÓN AUTOMÁTICA
      if (invoiced === true) {
        try {
          await sale.facturar();
        } catch (facturaError) {
          logger.error(
            `Error al facturar venta ${sale._id}: ${facturaError.message}`
          );

          return res.status(400).json({
            success: false,
            message: facturaError.message
          });
        }
      }

      // 🔽 IMPRESIÓN
      const saleWithUser = await Sale.findById(sale._id)
        .populate('user', 'name')
        .lean();
      /*
            if (sale.status === 'completed') {
              if (sale.invoiced === true) {
                const facturaUrl = `http://100.110.139.64:4000/facturas/695b95c024a7e012b6ac76cb/pdf`;
                await imprimirFacturaDesdeURL(facturaUrl, 'MP-4200 TH');
              } else {
                await imprimirVenta(saleWithUser, 'MP-4200 TH');
              }
            } else {
              await imprimirOrdenCocina(saleWithUser, 'MP-4200 TH');
            }*/
      if (sale.status === 'completed') {
        if (sale.invoiced === false) {
          await imprimirVenta(saleWithUser, 'MP-4200 TH');
        }
      } else {
        await imprimirOrdenCocina(saleWithUser, 'MP-4200 TH');
      }

      res.status(201).json({
        success: true,
        message: 'Venta creada exitosamente',
        data: {
          id: sale._id,
          dailyId: sale.dailyId,
          totalAmount: sale.totalAmount,
          invoiced: sale.invoiced,
          invoiceNumber: sale.invoiceNumber,
          timbradoNumber: sale.timbradoNumber,
          status: sale.status,
          stage: sale.stage,
          date: sale.date
        }
      });
    } catch (error) {
      logger.error(`Error al crear venta`, {
        error: error.message,
        body: req.body
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
      dailyId,
      ruc,
      product,
    } = req.query;

    const query = {};

    if (user) query.user = user;
    if (dailyId) query.dailyId = dailyId;

    if (paymentMethod) {
      query.payment = { $elemMatch: { paymentMethod } };
    }

    if (ruc) query.ruc = { $regex: ruc, $options: "i" };

    if (product) {
      query["products.name"] = { $regex: product, $options: "i" };
    }

    // ===== STATUS HISTORIC =====
    if (status === "historic") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);

      const twoMonthsAgo = new Date(yesterday);
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      twoMonthsAgo.setHours(0, 0, 0, 0);

      query.status = { $in: ["pending", "ordered"] };
      query.date = {
        $gte: twoMonthsAgo,
        $lte: yesterday,
      };
    }
    // ===== STATUS NORMAL =====
    else if (status && status !== "all") {
      query.status = status;
    }

    // ===== FECHAS MANUALES (solo si NO es historic) =====
    if (startDate && endDate && status !== "historic") {
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
      Sale.countDocuments(query),
    ]);

    logger.debug(`Obtenidas ${sales.length} ventas de ${totalSales}`, {
      queryParams: req.query,
    });

    res.status(200).json({
      success: true,
      count: sales.length,
      totalItems: totalSales,
      totalPages: Math.ceil(totalSales / parsedLimit),
      currentPage: parseInt(page),
      itemsPerPage: parsedLimit,
      data: sales,
    });
  } catch (error) {
    logger.error(`Error al obtener ventas: ${error.message}`, {
      queryParams: req.query,
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
      const sale = await Sale.findById(req.params.id);

      if (!sale) {
        const error = new Error('Venta no encontrada');
        error.statusCode = 404;
        throw error;
      }

      const wasInvoiced = sale.invoiced;

      Object.assign(sale, req.body);

      /**
       * FACTURAR SOLO SI:
       * - antes NO estaba facturada
       * - ahora viene invoiced = true
       * - status es completed
       */
      if (
        !wasInvoiced &&
        sale.invoiced === true &&
        sale.status === 'completed'
      ) {
        const now = new Date();

        const timbrado = await Timbrado.findOne({
          issuedAt: { $lte: now },
          expiresAt: { $gte: now }
        }).sort({ issuedAt: 1 });

        if (!timbrado) {
          const error = new Error('No hay timbrado activo');
          error.statusCode = 400;
          throw error;
        }

        const factura = await timbrado.generateInvoice(sale._id);

        sale.invoiceNumber = factura.invoiceNumber;
        sale.timbradoNumber = timbrado.code;
        sale.timbradoInit = timbrado.issuedAt;
        sale.timbrado = timbrado._id;
      }

      await sale.save();

      const populatedSale = await Sale.findById(sale._id)
        .populate('user', 'name')
        .lean();

      // 🖨 IMPRESIÓN
      if (sale.status === 'completed') {
        try {
          if (sale.invoiced === true && sale.invoiceNumber) {
            const facturaUrl = `http://100.110.139.64:4000/facturas/${sale._id}/pdf`;
            await imprimirFacturaDesdeURL(
              facturaUrl,
              'MP-4200 TH'
            );
          } else {
            await imprimirVenta(
              populatedSale,
              'MP-4200 TH'
            );
          }
        } catch (e) {
          logger.error(
            `Error imprimiendo venta ${sale._id}: ${e.message}`
          );
        }
      }

      res.status(200).json({
        success: true,
        message: 'Venta actualizada exitosamente',
        data: populatedSale
      });

    } catch (error) {
      logger.error(
        `Error al actualizar venta: ${error.message}`,
        { saleId: req.params.id }
      );
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


export const exportSalesToExcel = async (req, res, next) => {
  try {
    const {
      user,
      status,
      startDate,
      endDate,
      paymentMethod,
      dailyId,
      ruc,
      product,
    } = req.query;

    const query = {};

    if (user) query.user = user;
    if (status && status !== "all") query.status = status;
    if (dailyId) query.dailyId = dailyId;
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

    // Obtener TODAS las ventas sin límite
    const sales = await Sale.find(query)
      .sort({ date: -1 })
      .populate("user", "name")
      .lean();

    console.log(`Exportando ${sales.length} ventas...`);

    // Crear workbook y worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ventas');

    // Definir columnas
    worksheet.columns = [
      { header: 'Orden #', key: 'dailyId', width: 10 },
      { header: 'Fecha', key: 'date', width: 20 },
      { header: 'Cliente', key: 'customerName', width: 30 },
      { header: 'RUC', key: 'ruc', width: 15 },
      { header: 'Productos', key: 'products', width: 50 },
      { header: 'Total', key: 'totalAmount', width: 15 },
      { header: 'IVA', key: 'iva', width: 15 },
      { header: 'Métodos de Pago', key: 'paymentMethod', width: 30 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Etapa', key: 'stage', width: 15 },
      { header: 'Modo', key: 'mode', width: 15 },
      { header: 'Vendedor', key: 'user', width: 20 }
    ];

    // Estilo del header
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Mapeos de traducción
    const statusLabels = {
      'completed': 'Completado',
      'pending': 'Pendiente',
      'canceled': 'Cancelado',
      'annulled': 'Anulado',
      'ordered': 'Pedido'
    };

    const stageLabels = {
      'delivered': 'Entregado',
      'finished': 'Terminado',
      'processed': 'En proceso',
      'closed': 'Cerrado'
    };

    const modeLabels = {
      'local': 'Local',
      'carry': 'Para llevar',
      'delivery': 'Delivery'
    };

    const paymentLabels = {
      'cash': 'Efectivo',
      'card': 'Tarjeta',
      'qr': 'QR',
      'transfer': 'Transferencia'
    };

    // Agregar datos
    sales.forEach(sale => {
      // Formatear productos
      const productsText = sale.products
        .map(p => `${p.name} x${p.quantity} (₲${p.totalPrice.toLocaleString('es-PY')})`)
        .join('\n');

      // Formatear métodos de pago
      const paymentMethods = sale.payment
        .map(p => `${paymentLabels[p.paymentMethod]}: ₲${p.totalAmount.toLocaleString('es-PY')}`)
        .join('\n');

      // Formatear fecha
      const formattedDate = new Date(sale.date).toLocaleString('es-PY', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      worksheet.addRow({
        dailyId: sale.dailyId || 'N/A',
        date: formattedDate,
        customerName: sale.customerName || 'N/A',
        ruc: sale.ruc || 'N/A',
        products: productsText,
        totalAmount: sale.totalAmount || 0,
        iva: sale.iva || 0,
        paymentMethod: paymentMethods,
        status: statusLabels[sale.status] || sale.status,
        stage: stageLabels[sale.stage] || sale.stage,
        mode: modeLabels[sale.mode] || sale.mode,
        user: sale.user?.name || 'N/A'
      });
    });

    // Formatear columnas de montos como números
    worksheet.getColumn('totalAmount').numFmt = '₲#,##0';
    worksheet.getColumn('iva').numFmt = '₲#,##0';

    // Ajustar altura de filas para texto multilínea
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.height = 50;
        row.alignment = { vertical: 'top', wrapText: true };
      }
    });

    // Configurar respuesta HTTP
    const filename = `ventas_${startDate || 'todas'}_${endDate || 'todas'}_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    // Escribir el archivo al response
    await workbook.xlsx.write(res);

    console.log(`Exportadas ${sales.length} ventas exitosamente`);

    res.end();
  } catch (error) {
    console.error('Error al exportar ventas:', error);
    next(error);
  }
};