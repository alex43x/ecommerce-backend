import Customer from '../models/customer.js';
import mongoose from 'mongoose';
import logger from '../config/logger.js';

// Crear un nuevo cliente
export const createCustomer = async (req, res, next) => {
  try {
    const { ruc, name, email, phone, address } = req.body;
    logger.info(`Intentando crear cliente: ${ruc} - ${name}`);

    // Validación básica
    if (!ruc || !name) {
      const error = new Error('RUC y nombre son obligatorios');
      error.name = 'ValidationError';
      logger.warn(`Validación fallida al crear cliente: RUC=${ruc}, Nombre=${name}`);
      throw error;
    }

    // Verificar si el RUC ya existe
    const existingCustomer = await Customer.findOne({ ruc });
    if (existingCustomer) {
      const error = new Error('El RUC ya está registrado');
      error.name = 'DuplicateError';
      error.status = 409; // Conflict
      logger.warn(`RUC duplicado al crear cliente: ${ruc}`);
      throw error;
    }

    // Preparar datos para crear, permitiendo email y phone vacíos
    const customerData = {
      ruc,
      name,
      address
    };

    // Solo incluir email si no está vacío
    if (email !== '' && email !== null && email !== undefined) {
      customerData.email = email;
    }

    // Solo incluir phone si no está vacío
    if (phone !== '' && phone !== null && phone !== undefined) {
      customerData.phone = phone;
    }

    const newCustomer = new Customer(customerData);

    await newCustomer.save();
    logger.info(`Cliente creado exitosamente: ${ruc} - ${name} (ID: ${newCustomer._id})`);
    res.status(201).json(newCustomer);
  } catch (error) {
    logger.error(`Error al crear cliente: ${error.message}`, { 
      error: error.name,
      stack: error.stack,
      body: req.body 
    });
    next(error);
  }
};

// Obtener todos los clientes (con paginación)
export const getCustomers = async (req, res, next) => {
  const { page = 1, limit = 10, search = '', active, sortBy = 'dateDesc' } = req.query;

  try {
    logger.info(`Obteniendo clientes: page=${page}, limit=${limit}, search="${search}", active=${active}, sortBy=${sortBy}`);
    
    const query = {};

    if (search) {
      query.$or = [
        { ruc: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
      logger.debug(`Búsqueda aplicada: ${search}`);
    }

    if (active !== undefined) {
      query.isActive = active === 'true';
      logger.debug(`Filtro activo aplicado: ${query.isActive}`);
    }

    const sortOptions = {
      dateDesc: { createdAt: -1 },
      dateAsc: { createdAt: 1 },
      nameAsc: { name: 1 },
      nameDesc: { name: -1 },
    };

    const sort = sortOptions[sortBy] || sortOptions.dateDesc;
    logger.debug(`Ordenamiento aplicado: ${JSON.stringify(sort)}`);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Customer.countDocuments(query)
    ]);

    logger.info(`Clientes obtenidos exitosamente: ${customers.length} de ${total} totales`);
    
    res.status(200).json({
      customers,
      totalCustomers: total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      limit: limitNum
    });
  } catch (error) {
    logger.error(`Error al obtener clientes: ${error.message}`, { 
      error: error.name,
      stack: error.stack,
      query: req.query 
    });
    next(error);
  }
};

// Obtener un cliente por RUC 
export const getCustomerById = async (req, res, next) => {
  try {
    const { id: ruc } = req.params;
    logger.info(`Buscando cliente por RUC: ${ruc}`);

    const customer = await Customer.findOne({ ruc });

    if (!customer) {
      const error = new Error('Cliente no encontrado');
      error.name = 'NotFoundError';
      logger.warn(`Cliente con RUC ${ruc} no encontrado`);
      throw error;
    }

    logger.info(`Cliente encontrado: ${customer.ruc} - ${customer.name}`);
    res.status(200).json(customer);

  } catch (error) {
    logger.error(`Error al obtener cliente por RUC: ${error.message}`, { 
      error: error.name,
      stack: error.stack,
      ruc: req.params.id 
    });
    next(error);
  }
};


// Actualizar un cliente
export const updateCustomer = async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('ID inválido');
    error.name = 'ValidationError';
    logger.warn(`ID inválido al actualizar cliente: ${id}`);
    throw error;
  }

  try {
    logger.info(`Actualizando cliente ID: ${id}`, { updateData: req.body });
    
    // Limpiar los campos que vienen vacíos para mantener los valores existentes
    const updateData = { ...req.body };
    
    // Si email viene vacío (null, undefined o string vacío), lo eliminamos del update
    if (updateData.email === '' || updateData.email === null || updateData.email === undefined) {
      logger.debug(`Campo email vacío, se mantendrá valor existente para cliente: ${id}`);
      delete updateData.email;
    }
    
    // Si phone viene vacío (null, undefined o string vacío), lo eliminamos del update
    if (updateData.phone === '' || updateData.phone === null || updateData.phone === undefined) {
      logger.debug(`Campo phone vacío, se mantendrá valor existente para cliente: ${id}`);
      delete updateData.phone;
    }
    
    // Validar que RUC y nombre no estén vacíos si se están actualizando
    if (updateData.ruc !== undefined && !updateData.ruc) {
      const error = new Error('RUC no puede estar vacío');
      error.name = 'ValidationError';
      logger.warn(`RUC vacío al actualizar cliente: ${id}`);
      throw error;
    }
    
    if (updateData.name !== undefined && !updateData.name) {
      const error = new Error('Nombre no puede estar vacío');
      error.name = 'ValidationError';
      logger.warn(`Nombre vacío al actualizar cliente: ${id}`);
      throw error;
    }

    logger.debug(`Datos limpios para actualización: ${JSON.stringify(updateData)}`);

    const customer = await Customer.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!customer) {
      const error = new Error('Cliente no encontrado');
      error.name = 'NotFoundError';
      logger.warn(`Cliente no encontrado al actualizar: ${id}`);
      throw error;
    }

    logger.info(`Cliente actualizado exitosamente: ${id} - ${customer.ruc} - ${customer.name}`);
    res.status(200).json(customer);
  } catch (error) {
    logger.error(`Error al actualizar cliente: ${error.message}`, { 
      error: error.name,
      stack: error.stack,
      id: id,
      body: req.body 
    });
    next(error);
  }
};

// Desactivar/Activar cliente (en lugar de borrar)
export const toggleCustomerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info(`Cambiando estado de cliente ID: ${id}`);

    const customer = await Customer.findById(id);
    if (!customer) {
      const error = new Error('Cliente no encontrado');
      error.name = 'NotFoundError';
      logger.warn(`Cliente no encontrado al cambiar estado: ${id}`);
      throw error;
    }

    const oldStatus = customer.isActive;
    customer.isActive = !customer.isActive;
    await customer.save();

    logger.info(`Estado de cliente cambiado: ${id} - ${oldStatus} -> ${customer.isActive}`);
    
    res.status(200).json({
      message: `Cliente ${customer.isActive ? 'activado' : 'desactivado'} correctamente`,
      customer
    });
  } catch (error) {
    logger.error(`Error al cambiar estado de cliente: ${error.message}`, { 
      error: error.name,
      stack: error.stack,
      id: req.params.id 
    });
    next(error);
  }
};

// Buscar clientes por RUC o nombre (para autocompletar)
export const searchCustomers = async (req, res, next) => {
  const { term } = req.query;

  try {
    logger.info(`Buscando clientes para autocompletar: "${term}"`);

    const customers = await Customer.find({
      $or: [
        { ruc: term },  // Búsqueda exacta del RUC
        { name: { $regex: term, $options: 'i' } }  // Búsqueda por coincidencia en el nombre (como antes)
      ],
      isActive: true
    }).limit(10).select('ruc name phone');

    logger.info(`Búsqueda completada: ${customers.length} clientes encontrados para término "${term}"`);
    
    res.status(200).json(customers);
  } catch (error) {
    logger.error(`Error al buscar clientes: ${error.message}`, { 
      error: error.name,
      stack: error.stack,
      term: term 
    });
    next(error);
  }
};