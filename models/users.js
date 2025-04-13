import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const{sign,verify}=jwt

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
    enum: ['user', 'admin'],
    default: 'user'
  }
});

// encriptación de contraseña
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// verificar password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// generar JWT
userSchema.methods.generateToken = function() {
  const token = jwt.sign({ id: this._id, name:this.name, email:this.email, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: '12h' // El token expirará en 1 hora
  });
  return token;
};

const User = mongoose.model('User', userSchema);

export default User;
