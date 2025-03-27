import mongoose from 'mongoose';

const salesSchema = new mongoose.Schema({
  user: { type: String, required: true },
  items: [{ productID: Number, variant: String, price: Number, quantity: Number }],
  total: { type: Number, required: true },
  type: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Sale = mongoose.model('Sale', salesSchema);
export default Sale;
