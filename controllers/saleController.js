import Sale from '../models/sales.js';
// Crear una venta
export const createSale = async (req, res, next) => {
  const { user, items, total, type } = req.body;

  try {
    const sale = new Sale({ user, items, total, type });
    await sale.save();
    res.status(201).json({ message: 'Sale created successfully', sale });
  } catch (error) {
    next(error);
  }
};

// Obtener todas las ventas
export const getSales = async (req, res) => {
  const { page = 1, limit = 10, user } = req.query;  // Valores por defecto para paginación

  try {
    // Construir la consulta de filtro
    const query = {};
    if (user) query.user = user; // Filtrar por usuario (si se pasa como parámetro)

    // Calcular el número de documentos a omitir para la paginación
    const skip = (page - 1) * limit;

    // Obtener las ventas de la base de datos con paginación
    const sales = await Sale.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    // Obtener el total de ventas para calcular el total de páginas
    const totalSales = await Sale.countDocuments(query);

    // Responder con las ventas y la información de paginación
    res.status(200).json({
      sales,
      totalSales,
      totalPages: Math.ceil(totalSales / limit),
      currentPage: page,
      limit,
    });
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
