import User from '../models/users.js';
import { body, param, validationResult } from 'express-validator';
import logger from '../config/logger.js';
import mongoose from 'mongoose';

// Validaciones comunes para datos de usuario
const userDataValidations = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),
    
  body('email')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Máximo 255 caracteres'),
    
  body('password')
    .if(body('password').exists())
    .isLength({ min: 6 }).withMessage('Mínimo 6 caracteres')
    .isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),
    
  body('role')
    .isIn(['cashier', 'admin', 'spadmin']).withMessage('Rol inválido'),
    
  body('active')
    .optional()
    .isIn(['enable', 'disable']).withMessage('Estado inválido')
];

// Validación de ID en parámetros
const idValidation = [
  param('id')
    .notEmpty().withMessage('El ID es requerido')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID no válido')
];

// Middleware para validar resultados
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      location: error.location,
      value: error.value
    }));

    logger.warn('Errores de validación', {
      path: req.path,
      method: req.method,
      errors: formattedErrors
    });

    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: formattedErrors
    });
  }
  next();
};

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    logger.debug(`Intento de login para: ${email}`);
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.matchPassword(password))) {
      logger.warn(`Credenciales inválidas para: ${email}`);
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    if (user.active !== 'enable') {
      logger.warn(`Intento de login para cuenta desactivada: ${user._id}`);
      return res.status(403).json({ 
        success: false,
        message: 'Cuenta desactivada'
      });
    }

    const token = user.generateToken();
    logger.info(`Login exitoso para usuario: ${user._id}`);

    res.status(200).json({
      success: true,
      message: 'Autenticación exitosa',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }
      }
    });

  } catch (error) {
    logger.error(`Error en login: ${error.message}`, { error });
    next(error);
  }
};

export const createUser = [
  ...userDataValidations,
  body('email').notEmpty().withMessage('El email es requerido'),
  validateRequest,
  async (req, res, next) => {
    try {
      const { name, email, password, role, active } = req.body;
      
      const user = new User({
        name,
        email,
        password,
        role: role || 'cashier',
        active: active || 'enable'
      });

      await user.save();
      logger.info(`Usuario creado: ${user._id}`);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active
        }
      });

    } catch (error) {
      if (error.code === 11000) {
        logger.warn(`Intento de crear usuario con email duplicado: ${req.body.email}`);
        return res.status(409).json({
          success: false,
          message: 'El email ya está registrado',
          field: 'email'
        });
      }
      next(error);
    }
  }
];

export const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select('-password -__v')
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments()
    ]);

    logger.debug(`Obtenidos ${users.length} usuarios de ${total}`);

    const response = {
      success: true,
      count: users.length,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      itemsPerPage: limit,
      data: users
    };

    if (page < response.totalPages) {
      response.nextPage = `${req.baseUrl}?page=${page + 1}&limit=${limit}`;
    }
    if (page > 1) {
      response.prevPage = `${req.baseUrl}?page=${page - 1}&limit=${limit}`;
    }

    res.status(200).json(response);

  } catch (error) {
    logger.error(`Error al obtener usuarios: ${error.message}`, {
      queryParams: req.query,
      stack: error.stack
    });
    next(error);
  }
};

export const getUserById = [
  ...idValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id)
        .select('-password -__v')
        .lean();

      if (!user) {
        logger.warn(`Usuario no encontrado: ${req.params.id}`);
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });

    } catch (error) {
      logger.error(`Error al obtener usuario: ${error.message}`, { userId: req.params.id });
      next(error);
    }
  }
];

export const updateUser = [
  ...idValidation,
  ...userDataValidations,
  body('password').optional(),
  validateRequest,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, email, password, role, active } = req.body;

      const user = await User.findById(id);
      if (!user) {
        logger.warn(`Usuario no encontrado para actualización: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      user.name = name || user.name;
      user.email = email || user.email;
      user.role = role || user.role;
      user.active = active || user.active;
      if (password) user.password = password;

      await user.save();
      logger.info(`Usuario actualizado: ${user._id}`);

      res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active
        }
      });

    } catch (error) {
      if (error.code === 11000) {
        logger.warn(`Intento de actualizar a email duplicado: ${req.body.email}`);
        return res.status(409).json({
          success: false,
          message: 'El email ya está registrado',
          field: 'email'
        });
      }
      next(error);
    }
  }
];

export const deleteUser = [
  ...idValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      
      if (!user) {
        logger.warn(`Usuario no encontrado para eliminación: ${req.params.id}`);
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      logger.info(`Usuario eliminado: ${user._id}`);
      res.status(200).json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });

    } catch (error) {
      logger.error(`Error al eliminar usuario: ${error.message}`, { userId: req.params.id });
      next(error);
    }
  }
];