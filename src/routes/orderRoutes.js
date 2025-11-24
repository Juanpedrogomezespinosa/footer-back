const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrderHistory,
  getOrderById,
  cancelOrder,
} = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");

// Crear pedido (Checkout)
router.post("/checkout", authMiddleware, createOrder);

// Historial de pedidos
router.get("/history", authMiddleware, getOrderHistory);

// Obtener UNA orden (para la página de confirmación)
router.get("/:id", authMiddleware, getOrderById);

// Cancelar pedido
router.put("/:id/cancel", authMiddleware, cancelOrder);

module.exports = router;
