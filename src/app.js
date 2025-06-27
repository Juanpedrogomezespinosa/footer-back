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

// Sirve imágenes estáticamente desde la carpeta uploads dentro de src
app.use("/uploads", express.static(uploadsDirectory));

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
const ratingRoutes = require("./routes/ratingRoutes"); // ✅ AÑADIDO

// Rutas
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authenticationRoutes);
app.use("/api/cart", authenticationMiddleware, cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/ratings", ratingRoutes); // ✅ AÑADIDO

// Middleware para manejo de errores
app.use(errorHandlingMiddleware);

module.exports = app;
