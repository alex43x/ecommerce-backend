import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  ruc: {
    type: String,
    required: true,
    unique: true,
    trim: true,
   
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} no es un email válido!`
    }
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9\s+-]{6,20}$/.test(v);
      },
      message: props => `${props.value} no es un teléfono válido!`
    }
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    neighborhood: { type: String, trim: true },
    reference: { type: String, trim: true }
  },
  isActive: {
    type: Boolean,
    default: true
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
});

// Middleware para actualizar la fecha de modificación
customerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Método para desactivar cliente
customerSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;