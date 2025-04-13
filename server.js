import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import productRoutes from "./routes/products.js";
import userRoutes from './routes/users.js';
import saleRoutes from './routes/sales.js';
import categoryRoutes from './routes/categories.js';
import errorHandler from './middleware/errorMiddleware.js';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limitar a 100 solicitudes por IP
});

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Ecommerce API',
            version: '1.1.0',
            description: 'Documentación de la API del Ecommerce',
        },
    },
    apis: ['./routes/*.js'], // Archivos de rutas que contienen los comentarios de Swagger
};

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(limiter);

const specs = swaggerJsdoc(options);
app.get('/api-docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs); // specs es lo que generaste con swaggerJsdoc(options)
  });
  
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
// Rutas
app.use("/api/products", productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sales', saleRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Conexión a MongoDB
mongoose
    .connect(process.env.MONGO_URI, {
    })
    .then(() => console.log("Conectado a BD"))
    .catch((error) =>
        console.error("Error al conectar a la base de datos:", error));


app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
