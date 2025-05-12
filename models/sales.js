import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    name: { type: String, required: true },
    iva: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {  // total de todos los productos
    type: Number,
    required: true
  },
  ruc: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  iva: {
    type: Number,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'canceled'],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;
