import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
  abreviation: String,
  variantName: String,
  price: { type: Number, required: true },
  barcode: String,
  ivaRate: {
    type: Number,
    enum: [0, 5, 10],
    default: 10 // Por defecto 10%
  }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: [String] },
  imageURL: { type: String, required: true },
  ivaRate: { // IVA general del producto
    type: Number,
    enum: [0, 5, 10],
    default: 10
  },
  variants: [variantSchema],
  createdAt: { type: Date, default: Date.now }
});

export const Product = mongoose.model("Product", productSchema);
