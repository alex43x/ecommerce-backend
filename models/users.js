import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const { sign, verify } = jwt

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['cashier', 'admin', 'spadmin'],
    default: 'cashier'
  },
  active: {
    type: String,
    enum: ['enable', 'disable'],
    default: 'enable'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Esto actualizará automáticamente updatedAt
})

// encriptación de contraseña
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// verificar password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// generar JWT
userSchema.methods.generateToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role // Solo incluye datos necesarios
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
};

const User = mongoose.model('User', userSchema);

export default User;
