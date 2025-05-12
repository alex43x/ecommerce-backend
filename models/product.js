import mongoose from "mongoose";
import { stringify } from "uuid";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: [String]},
  imageURL: { type: String, required: true },
  variants: [
    {
      abreviation: String,
      variantName: String,
      price: Number,
      barcode:String
    },
  ],
  createdAt: { type: Date, default: Date.now }
});

export const Product = mongoose.model("Product", productSchema);
