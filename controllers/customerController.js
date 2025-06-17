import Customer from '../models/customer.js';
import mongoose from 'mongoose';

// Crear un nuevo cliente
export const createCustomer = async (req, res) => {
  try {
    const { ruc, name, email, phone, address } = req.body;

    // Validación básica
    if (!ruc || !name) {
      return res.status(400).json({ message: 'RUC y nombre son obligatorios' });
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
    if (error.code === 11000) { // Error de duplicado (RUCI único)
      res.status(400).json({ message: 'El RUC ya está registrado' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// Obtener todos los clientes (con paginación)
export const getCustomers = async (req, res) => {
  const { page = 1, limit = 10, search = '', active } = req.query;

  try {
    const query = {};
    
    // Filtro de búsqueda
    if (search) {
      query.$or = [
        { ruc: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Filtro por estado activo
    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { name: 1 }
    };

    const customers = await Customer.paginate(query, options);

    res.status(200).json({
      customers: customers.docs,
      totalCustomers: customers.totalDocs,
      totalPages: customers.totalPages,
      currentPage: customers.page,
      limit: customers.limit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un cliente por ID
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar un cliente
export const updateCustomer = async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  try {
    const customer = await Customer.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.status(200).json(customer);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'El RUC ya está registrado' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// Desactivar/Activar cliente (en lugar de borrar)
export const toggleCustomerStatus = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    customer.isActive = !customer.isActive;
    await customer.save();

    res.status(200).json({ 
      message: `Cliente ${customer.isActive ? 'activado' : 'desactivado'} correctamente`,
      customer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Buscar clientes por RUC o nombre (para autocompletar)
export const searchCustomers = async (req, res) => {
  const { term } = req.query;

  try {
    const customers = await Customer.find({
      $or: [
        { ruc: { $regex: term, $options: 'i' } },
        { name: { $regex: term, $options: 'i' } }
      ],
      isActive: true
    }).limit(10).select('ruc name phone');

    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};