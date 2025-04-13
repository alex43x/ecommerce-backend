import mongoose from "mongoose";
import { stringify } from "uuid";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  imageURL: { type: String, required: true },
  variants: [
    {
      abreviation: String,
      size: String,
      price: Number,
    },
  ],
  createdAt: { type: Date, default: Date.now }
});

export const Product = mongoose.model("Product", productSchema);
