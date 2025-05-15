import Sale from '../models/sales.js';
import mongoose from 'mongoose';

// Crear una nueva venta
export const createSale = async (req, res) => {
  console.log("Nuevo Producto:", req.body)
  try {
    const { products, paymentMethod, user, iva, ruc, status } = req.body;

    // Verificar si los productos fueron enviados
    if (!products || products.length === 0) {
      return res.status(400).json({ message: 'Debe incluir al menos un producto en la venta.' });
    }

    // Calcular el totalAmount sumando el total de cada producto
    let totalAmount = 0;
    products.forEach(product => {
      totalAmount += product.totalPrice;  // Asumimos que `totalPrice` ya incluye cantidad * precio unitario
    });

    // Crear una nueva venta
    const newSale = new Sale({
      products,
      totalAmount,  // Total de todos los productos
      paymentMethod,
      user, ruc, iva, status
    });

    // Guardar la venta en la base de datos
    await newSale.save();

    // Responder con la venta creada
    res.status(201).json(newSale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Obtener todas las ventas
export const getSales = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    user,
    status,
    startDate,
    endDate,
    paymentMethod,
    ruc,
    product, // Nuevo filtro por producto
  } = req.query;

  // Función auxiliar para evitar problemas con zonas horarias (formato local)
  function toLocalDate(dateStr, hours = 0, minutes = 0, seconds = 0, ms = 0) {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds, ms);
  }

  try {
    const query = {}; // Aquí se irán acumulando los filtros

    // Filtrar por usuario
    if (user) query.user = user;

    // Filtrar por estado (evitar 'all')
    if (status && status !== "all") query.status = status;

    // Filtrar por método de pago exacto
    if (paymentMethod) query.paymentMethod = paymentMethod;

    // Filtrar por RUC exacto
    if (ruc) {
      query.ruc = { $regex: ruc, $options: "i" };
    }

    // Filtrar por producto dentro del array de productos
    if (product) {
      query.products = {
        $elemMatch: {
          name: { $regex: new RegExp(product, "i") }, // búsqueda insensible a mayúsculas
        },
      };
    }

    // Filtrar por rango de fechas
    if (startDate && endDate) {
      const start = toLocalDate(startDate, 0, 0, 0, 0); // inicio del día
      const end = toLocalDate(endDate, 23, 59, 59, 999); // fin del día
      query.date = { $gte: start, $lte: end };
    }

    const skip = (page - 1) * limit;

    // Buscar ventas con los filtros, ordenar, paginar y poblar el nombre del usuario
    const sales = await Sale.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "name");

    const totalSales = await Sale.countDocuments(query);

    res.status(200).json({
      sales,
      totalSales,
      totalPages: Math.ceil(totalSales / limit),
      currentPage: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





export const updateSaleStatus = async (req, res) => {
  const { id } = req.params;
  const { status, ruc } = req.body;
  console.log(id, status)

  if (!["pending", "completed", "canceled"].includes(status)) {
    return res.status(400).json({ message: "Estado inválido" });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  try {
    const updated = await Sale.updateMany(
      { _id: id },
      { $set: { status, ruc } }
    );

    if (updated.modifiedCount === 0) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    res.status(200).json({ message: "Estado actualizado", result: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// Obtener una venta por ID
export const getSaleById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.status(200).json(sale);
  } catch (error) {
    next(error);
  }
};

// Actualizar una venta
export const updateSale = async (req, res, next) => {
  const { id } = req.params;
  const { user, items, total, type } = req.body;

  try {
    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    sale.user = user || sale.user;
    sale.items = items || sale.items;
    sale.total = total || sale.total;
    sale.type = type || sale.type;

    await sale.save();
    res.status(200).json({ message: 'Sale updated successfully', sale });
  } catch (error) {
    next(error);
  }
};

// Eliminar una venta
export const deleteSale = async (req, res, next) => {
  const { id } = req.params;

  try {
    const sale = await Sale.findByIdAndDelete(id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.status(200).json({ message: 'Sale deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getSalesByProduct = async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query; // Valores por defecto

  try {
    const sales = await Sale.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.product", totalSold: { $sum: "$items.quantity" } } },
      { $sort: { totalSold: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);

    const totalSales = await Sale.aggregate([
      { $unwind: "$items" },
      { $group: { _id: "$items.product" } },
    ]);

    const totalPages = Math.ceil(totalSales.length / limit);
    const nextPage = page < totalPages ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    res.status(200).json({
      sales,
      pagination: {
        currentPage: page,
        nextPage,
        prevPage,
        totalPages,
        totalSales: totalSales.length,
      },
    });
  } catch (error) {
    next(error); // Usar 'next' para manejar el error
  }
};

export const getSalesReport = async (req, res, next) => {
  const { startDate, endDate } = req.query;

  try {
    let filter = {};

    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const totalSales = await Sale.aggregate([
      { $match: filter },
      { $group: { _id: null, totalSales: { $sum: "$total" } } },
    ]);

    res.status(200).json({
      totalSales: totalSales[0]?.totalSales || 0, // Si no hay ventas, el total es 0
    });
  } catch (error) {
    next(error); // Usar 'next' para manejar el error en un middleware
  }
};

export const getSalesByPaymentMethod = async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query; // Valores por defecto

  try {
    const sales = await Sale.aggregate([
      { $group: { _id: "$paymentMethod", totalSales: { $sum: "$total" } } },
      { $sort: { totalSales: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);

    const totalSales = await Sale.aggregate([
      { $group: { _id: "$paymentMethod" } },
    ]);

    const totalPages = Math.ceil(totalSales.length / limit);
    const nextPage = page < totalPages ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    res.status(200).json({
      sales,
      pagination: {
        currentPage: page,
        nextPage,
        prevPage,
        totalPages,
        totalSales: totalSales.length,
      },
    });
  } catch (error) {
    next(error); // Usar 'next' para manejar el error
  }
};

export const getSalesByStatus = async (req, res, next) => {
  const { status } = req.query;
  const { page = 1, limit = 10 } = req.query; // Valores por defecto

  try {
    const sales = await Sale.aggregate([
      { $match: { status } },
      { $group: { _id: "$status", totalSales: { $sum: "$total" } } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);

    const totalSales = await Sale.aggregate([
      { $match: { status } },
    ]);

    const totalPages = Math.ceil(totalSales.length / limit);
    const nextPage = page < totalPages ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    res.status(200).json({
      sales,
      pagination: {
        currentPage: page,
        nextPage,
        prevPage,
        totalPages,
        totalSales: totalSales.length,
      },
    });
  } catch (error) {
    next(error); // Usar 'next' para manejar el error
  }
};
