import Sale from "../models/sales.js";
import mongoose from "mongoose";

// Función auxiliar para evitar problemas con zonas horarias
function toLocalDate(dateStr, hours = 0, minutes = 0, seconds = 0, ms = 0) {
  const parts = dateStr.split("-").map(Number);
  let year, month, day;

  if (parts[0] > 31) {
    // Formato YYYY-MM-DD
    [year, month, day] = parts;
  } else {
    // Formato DD-MM-YYYY
    [day, month, year] = parts;
  }

  return new Date(year, month - 1, day, hours, minutes, seconds, ms);
}

// ✅ Ventas totales del día, semana y mes
export const getSalesTotalAllPeriods = async (req, res, next) => {
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const startOfWeek = new Date(now);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const baseMatch = { status: "completed" };

  try {
    const [daySales, weekSales, monthSales] = await Promise.all([
      Sale.aggregate([
        { $match: { ...baseMatch, date: { $gte: startOfDay } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Sale.aggregate([
        { $match: { ...baseMatch, date: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Sale.aggregate([
        { $match: { ...baseMatch, date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    res.status(200).json({
      day: daySales[0]?.total || 0,
      week: weekSales[0]?.total || 0,
      month: monthSales[0]?.total || 0,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Ventas totales por día en los últimos 7 días
export const getSalesByDayLast7Days = async (req, res, next) => {
  const { startDate } = req.query;
  console.log(req.query)

  // Si hay startDate, se usa; si no, se toma 6 días antes de hoy
  const start = startDate
    ? toLocalDate(startDate, 0, 0, 0, 0)
    : (() => {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      return d;
    })();

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  try {
    const sales = await Sale.aggregate([
      {
        $match: {
          status: "completed",
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalSales: { $sum: "$totalAmount" },
        },
      },
      { $project: { _id: 0, date: "$_id", totalSales: 1 } },
      { $sort: { date: 1 } },
    ]);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d.toISOString().split("T")[0];
    });

    const complete = days.map((date) => {
      const found = sales.find((s) => s.date === date);
      return { date, totalSales: found?.totalSales || 0 };
    });

    res.status(200).json(complete);
  } catch (error) {
    next(error);
  }
};

// ✅ Ventas por método de pago
export const getSalesByPaymentMethod = async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 30);
  defaultStart.setHours(0, 0, 0, 0);

  const filter = {
    status: "completed",
    date: {
      $gte: startDate ? toLocalDate(startDate, 0, 0, 0, 0) : defaultStart,
      ...(endDate && { $lte: toLocalDate(endDate, 23, 59, 59, 999) }),
    },
  };

  try {
    const sales = await Sale.aggregate([
      { $match: filter },
      { $group: { _id: "$paymentMethod", totalSales: { $sum: "$totalAmount" } } },
      { $project: { _id: 0, paymentMethod: "$_id", totalSales: 1 } },
    ]);

    res.status(200).json(sales);
  } catch (error) {
    next(error);
  }
};

// ✅ Ventas por categoría
export const getSalesByCategory = async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 30);
  defaultStart.setHours(0, 0, 0, 0);

  const filter = {
    status: "completed",
    date: {
      $gte: startDate ? toLocalDate(startDate, 0, 0, 0, 0) : defaultStart,
      ...(endDate && { $lte: toLocalDate(endDate, 23, 59, 59, 999) }),
    },
  };

  try {
    const sales = await Sale.aggregate([
      { $match: filter },
      { $unwind: "$products" },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      { $unwind: "$productInfo.category" },
      {
        $group: {
          _id: "$productInfo.category",
          totalSales: { $sum: "$products.totalPrice" },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          totalSales: 1,
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    res.status(200).json(sales);
  } catch (error) {
    next(error);
  }
};

// ✅ Ventas por vendedor
export const getSalesBySeller = async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 30);
  defaultStart.setHours(0, 0, 0, 0);

  const filter = {
    status: "completed",
    date: {
      $gte: startDate ? toLocalDate(startDate, 0, 0, 0, 0) : defaultStart,
      ...(endDate && { $lte: toLocalDate(endDate, 23, 59, 59, 999) }),
    },
  };

  try {
    const sales = await Sale.aggregate([
      { $match: filter },
      { $group: { _id: "$user", totalSales: { $sum: "$totalAmount" } } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      { $project: { _id: 0, sellerName: "$userInfo.name", totalSales: 1 } },
    ]);

    res.status(200).json(sales);
  } catch (error) {
    next(error);
  }
};

// ✅ Ventas por producto (variantes)
export const getSalesByProducts = async (req, res, next) => {
  const { startDate, endDate, productIds } = req.query;

  try {
    if (!productIds) {
      return res.status(400).json({ message: "Debes proporcionar productIds" });
    }

    const ids = productIds
      .split(",")
      .slice(0, 5)
      .map((id) => new mongoose.Types.ObjectId(id));

    const matchStage = {
      status: "completed",
      "products.variantId": { $in: ids.map(id => id.toString()) },
    };

    if (startDate && endDate) {
      matchStage.date = {
        $gte: toLocalDate(startDate, 0, 0, 0, 0),
        $lte: toLocalDate(endDate, 23, 59, 59, 999),
      };
    }

    const results = await Sale.aggregate([
      { $match: matchStage },
      { $unwind: "$products" },
      {
        $match: {
          "products.variantId": { $in: ids.map(id => id.toString()) },
        },
      },
      {
        $group: {
          _id: "$products.variantId",
          name: { $first: "$products.name" },
          totalQuantity: { $sum: "$products.quantity" },
          totalRevenue: { $sum: "$products.totalPrice" },
        },
      },
      {
        $project: {
          _id: 0,
          variantId: "$_id",
          name: 1,
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

// ✅ Búsqueda de variantes
export const getVariants = async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ message: 'Parámetro de búsqueda requerido' });
  }

  try {
    const results = await Sale.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$products' },
      {
        $match: {
          'products.name': { $regex: q, $options: 'i' },
        },
      },
      {
        $group: {
          _id: '$products.variantId',
          name: { $first: '$products.name' },
        },
      },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          variantId: '$_id',
          name: 1,
        },
      },
    ]);

    res.json(results);
  } catch (error) {
    console.error('Error al buscar variantes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
