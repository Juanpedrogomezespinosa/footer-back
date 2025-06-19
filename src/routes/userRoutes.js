const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  deleteUser,
  getOrderHistory,
} = require("../controllers/userController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// 🛡️ Rutas solo para admin
router.get("/", authMiddleware, roleMiddleware("admin"), getAllUsers);
router.get("/:id", authMiddleware, roleMiddleware("admin"), getUserById);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteUser);

// 📦 Ruta para historial de compras del usuario autenticado
router.get("/me/orders", authMiddleware, getOrderHistory);

module.exports = router;
