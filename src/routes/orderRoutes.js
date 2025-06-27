const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrderHistory,
} = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");

// Ruta para crear una orden y obtener la sesión de pago
router.post("/checkout", authMiddleware, createOrder);

// Ruta para obtener el historial de órdenes (protegida)
router.get("/history", authMiddleware, getOrderHistory);

module.exports = router;
