import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import productRoutes from "./routes/products.js";
import userRoutes from './routes/users.js';
import saleRoutes from './routes/sales.js';
import paymentRoutes from './routes/payments.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Rutas
app.use("/api/products", productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/sales', saleRoutes);

const PORT = process.env.PORT || 5000;

// Conexión a MongoDB
mongoose
    .connect(process.env.MONGO_URI, {
    })
    .then(() => console.log("Conectado a BD"))
    .catch((error) =>
        console.error("Error al conectar a la base de datos:", error));


app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
