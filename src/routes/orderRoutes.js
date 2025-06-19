const express = require("express");
const router = express.Router();

const { getOrderHistory } = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");

// Ruta para obtener el historial de pedidos, protegida por autenticación
router.get("/history", authMiddleware, getOrderHistory);

module.exports = router;
