const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Sirve las imágenes estáticamente
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Import middlewares
const authMiddleware = require("./middlewares/authMiddleware");
const errorHandler = require("./middlewares/errorHandler");

// Import routes
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");

// Routes
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", authMiddleware, cartRoutes);
app.use("/api/orders", orderRoutes);

// Error handler
app.use(errorHandler);

module.exports = app;
