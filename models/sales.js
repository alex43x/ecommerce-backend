import mongoose from 'mongoose';
import Counter from "./counter.js";
import Timbrado from './timbrado.js';

const saleSchema = new mongoose.Schema({
  dailyId: { type: Number },

  // DATOS DE FACTURA
  invoiceNumber: { type: String }, // Número de factura (se genera al facturar)
  invoiceType: { type: String, enum: ['contado', 'credito'], default: 'contado' },
  plazo: { type: Number, default: 0 }, // solo crédito
  documentType: { type: String, enum: ['electronic', 'printed'], default: 'electronic' },

  // Datos del timbrado activo al facturar
  timbradoNumber: { type: String },   // código del timbrado
  timbradoInit: { type: Date }, // fecha de expiración
  timbrado: { type: mongoose.Schema.Types.ObjectId, ref: 'Timbrado' },

  invoiced: { type: Boolean, default: false }, // si la venta fue facturada

  // PRODUCTOS
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: String },
    quantity: { type: Number, required: true },
    name: { type: String, required: true },
    ivaRate: { type: Number, enum: [0,5,10], required: true },
    ivaAmount: { type: Number, required: true },
    totalPrice: { type: Number, required: true } // IVA incluido
  }],

  totals: {
    gravada10: { type: Number, default: 0 },
    gravada5: { type: Number, default: 0 },
    exenta: { type: Number, default: 0 },
    iva10: { type: Number, default: 0 },
    iva5: { type: Number, default: 0 }
  },

  totalAmount: { type: Number, required: true },
  ruc: { type: String, required: true },
  customerName: { type: String, required: true },

  payment: [{
    paymentMethod: { type: String, enum: ['cash','card','qr','transfer'], required: true },
    totalAmount: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  }],

  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  status: { type: String, enum: ['completed','pending','canceled','annulled','ordered'], required: true },
  stage: { type: String, enum: ['delivered','finished','processed','closed'], required: true },

  mode: { type: String, enum: ['local','carry','delivery'], required: true },

  date: { type: Date, default: Date.now }
});

// Hook para dailyId y totales
saleSchema.pre("save", async function(next) {
  if (!this.isNew) return next();

  const today = new Date().toISOString().split("T")[0];
  const counter = await Counter.findOneAndUpdate(
    { date: today },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  this.dailyId = counter.seq;

  // Totales fiscales
  this.totals.gravada10 = 0;
  this.totals.gravada5 = 0;
  this.totals.exenta = 0;
  this.totals.iva10 = 0;
  this.totals.iva5 = 0;

  this.products.forEach(p => {
    if (p.ivaRate === 10) {
      this.totals.gravada10 += p.totalPrice - p.ivaAmount;
      this.totals.iva10 += p.ivaAmount;
    } else if (p.ivaRate === 5) {
      this.totals.gravada5 += p.totalPrice - p.ivaAmount;
      this.totals.iva5 += p.ivaAmount;
    } else {
      this.totals.exenta += p.totalPrice;
    }
  });

  next();
});

// Método para facturar usando el timbrado activo
saleSchema.methods.facturar = async function() {
  if (this.invoiced) throw new Error("Venta ya facturada");

  const now = new Date();
  const timbrado = await Timbrado.findOne({
    issuedAt: { $lte: now },
    expiresAt: { $gte: now }
  }).sort({ issuedAt: 1 });

  if (!timbrado) throw new Error("No hay timbrado activo");

  const factura = await timbrado.generateInvoice(this._id);

  this.invoiceNumber = factura.invoiceNumber;
  this.timbradoNumber = timbrado.code;
  this.timbradoInit = timbrado.issuedAt;
  this.timbrado = timbrado._id;
  this.invoiced = true;

  await this.save();
  return factura;
};

const Sale = mongoose.model('Sale', saleSchema);
export default Sale;
