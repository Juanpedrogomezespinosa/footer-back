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

// Rutas solo para administradores
router.get("/", authMiddleware, roleMiddleware("admin"), getAllUsers);
router.get("/:id", authMiddleware, roleMiddleware("admin"), getUserById);

// Eliminación de usuario: administradores pueden eliminar a cualquiera, usuarios a sí mismos
router.delete("/:id", authMiddleware, deleteUser);

// Historial de pedidos del usuario autenticado
router.get("/me/orders", authMiddleware, getOrderHistory);

// Actualización del perfil del usuario autenticado
router.put("/profile", authMiddleware, updateProfile);

module.exports = router;
