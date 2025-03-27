import  Sale  from '../models/sales.js';
// Crear una venta
export const createSale = async (req, res) => {
  const { user, items, total, type } = req.body;

  try {
    const sale = new Sale({ user, items, total, type });
    await sale.save();
    res.status(201).json({ message: 'Sale created successfully', sale });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtener todas las ventas
export const getSales = async (req, res) => {
  try {
    const sales = await Sale.find();
    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener una venta por ID
export const getSaleById = async (req, res) => {
  const { id } = req.params;

  try {
    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.status(200).json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar una venta
export const updateSale = async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
};

// Eliminar una venta
export const deleteSale = async (req, res) => {
  const { id } = req.params;

  try {
    const sale = await Sale.findByIdAndDelete(id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.status(200).json({ message: 'Sale deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


