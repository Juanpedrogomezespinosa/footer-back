const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  deleteUser,
  getOrderHistory,
  updateProfile,
  getProfileData, // 👈 Función para obtener el perfil
} = require("../controllers/userController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// ⚠️ IMPORTANTE: Las rutas específicas DEBEN ir ANTES de las rutas con parámetros dinámicos

// 🆕 OBTENER perfil del usuario autenticado (DEBE ir ANTES de /:id)
router.get("/profile", authMiddleware, getProfileData);

// Actualización del perfil del usuario autenticado
router.put("/profile", authMiddleware, updateProfile);

// Historial de pedidos del usuario autenticado
router.get("/me/orders", authMiddleware, getOrderHistory);

// Rutas solo para administradores
router.get("/", authMiddleware, roleMiddleware("admin"), getAllUsers);

// ⚠️ Esta ruta con parámetro dinámico DEBE ir AL FINAL
router.get("/:id", authMiddleware, roleMiddleware("admin"), getUserById);

// Eliminación de usuario: administradores pueden eliminar a cualquiera, usuarios a sí mismos
router.delete("/:id", authMiddleware, deleteUser);

module.exports = router;
