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


