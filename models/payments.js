import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  saleId: { type: Number, required: true },
  paymentmethod: { type: String, required: true },
  amount: { type: Number, required: true }
});

// Verificar si el modelo ya existe, de lo contrario, crearlo
const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

export default Payment;
