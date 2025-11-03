const express = require("express");
const router = express.Router();

// 🆕 Importar el middleware de Multer que creaste
const upload = require("../middlewares/uploadMiddleware");

const {
  getAllUsers,
  getUserById,
  deleteUser,
  getOrderHistory,
  updateProfile,
  getProfileData,
  updateAvatar, // 🆕 Importar la nueva función del controlador
} = require("../controllers/userController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// --- Rutas Específicas (ANTES de las dinámicas) ---

// OBTENER perfil del usuario autenticado
router.get("/profile", authMiddleware, getProfileData);

// Actualización de datos TEXTUALES del perfil
router.put("/profile", authMiddleware, updateProfile);

// 🆕 RUTA PARA SUBIR/ACTUALIZAR IMAGEN DE PERFIL
// 1. authMiddleware: Verifica el token.
// 2. upload.single('avatar'): Procesa el archivo (debe llamarse 'avatar' en el form-data).
// 3. updateAvatar: Guarda la ruta en la DB.
router.post(
  "/profile/avatar",
  authMiddleware,
  upload.single("avatar"),
  updateAvatar
);

// Historial de pedidos del usuario autenticado
router.get("/me/orders", authMiddleware, getOrderHistory);

// --- Rutas Generales y Dinámicas (AL FINAL) ---

// Rutas solo para administradores
router.get("/", authMiddleware, roleMiddleware("admin"), getAllUsers);

// Ruta con parámetro dinámico
router.get("/:id", authMiddleware, roleMiddleware("admin"), getUserById);

// Eliminación de usuario
router.delete("/:id", authMiddleware, deleteUser);

module.exports = router;
