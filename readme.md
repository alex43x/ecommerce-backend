# Sistema de Gestión Comercial - Backend API

![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green)

## 📋 Descripción

API backend para un sistema de gestión comercial con:

- Gestión de usuarios y autenticación JWT  
- Administración de productos y categorías  
- Procesamiento de ventas y transacciones  
- Generación de reportes y estadísticas  
- Integración con frontend (sistema POS)  

---

## 🚀 Características Principales

- ✅ Autenticación segura con JWT  
- ✅ CRUD completo para productos, categorías y ventas  
- ✅ Reportes financieros con zona horaria de Paraguay  
- ✅ Cierre de caja basado en pagos reales  
- ✅ Dashboard con métricas comerciales  
- ✅ Documentación Swagger completa  
- ✅ Validación de datos robusta  
- ✅ Manejo centralizado de errores - Con middleware de errores

---

## 🛠 Tecnologías Utilizadas

- **Runtime:** Node.js 18.x  
- **Framework:** Express 4.x  
- **Base de datos:** MongoDB 6.x  
- **Autenticación:** JWT  
- **Documentación:** Swagger / OpenAPI 3.0  
- **Variables de entorno:** dotenv  
- **Logging:** Winston  
- **Validación:** express-validator  

---

## 🔐 Variables de Entorno

| Variable          | Descripción                           | Ejemplo                                 |
|-------------------|----------------------------------------|-----------------------------------------|
| `PORT`            | Puerto del servidor                    | `5000`                                  |
| `MONGODB_URI`     | URL de conexión a MongoDB              | `mongodb://localhost:27017/mydb`        |
| `JWT_SECRET`      | Secreto para tokens JWT                | `secreto_super_seguro`               |
| `JWT_EXPIRE`      | Expiración de tokens JWT               | `12h`                                   |
| `TIMEZONE_OFFSET` | Offset zona horaria (Paraguay)   | `-3`                                     |

---

## 📌 Endpoints Principales

### 🔐 Autenticación
- `POST /api/auth/login` - Inicio de sesión  

### 👤 Usuarios
- `GET /api/users` - Listar usuarios  
- `POST /api/users` - Crear usuario  
- `GET /api/users/:id` - Obtener usuario  
- `PUT /api/users/:id` - Actualizar usuario  
- `DELETE /api/users/:id` - Eliminar usuario  

### 📦 Productos
- `GET /api/products` - Listar productos  
- `POST /api/products` - Crear producto  
- `GET /api/products/:id` - Obtener producto  
- `GET /api/products/barcode/:barcode` - Buscar por código  
- `PUT /api/products/:id` - Actualizar producto  
- `DELETE /api/products/:id` - Eliminar producto  

### 🧾 Ventas
- `POST /api/sales` - Registrar venta  
- `GET /api/sales` - Listar ventas  
- `GET /api/sales/:id` - Obtener venta  
- `PUT /api/sales/:id/status` - Actualizar estado  

### 📊 Reportes
- `GET /api/reports/sales/totals` - Totales (día/semana/mes)  
- `GET /api/reports/sales/daily` - Ventas por día  
- `GET /api/reports/sales/cash-closing` - Cierre de caja  


## 📄 Documentación API

La documentación Swagger está disponible en:

- **Desarrollo:** [`http://localhost:5000/api-docs`](http://localhost:5000/api-docs)  



