// models/Sale.js

import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
  saleId: {
    type: String,  // UUID o similar
    required: true,
    unique: true
  },
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
    totalPrice: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {  // Este será el total de todos los productos
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;
