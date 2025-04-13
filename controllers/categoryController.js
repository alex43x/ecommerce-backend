import category from '../models/categories.js';

// Crear un categoria
export const createcategory = async (req, res, next) => {
  const { saleId, categorymethod, amount } = req.body;

  try {
    const category = new category({ saleId, categorymethod, amount });
    await category.save();
    res.status(201).json({ message: 'category created successfully', category });
  } catch (error) {
    next(error);
  }
};

// Obtener todos los categorias
export const getcategories = async (req, res, next) => {
  try {
    const categories = await category.find();
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

// Obtener un categoria por ID
export const getcategoryById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const category = await category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'category not found' });
    }
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};

// Actualizar un categoria
export const updatecategory = async (req, res, next) => {
  const { id } = req.params;
  const { saleId, categorymethod, amount } = req.body;

  try {
    const category = await category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'category not found' });
    }

    category.saleId = saleId || category.saleId;
    category.categorymethod = categorymethod || category.categorymethod;
    category.amount = amount || category.amount;

    await category.save();
    res.status(200).json({ message: 'category updated successfully', category });
  } catch (error) {
    next(error);
  }
};

// Eliminar un categoria
export const deletecategory = async (req, res, next) => {
  const { id } = req.params;

  try {
    const category = await category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: 'category not found' });
    }
    res.status(200).json({ message: 'category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
