import User from '../models/users.js';

// Login
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  console.log(`Solicitud de login [${email}, ${password}]`);

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Correo y/o contraseña incorrectos' });
    }

    // Verificar si el usuario está inactivo
    if (user.active === "disable") {
      return res.status(400).json({ message: 'El usuario está desactivado' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Correo y/o contraseña incorrectos' });
    }

    const token = user.generateToken();
    res.status(200).json({
      message: 'Login successful',
      token
    });
  } catch (error) {
    next(error);
  }
};


// CRUD de usuarios

// Crear un usuario
export const createUser = async (req, res,next) => {
  const { name, email, password, role } = req.body;

  try {
    const user = new User({ name, email, password, role });
    await user.save();
    res.status(201).json({ message: 'User created successfully', user });
  } catch (err) {
    if (err.code === 11000) {
      // clave duplicada (email ya registrado)
      return res.status(400).json({
        message: 'Ya existe un usuario con ese correo',
        field: Object.keys(err.keyPattern)[0], // normalmente 'email'
      });
    }
  }
};

// Obtener todos los usuarios
export const getUsers = async (req, res,next) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// Obtener un usuario por su ID
export const getUserById = async (req, res,next) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// Actualizar un usuario
export const updateUser = async (req, res, next) => {
  const { id } = req.params;
  const { name, email, password, role,active } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (password) {
      user.password = password; // Re-encriptar contraseña si se pasa
    }
    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.active = active || user.active;

    await user.save();
    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    next(error);
  }
};

// Eliminar un usuario
export const deleteUser = async (req, res,next) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
