require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

// 📁 Carpeta 'uploads' dentro de src
const uploadsDirectory = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
  console.log("📁 Carpeta 'uploads' creada automáticamente dentro de src.");
}

// Middlewares
app.use(cors());
app.use(express.json());

// Importar middlewares
const authenticationMiddleware = require("./middlewares/authMiddleware");
const errorHandlingMiddleware = require("./middlewares/errorHandler");

// Importar rutas
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const authenticationRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const commentRoutes = require("./routes/commentRoutes");
const ratingRoutes = require("./routes/ratingRoutes");

// 1. RUTAS API (MÁXIMA PRIORIDAD)
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authenticationRoutes);
app.use("/api/cart", authenticationMiddleware, cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/ratings", ratingRoutes);

// 2. Servir archivos estáticos (solo imágenes, después de las rutas API)
app.use("/uploads", express.static(uploadsDirectory));

// --- MANEJADOR DE RUTA NO ENCONTRADA (404 JSON) ---
// Esto captura cualquier solicitud que NO fue manejada por las rutas /api/* o /uploads/*
app.use((req, res, next) => {
  // Creamos un error 404 explícito que será procesado por errorHandler.js
  const error = new Error(`Ruta de API no encontrada: ${req.originalUrl}`);
  error.status = 404; // Establece el código de estado 404
  next(error); // Pasa el error al manejador final
});

// Middleware para manejo de errores (Captura 404 y 500 y devuelve JSON)
app.use(errorHandlingMiddleware);

module.exports = app;
