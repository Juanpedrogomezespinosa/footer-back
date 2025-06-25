const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  deleteUser,
  getOrderHistory,
  updateProfile,
} = require("../controllers/userController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// 🛡️ Rutas solo para administrador
router.get("/", authMiddleware, roleMiddleware("admin"), getAllUsers);
router.get("/:id", authMiddleware, roleMiddleware("admin"), getUserById);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteUser);

// 📦 Ruta para historial de compras del usuario autenticado
router.get("/me/orders", authMiddleware, getOrderHistory);

// ✏️ Ruta para editar perfil del usuario autenticado
router.put("/profile", authMiddleware, updateProfile);

module.exports = router;
