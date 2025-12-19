import mongoose from "mongoose";

const timbradoSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // timbrado de 8 dígitos
  issuedAt: { type: Date, default: Date.now },          // fecha de emisión
  expiresAt: { type: Date, required: true },            // fecha de expiración
  lastInvoiceNumber: { type: Number, default: 0 },      // correlativo interno
  establishment: { type: String, required: true, default: "001" }, // 3 dígitos
  branch: { type: String, required: true, default: "001" },        // 3 dígitos
  maxInvoices: { type: Number, default: 999999 },       // límite de facturas para este timbrado
});

// Verifica si el timbrado está activo (solo según fecha)
timbradoSchema.methods.isActive = function() {
  const now = new Date();
  return now >= this.issuedAt && now <= this.expiresAt;
};

// Genera el próximo número de factura paraguayo
timbradoSchema.methods.generateInvoice = async function(ventaId) {
  if (!this.isActive()) throw new Error("Timbrado expirado");

  if (this.lastInvoiceNumber >= this.maxInvoices) {
    throw new Error("Se alcanzó el límite de facturas para este timbrado");
  }

  this.lastInvoiceNumber += 1;

  const correlativo = String(this.lastInvoiceNumber).padStart(6, "0");
  const invoiceNumber = `${this.establishment}-${this.branch}-${correlativo}`;

  await this.save();

  return { timbradoCode: this.code, invoiceNumber };
};

export default mongoose.model("Timbrado", timbradoSchema);
