import Customer from '../models/customer.js';
import mongoose from 'mongoose';

// Crear un nuevo cliente
export const createCustomer = async (req, res, next) => {
  try {
    const { ruc, name, email, phone, address } = req.body;

    // Validación básica
    if (!ruc || !name) {
      const error = new Error('RUC y nombre son obligatorios');
      error.name = 'ValidationError';
      throw error;
    }

    // Verificar si el RUC ya existe
    const existingCustomer = await Customer.findOne({ ruc });
    if (existingCustomer) {
      const error = new Error('El RUC ya está registrado');
      error.name = 'DuplicateError';
      error.status = 409; // Conflict
      throw error;
    }

    const newCustomer = new Customer({
      ruc,
      name,
      email,
      phone,
      address
    });

    await newCustomer.save();
    res.status(201).json(newCustomer);
  } catch (error) {
    next(error);
  }
};

// Obtener todos los clientes (con paginación)
export const getCustomers = async (req, res, next) => {
  const { page = 1, limit = 10, search = '', active } = req.query;

  try {
    const query = {};

    if (search) {
      query.$or = [
        { ruc: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum),
      Customer.countDocuments(query)
    ]);
    console.log(customers)
    res.status(200).json({
      customers,
      totalCustomers: total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      limit: limitNum
    });
  } catch (error) {
    next(error);
  }
};

// Obtener un cliente por ID
export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      const error = new Error('Cliente no encontrado');
      error.name = 'NotFoundError';
      throw error;
    }
    res.status(200).json(customer);
  } catch (error) {
    next(error);
  }
};

// Actualizar un cliente
export const updateCustomer = async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('ID inválido');
    error.name = 'ValidationError';
    throw error;
  }

  try {
    const customer = await Customer.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      const error = new Error('Cliente no encontrado');
      error.name = 'NotFoundError';
      throw error;
    }

    res.status(200).json(customer);
  } catch (error) {
    next(error);
  }
};

// Desactivar/Activar cliente (en lugar de borrar)
export const toggleCustomerStatus = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      const error = new Error('Cliente no encontrado');
      error.name = 'NotFoundError';
      throw error;
    }

    customer.isActive = !customer.isActive;
    await customer.save();

    res.status(200).json({
      message: `Cliente ${customer.isActive ? 'activado' : 'desactivado'} correctamente`,
      customer
    });
  } catch (error) {
    next(error);
  }
};

// Buscar clientes por RUC o nombre (para autocompletar)
export const searchCustomers = async (req, res, next) => {
  const { term } = req.query;

  try {
    const customers = await Customer.find({
      $or: [
        { ruc: term },  // Búsqueda exacta del RUC
        { name: { $regex: term, $options: 'i' } }  // Búsqueda por coincidencia en el nombre (como antes)
      ],
      isActive: true
    }).limit(10).select('ruc name phone');

    res.status(200).json(customers);
  } catch (error) {
    next(error);
  }
};