import Category from '../models/categories.js';
import { Product } from '../models/product.js';

// Crear un categoria
export const createcategory = async (req, res, next) => {
  const { name } = req.body;

  try {
    const newCategory = new Category({ name });
    await newCategory.save();
    res.status(201).json({ message: 'Category created successfully', category: newCategory });
  } catch (error) {
    next(error);
  }
};

// Obtener todos los categorias
export const getcategories = async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

// Obtener un categoria por ID
export const getcategoryById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'category not found' });
    }
    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};

// Actualizar una categoria
export const updatecategory = async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const oldName = category.name; // Guarda el nombre anterior

    category.categoryId = id || category.categoryId;
    category.name = name || category.name;

    await category.save();

    // Actualizar en todos los productos que tenían el nombre viejo
    await Product.updateMany(
      { category: oldName },
      { $set: { "category.$[elem]": name } },
      { arrayFilters: [{ elem: oldName }] }
    );

    res.status(200).json({ message: 'Category updated successfully', category });
  } catch (error) {
    next(error);
  }
};


// Eliminar una categoria
export const deletecategory = async (req, res, next) => {
  const { id } = req.params;

  try {
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Eliminar esa categoría de todos los productos
    await Product.updateMany(
      { category: category.name },
      { $pull: { category: category.name } }
    );

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

