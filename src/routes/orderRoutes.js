const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrderHistory,
  getOrderById, // <-- 1. Importar la nueva función
} = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");

// Ruta para crear una orden y obtener la sesión de pago
router.post("/checkout", authMiddleware, createOrder);

// Ruta para obtener el historial de órdenes (protegida)
router.get("/history", authMiddleware, getOrderHistory);

// --- 👇 2. AÑADIR NUEVA RUTA ---
// Ruta para obtener UNA orden (para la página de confirmación)
router.get("/:id", authMiddleware, getOrderById);

module.exports = router;
