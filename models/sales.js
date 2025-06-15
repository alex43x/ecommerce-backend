import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
  products: [{
    productId: { // ← ID del PRODUCTO (no de la variante)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    variantId: { // ← ID de la variante 
      type: String
    },
    quantity: { type: Number, required: true },//Cantidad del producto
    name: { type: String, required: true },//Nombre del producto
    iva: { type: Number, required: true },//IVA individual, 
    totalPrice: { type: Number, required: true }//Monto total del producto
  }],
  totalAmount: { type: Number, required: true }, //Monto total de la venta
  ruc: { type: String, required: true },
  payment: [{//Array de Pagos
    paymentMethod: { type: String, required: true, enum: ['cash', 'card', 'qr', 'transfer'] },//Método de Pago
    totalAmount: { type: Number, required: true }, //Cantidad pagada con el método de pago
    date: { type: Date, default: Date.now }//Fecha de cada pago
  }],
  iva: { type: Number, required: true },//IVA generado por la venta
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Vendedor que realizó la venta
  status: { type: String, enum: ['completed', 'pending', 'canceled', 'annulled', 'ordered'], required: true },
  /*Estados de venta
  Completed: Orden Terminada sin errores
  Pending: Orden Pendiente (Sin Pagar)
  Ordered: Orden Pedido (Pago Parcial)
  Canceled: Orden Cancelada (si se cancela antes de la confirmación)
  Annulled: Orden Anulado (igual que cancelled pero después de la confirmación)*/
  stage: { type: String, enum: ['delivered', 'finished', 'processed', 'closed'], required: true },
  /*Etapas de Orden 
  Delivered: Entregado,
  Finished: Terminado, listo para entregar
  Processed: En proceso, aún no se puede entregar
  Closed: Terminado, por anulación o cancelación*/
  mode: { type: String, enum: ['local', 'carry', 'delivery'], required: true },//Modo de venta (En local, para llevar o delivery)
  date: { type: Date, default: Date.now }//Fecha en la que se realizó la orden
});

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;
