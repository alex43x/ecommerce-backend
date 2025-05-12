import { Product } from "../models/product.js";


//Crear un producto
export const createProduct = async (req, res, next) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    next(error);
  }
};

// Obtener productos con búsqueda, paginación y filtros
export const getProducts = async (req, res) => {
  console.log("Solicitud de productos, ", req.query)

  const { page = 1, limit = 10, category, search, sortBy } = req.query;  // Valores por defecto si no se pasan parámetros

  try {
    // Construccion de la consulta de filtro
    const query = {};
    // Filtrar por categoría
    if (category === 'noBebidas') {
      query.category = { $ne: 'Bebidas' }; // Excluye productos que tengan "bebidas" en el array
    } else if (category) {
      query.category = category;
    }
    if (search) query.name = { $regex: search, $options: 'i' }; // Búsqueda por nombre 

    // Ordenar
    let sort = {};
    if (sortBy) {
      if (sortBy === 'priceAsc') {
        sort = { price: 1 };  // Ordenar por precio ascendente
      } else if (sortBy === 'priceDesc') {
        sort = { price: -1 }; // Ordenar por precio descendente
      } else if (sortBy === 'nameAsc') {
        sort = { name: 1 };   // Ordenar alfabéticamente por nombre ascendente
      } else if (sortBy === 'nameDesc') {
        sort = { name: -1 };  // Ordenar alfabéticamente por nombre descendente
      } else if (sortBy === "dateAsc") {
        sort = { createdAt: 1 }
      } else if (sortBy === "dateDesc") {
        sort = { createdAt: -1 }
      }
    }

    // Calcular el número de documentos a omitir para la paginación
    const skip = (page - 1) * limit;

    // Obtener los productos de la base de datos con paginación, filtros y ordenación
    const products = await Product.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .collation({ locale: "en", strength: 1 })
      .sort(sort) // Aplicar ordenación
      .exec();

    // Obtener el total de productos para saber cuántas páginas hay
    const totalProducts = await Product.countDocuments(query);

    // Responder con los productos y la información de paginación
    res.status(200).json({
      products,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      limit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 📌 Obtener un producto por ID
export const getProductbyID = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Producto no encontrado" });
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// 📌 Actualizar un producto
export const updateProduct = async (req, res, next) => {
  console.log(req.body)
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: "Producto editado" });
  } catch (error) {
    next(error);
  }
};

// 📌 Eliminar un producto
export const deleteProduct = async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Producto eliminado" });
  } catch (error) {
    next(error);
  }
};

export const getTopSellingProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $lookup: { from: "sales", localField: "_id", foreignField: "items.product", as: "sales_info" } },
      { $addFields: { salesCount: { $size: "$sales_info" } } },
      { $sort: { salesCount: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
