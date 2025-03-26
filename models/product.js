import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  variants: [
    {
      size: String,
      color: String,
      stock: Number,
    },
  ],
});

export const Product = mongoose.model("Product", productSchema);
