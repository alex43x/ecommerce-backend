import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // clave única: YYYY-MM-DD
  seq: { type: Number, default: 0 } // contador
});

const Counter = mongoose.model("Counter", counterSchema);

export default Counter;