import mongoose from 'mongoose';

const categoriesSchema = new mongoose.Schema({
  categoryId: { type: Number, required: true },
  name: { type: String, required: true }
});

// Verificar si el modelo ya existe, de lo contrario, crearlo
const Category = mongoose.models.Category || mongoose.model('Category', categoriesSchema);

export default Category;
