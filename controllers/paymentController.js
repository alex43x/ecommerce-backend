import Payment from '../models/payments.js';

// Crear un pago
export const createPayment = async (req, res) => {
  const { saleId, paymentmethod, amount } = req.body;

  try {
    const payment = new Payment({ saleId, paymentmethod, amount });
    await payment.save();
    res.status(201).json({ message: 'Payment created successfully', payment });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Obtener todos los pagos
export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find();
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener un pago por ID
export const getPaymentById = async (req, res) => {
  const { id } = req.params;

  try {
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar un pago
export const updatePayment = async (req, res) => {
  const { id } = req.params;
  const { saleId, paymentmethod, amount } = req.body;

  try {
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.saleId = saleId || payment.saleId;
    payment.paymentmethod = paymentmethod || payment.paymentmethod;
    payment.amount = amount || payment.amount;

    await payment.save();
    res.status(200).json({ message: 'Payment updated successfully', payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Eliminar un pago
export const deletePayment = async (req, res) => {
  const { id } = req.params;

  try {
    const payment = await Payment.findByIdAndDelete(id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.status(200).json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
