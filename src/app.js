require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

// 📁 Carpeta 'uploads' dentro de src
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("📁 Carpeta 'uploads' creada automáticamente dentro de src.");
}

// Middlewares
app.use(cors());
app.use(express.json());

// Sirve imágenes estáticamente desde la carpeta uploads dentro de src
app.use("/uploads", express.static(uploadsDir));

// Import middlewares
const authMiddleware = require("./middlewares/authMiddleware");
const errorHandler = require("./middlewares/errorHandler");

// Import routes
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const commentRoutes = require("./routes/commentRoutes"); // <-- Importar rutas de comentarios

// Routes
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", authMiddleware, cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/comments", commentRoutes); // <-- Usar rutas de comentarios

// Error handler
app.use(errorHandler);

module.exports = app;
