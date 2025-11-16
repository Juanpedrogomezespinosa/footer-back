// src/routes/authRoutes.js

const express = require("express");
const router = express.Router();

// --- 👇 CAMBIO: Importar las nuevas funciones ---
const {
  register,
  login,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);

// --- 👇 NUEVAS RUTAS AÑADIDAS ---
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
// --- FIN DE NUEVAS RUTAS ---

module.exports = router;
