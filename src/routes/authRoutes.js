// src/routes/authRoutes.js

const express = require("express");
const router = express.Router();
const passport = require("passport"); // <-- Importar Passport

const {
  register,
  login,
  forgotPassword,
  resetPassword,
  generateToken, // <-- Importar el generador de token
} = require("../controllers/authController");

// --- Rutas de Email/Password ---
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// --- 👇 NUEVAS RUTAS DE GOOGLE AÑADIDAS ---

// 1. Iniciar el login con Google
// El frontend (botón) enlazará a esta ruta
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"], // Pedimos el perfil y el email
  })
);

// 2. Callback de Google (a donde Google redirige)
router.get(
  "/google/callback",
  // Usamos 'session: false' porque usamos JWT, no sesiones de servidor
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google`, // Redirige a login si falla
    session: false,
  }),
  // Si la autenticación tiene éxito, esta función se ejecuta
  (req, res) => {
    // passport.authenticate añade el 'user' (de la BBDD) a 'req.user'
    const user = req.user;

    // Generamos NUESTRO propio token JWT para este usuario
    // (Ahora el token contiene el objeto de usuario completo)
    const token = generateToken(user);

    // Redirigimos al frontend a una ruta especial de "callback"
    // Le pasamos el token en la URL para que Angular lo lea
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);
// --- FIN DE NUEVAS RUTAS ---

module.exports = router;
