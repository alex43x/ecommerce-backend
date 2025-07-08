import Sale from "../models/sales.js";
import mongoose from "mongoose";
import { getISOWeek, getISOWeekYear } from "date-fns";

// Configuración de zona horaria de Paraguay (GMT-4 en horario estándar, GMT-3 en horario de verano)
const PARAGUAY_TIMEZONE_OFFSET = -3; // Ajustar según horario de verano (-3)

function toUTCFromParaguay(dateStr, hours = 0, minutes = 0, seconds = 0, ms = 0) {
  const parts = dateStr.split("-").map(Number);
  let year, month, day;

  if (parts[0] > 31) {
    // Formato YYYY-MM-DD
    [year, month, day] = parts;
  } else {
    // Formato DD-MM-YYYY
    [day, month, year] = parts;
  }

  // Convertimos la fecha como si fuera en Paraguay (UTC-3) a UTC
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours - PARAGUAY_TIMEZONE_OFFSET, minutes, seconds, ms));

  return utcDate;
}


// Función reutilizable para obtener fechas con zona horaria de Paraguay
function parseDateRange(startDate, endDate, defaultDays = 30) {
  const start = startDate
    ? toUTCFromParaguay(startDate, 0, 0, 0, 0)
    : (() => {
      const d = new Date();
      d.setDate(d.getDate() - defaultDays);
      d.setHours(0 - PARAGUAY_TIMEZONE_OFFSET, 0, 0, 0);
      return d;
    })();

  const end = endDate
    ? toUTCFromParaguay(endDate, 23, 59, 59, 999)
    : new Date(); // ahora mismo en UTC

  return { start, end };
}

// ✅ Ventas totales del día, semana y mes (basado en pagos reales)
export const getSalesTotalAllPeriods = async (req, res, next) => {
  try {
    const now = new Date();

    // Ajustar a hora de Paraguay y calcular rangos
    const startOfDay = new Date(now);
    startOfDay.setHours(0 - PARAGUAY_TIMEZONE_OFFSET, 0, 0, 0);

    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0 - PARAGUAY_TIMEZONE_OFFSET, 0, 0, 0);

    const baseMatch = { status: "completed" };

    const [daySales, weekSales, monthSales] = await Promise.all([
      Sale.aggregate([
        { $match: { ...baseMatch, date: { $gte: startOfDay } } },
        { $unwind: "$payment" },
        { $group: { _id: null, total: { $sum: "$payment.totalAmount" } } },
      ]),
      Sale.aggregate([
        { $match: { ...baseMatch, date: { $gte: startOfWeek } } },
        { $unwind: "$payment" },
        { $group: { _id: null, total: { $sum: "$payment.totalAmount" } } },
      ]),
      Sale.aggregate([
        { $match: { ...baseMatch, date: { $gte: startOfMonth } } },
        { $unwind: "$payment" },
        { $group: { _id: null, total: { $sum: "$payment.totalAmount" } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        day: daySales[0]?.total || 0,
        week: weekSales[0]?.total || 0,
        month: monthSales[0]?.total || 0,
      }
    });
  } catch (error) {
    logger.error(`Error en getSalesTotalAllPeriods: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

// ✅ Ventas por día (últimos 7 días)
export const getSalesByDayLast7Days = async (req, res, next) => {
  try {
    const { startDate } = req.query;
    let start, end;

    if (startDate) {
      start = toUTCFromParaguay(startDate);
      end = new Date(start);
      end.setDate(start.getDate() + 7);

    } else {
      const today = new Date();
      end = new Date(today);
      start = new Date(end);
      start.setDate(end.getDate() - 6);
    }

    const sales = await Sale.aggregate([
      { $unwind: "$payment" },
      {
        $match: {
          status: { $ne: "annulled" },
          "payment.date": { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: "$payment.date",
              unit: "day",
              timezone: "-03:00" // 👈 Paraguay
            }
          },
          totalSales: { $sum: "$payment.totalAmount" }
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$_id",

            }
          },
          totalSales: 1
        }
      },
      { $sort: { date: 1 } }
    ]);


    // Generar días esperados
    const days = [];
    const cursor = new Date(start.setHours(start.getHours() - 3));
    while (cursor <= end.setHours(end.getHours() - 3)) {
      const dateStr = cursor.toISOString().split("T")[0];
      days.push(dateStr);
      cursor.setDate(cursor.getDate() + 1);
    }

    const completeData = days.map(date => {
      const found = sales.find(s => s.date === date);

      return {
        date,
        totalSales: found?.totalSales || 0
      };
    });

    res.status(200).json({
      success: true,
      data: completeData
    });
  } catch (error) {
    logger.error(`Error en getSalesByDayLast7Days: ${error.message}`, { stack: error.stack });
    next(error);
  }
};


// ✅ Ventas por método de pago (basado en pagos reales)
export const getSalesByPaymentMethod = async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const { start, end } = parseDateRange(startDate, endDate);

  try {
    const sales = await Sale.aggregate([
      {
        $match: {
          status: { $ne: "annulled" },
          date: { $gte: start, $lte: end }
        }
      },
      { $unwind: "$payment" },
      {
        $group: {
          _id: "$payment.paymentMethod",
          totalSales: { $sum: "$payment.totalAmount" },
          transactionCount: { $sum: 1 },
        }
      },
      {
        $project: {
          _id: 0,
          paymentMethod: "$_id",
          totalSales: 1,
          transactionCount: 1,
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: sales
    });
  } catch (error) {
    logger.error(`Error en getSalesByPaymentMethod: ${error.message}`, {
      queryParams: req.query,
      stack: error.stack
    });
    next(error);
  }
};

// ✅ Cierre de caja por día (basado en pagos reales) agrupado por status
export const getCashClosingByDay = async (req, res, next) => {
  try {
    const { day } = req.query;
    if (!day) {
      return res.status(400).json({
        success: false,
        message: "El parámetro 'day' es requerido (YYYY-MM-DD)"
      });
    }

    const start = toUTCFromParaguay(day, 0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    // Pipeline de agregación modificado para agrupar por status
    const result = await Sale.aggregate([
      {
        $match: {
          status: { $ne: "annulled" },
          date: { $gte: start, $lt: end }
        }
      },
      { $unwind: "$payment" }, // Descomponer los pagos
      {
        $group: {
          _id: "$status", // Agrupar por status en lugar de paymentMethod
          paymentMethods: {
            $push: {
              method: "$payment.paymentMethod",
              amount: "$payment.totalAmount"
            }
          },
          totalAmount: { $sum: "$payment.totalAmount" },
          totalIVA: { $sum: "$iva" },
          count: { $sum: 1 },
        }
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          paymentMethods: 1,
          totalAmount: 1,
          totalIVA: 1,
          count: 1,
        }
      },
      { $sort: { status: 1 } } // Ordenar por status
    ]);

    // Calcular totales generales
    const totals = result.reduce((acc, curr) => {
      acc.totalAmount += curr.totalAmount;
      acc.totalIVA += curr.totalIVA;
      acc.totalCount += curr.count;
      return acc;
    }, { totalAmount: 0, totalIVA: 0, totalCount: 0 });

    res.status(200).json({
      success: true,
      data: {
        details: result,
        totals
      }
    });
  } catch (error) {
    logger.error(`Error en getCashClosingByDay: ${error.message}`, {
      queryParams: req.query,
      stack: error.stack
    });
    next(error);
  }
};

export const getSalesByCategory = async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const { start, end } = parseDateRange(startDate, endDate);

  try {
    const sales = await Sale.aggregate([
      {
        $match: {
          status: { $ne: "annulled" },
          date: { $gte: start, $lte: end }
        }
      },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productInfo",
        }
      },
      { $unwind: "$productInfo" },
      { $unwind: "$productInfo.category" },
      {
        $group: {
          _id: "$productInfo.category",
          totalSales: { $sum: "$products.totalPrice" },
          transactionCount: { $sum: 1 },
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          totalSales: 1,
          transactionCount: 1,
        }
      },
      { $sort: { totalSales: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: sales
    });
  } catch (error) {
    logger.error(`Error en getSalesByCategory: ${error.message}`, {
      queryParams: req.query,
      stack: error.stack
    });
    next(error);
  }
};

// ✅ Ventas por vendedor (basado en pagos reales)
export const getSalesBySeller = async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const { start, end } = parseDateRange(startDate, endDate);

  try {
    const sales = await Sale.aggregate([
      {
        $match: {
          status: { $ne: "annulled" },
          date: { $gte: start, $lte: end }
        }
      },
      { $unwind: "$payment" },
      {
        $group: {
          _id: "$user",
          totalSales: { $sum: "$payment.totalAmount" },
          transactionCount: { $sum: 1 },
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        }
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: 0,
          userId: "$userInfo._id",
          sellerName: "$userInfo.name",
          totalSales: 1,
          transactionCount: 1,
        }
      },
      { $sort: { totalSales: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: sales
    });
  } catch (error) {
    logger.error(`Error en getSalesBySeller: ${error.message}`, {
      queryParams: req.query,
      stack: error.stack
    });
    next(error);
  }
};

// ✅ Ventas por productos/variantes específicos
export const getSalesByProducts = async (req, res, next) => {
  const { startDate, endDate, productIds } = req.query;

  try {
    if (!productIds) {
      return res.status(400).json({
        success: false,
        message: "Debes proporcionar productIds separados por coma"
      });
    }

    const ids = productIds
      .split(",")
      .slice(0, 5)
      .map(id => new mongoose.Types.ObjectId(id));

    const { start, end } = parseDateRange(startDate, endDate);

    const results = await Sale.aggregate([
      {
        $match: {
          status: { $ne: "annulled" },
          date: { $gte: start, $lte: end },
          "products.variantId": { $in: ids.map(id => id.toString()) }
        }
      },
      { $unwind: "$products" },
      {
        $match: {
          "products.variantId": { $in: ids.map(id => id.toString()) }
        }
      },
      {
        $group: {
          _id: "$products.variantId",
          name: { $first: "$products.name" },
          totalQuantity: { $sum: "$products.quantity" },
          totalRevenue: { $sum: "$products.totalPrice" },
        }
      },
      {
        $project: {
          _id: 0,
          variantId: "$_id",
          name: 1,
          totalQuantity: 1,
          totalRevenue: 1,
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error(`Error en getSalesByProducts: ${error.message}`, {
      queryParams: req.query,
      stack: error.stack
    });
    next(error);
  }
};

// ✅ Ventas semanales por producto (últimas 8 semanas)
export const getWeeklySalesByProducts = async (req, res, next) => {
  const { productIds } = req.query;

  try {
    if (!productIds) {
      return res.status(400).json({
        success: false,
        message: "Debes proporcionar productIds separados por coma"
      });
    }

    const ids = productIds
      .split(",")
      .slice(0, 5)
      .map(id => new mongoose.Types.ObjectId(id));

    const today = new Date();
    const weekKeys = [];
    const weeks = [];

    // Generar las últimas 8 semanas
    for (let i = 7; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i * 7);

      // Ajustar a zona horaria de Paraguay
      d.setHours(d.getHours() - PARAGUAY_TIMEZONE_OFFSET);

      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - ((d.getDay() + 6) % 7));

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const label = `${weekStart.toLocaleDateString("es-PY", {
        day: "2-digit",
        month: "2-digit"
      })} - ${weekEnd.toLocaleDateString("es-PY", {
        day: "2-digit",
        month: "2-digit"
      })}`;

      weeks.push({
        label,
        year: getISOWeekYear(d),
        week: getISOWeek(d),
        start: weekStart,
        end: weekEnd
      });
      weekKeys.push(`${getISOWeekYear(d)}-${getISOWeek(d)}`);
    }

    const startDate = weeks[0].start;
    const endDate = weeks[weeks.length - 1].end;

    const rawResults = await Sale.aggregate([
      {
        $match: {
          status: { $ne: "annulled" },
          date: { $gte: startDate, $lte: endDate },
          "products.variantId": { $in: ids.map(id => id.toString()) }
        }
      },
      { $unwind: "$products" },
      {
        $match: {
          "products.variantId": { $in: ids.map(id => id.toString()) }
        }
      },
      {
        $group: {
          _id: {
            variantId: "$products.variantId",
            week: { $isoWeek: "$date" },
            year: { $isoWeekYear: "$date" }
          },
          name: { $first: "$products.name" },
          total: { $sum: "$products.totalPrice" },
        }
      }
    ]);

    // Organizar los datos por producto
    const productMap = {};
    rawResults.forEach(item => {
      const key = item._id.variantId;
      const weekKey = `${item._id.year}-${item._id.week}`;

      if (!productMap[key]) {
        productMap[key] = { name: item.name, sales: {} };
      }
      productMap[key].sales[weekKey] = item.total;
    });

    // Formatear respuesta final
    const result = Object.entries(productMap).map(([variantId, { name, sales }]) => ({
      variantId,
      name,
      data: weekKeys.map(key => sales[key] || 0)
    }));

    res.status(200).json({
      success: true,
      data: {
        labels: weeks.map(w => w.label),
        datasets: result
      }
    });
  } catch (error) {
    logger.error(`Error en getWeeklySalesByProducts: ${error.message}`, {
      queryParams: req.query,
      stack: error.stack
    });
    next(error);
  }
};

//  Búsqueda de variantes
export const getVariants = async (req, res, next) => {
  const { q } = req.query;
  try {
    if (!q) {
      return res.status(400).json({
        success: false,
        message: "El término de búsqueda debe tener al menos 3 caracteres"
      });
    }

    const results = await Sale.aggregate([
      {
        $match: {
          status: { $ne: "annulled" },
          "products.name": { $regex: q, $options: "i" }
        }
      },
      { $unwind: "$products" },
      {
        $match: {
          "products.name": { $regex: q, $options: "i" }
        }
      },
      {
        $group: {
          _id: "$products.variantId",
          name: { $first: "$products.name" },
        }
      },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          variantId: "$_id",
          name: 1,
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error(`Error en getVariants: ${error.message}`, {
      queryParams: req.query,
      stack: error.stack
    });
    next(error);
  }
};

// Métricas combinadas para dashboard
export const getSalesDashboardMetrics = async (req, res, next) => {
  try {
    // Obtener fecha actual en zona horaria de Paraguay
    const now = new Date();
    now.setHours(now.getHours() - PARAGUAY_TIMEZONE_OFFSET);

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      todaySales,
      monthSales,
      bestSellingProducts,
      salesByCategory,
      salesByPaymentMethod
    ] = await Promise.all([
      // Ventas de hoy
      Sale.aggregate([
        {
          $match: {
            status: "completed",
            date: { $gte: startOfDay }
          }
        },
        { $unwind: "$payment" },
        {
          $group: {
            _id: null,
            total: { $sum: "$payment.totalAmount" },
            count: { $sum: 1 }
          }
        }
      ]),

      // Ventas del mes
      Sale.aggregate([
        {
          $match: {
            status: "completed",
            date: { $gte: startOfMonth }
          }
        },
        { $unwind: "$payment" },
        {
          $group: {
            _id: null,
            total: { $sum: "$payment.totalAmount" },
            count: { $sum: 1 }
          }
        }
      ]),

      // Productos más vendidos (últimos 30 días)
      Sale.aggregate([
        {
          $match: {
            status: "completed",
            date: { $gte: new Date(now.setDate(now.getDate() - 30)) }
          }
        },
        { $unwind: "$products" },
        {
          $group: {
            _id: "$products.variantId",
            name: { $first: "$products.name" },
            totalQuantity: { $sum: "$products.quantity" },
            totalRevenue: { $sum: "$products.totalPrice" }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            variantId: "$_id",
            name: 1,
            totalQuantity: 1,
            totalRevenue: 1
          }
        }
      ]),

      // Ventas por categoría (últimos 30 días)
      Sale.aggregate([
        {
          $match: {
            status: "completed",
            date: { $gte: new Date(now.setDate(now.getDate() - 30)) }
          }
        },
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
        { $unwind: "$productInfo.category" },
        {
          $group: {
            _id: "$productInfo.category",
            totalSales: { $sum: "$products.totalPrice" }
          }
        },
        { $sort: { totalSales: -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            category: "$_id",
            totalSales: 1
          }
        }
      ]),

      // Métodos de pago (últimos 30 días)
      Sale.aggregate([
        {
          $match: {
            status: "completed",
            date: { $gte: new Date(now.setDate(now.getDate() - 30)) }
          }
        },
        { $unwind: "$payment" },
        {
          $group: {
            _id: "$payment.paymentMethod",
            total: { $sum: "$payment.totalAmount" },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            method: "$_id",
            total: 1,
            count: 1,
            percentage: {
              $multiply: [
                {
                  $divide: [
                    "$total",
                    {
                      $sum: "$total"
                    }
                  ]
                },
                100
              ]
            }
          }
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        today: {
          total: todaySales[0]?.total || 0,
          count: todaySales[0]?.count || 0
        },
        month: {
          total: monthSales[0]?.total || 0,
          count: monthSales[0]?.count || 0
        },
        bestSellingProducts,
        salesByCategory,
        paymentMethods: salesByPaymentMethod
      }
    });
  } catch (error) {
    logger.error(`Error en getSalesDashboardMetrics: ${error.message}`, {
      stack: error.stack
    });
    next(error);
  }
};