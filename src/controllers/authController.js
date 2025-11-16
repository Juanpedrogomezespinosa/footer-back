// src/controllers/authController.js

const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/env");

// --- 👇 CAMBIO: Importar la nueva función de email y la URL del frontend ---
const {
  sendWelcomeEmail,
  sendPasswordResetEmail, // <-- Importamos la nueva función
} = require("../services/emailService");
const { frontendUrl } = require("../config/env"); // <-- Importamos la URL del frontend
// --- FIN DEL CAMBIO ---

// Función para generar un token JWT de autenticación (larga duración)
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    config.JWT_SECRET || config.jwtSecret || "defaultSecret",
    { expiresIn: "24h" }
  );
};

// --- 👇 NUEVA FUNCIÓN AÑADIDA ---
/**
 * Genera un token JWT de CORTA duración (15 min)
 * Específico para restablecer la contraseña
 */
const generatePasswordResetToken = (user) => {
  // Usamos el MISMO secreto, pero un payload y expiración diferentes
  return jwt.sign(
    {
      userId: user.id,
      // Añadimos un 'scope' para asegurar que este token solo sirva para esto
      scope: "password_reset",
    },
    config.JWT_SECRET || config.jwtSecret || "defaultSecret",
    { expiresIn: "15m" } // <-- Caduca en 15 minutos
  );
};
// --- FIN DE NUEVA FUNCIÓN ---

// Registro de usuario nuevo
exports.register = async (req, res, next) => {
  // ... (Tu código de registro no cambia)
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Faltan campos obligatorios." });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        message: "Este correo ya está registrado. Por favor, usa otro.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "client",
      lastName: null,
      phone: null,
      avatarUrl: null,
    });

    const token = generateToken(user);

    try {
      await sendWelcomeEmail(email, username);
    } catch (emailError) {
      console.warn("Error al enviar correo de bienvenida:", emailError.message);
    }

    return res.status(201).json({
      message: "Usuario registrado correctamente",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastName: user.lastName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
      token,
    });
  } catch (error) {
    console.error("Error en registro:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "Este correo ya está registrado.",
      });
    }
    // Pasamos el error al manejador global
    next(error);
  }
};

// Login de usuario existente
exports.login = async (req, res, next) => {
  // ... (Tu código de login no cambia)
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = generateToken(user);

    return res.json({
      message: "Inicio de sesión exitoso",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastName: user.lastName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
      token,
    });
  } catch (error) {
    console.error("Error en login:", error);
    next(error);
  }
};

// --- 👇 NUEVA FUNCIÓN AÑADIDA ---
/**
 * Paso 1: El usuario olvida la contraseña y pide un enlace.
 * Recibe un email y genera un token de 15 min.
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "El correo es obligatorio." });
    }

    const user = await User.findOne({ where: { email } });

    // ¡Buena práctica de seguridad!
    // Nunca confirmes si el email existe o no.
    // Simplemente responde OK para prevenir enumeración de usuarios.
    if (!user) {
      return res.status(200).json({
        message:
          "Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña.",
      });
    }

    // Generar el token de reseteo (15 min)
    const resetToken = generatePasswordResetToken(user);

    // Generar el enlace que irá en el email
    // (Asegúrate de tener FRONTEND_URL en tu .env)
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    // Enviar el email
    try {
      await sendPasswordResetEmail(user.email, user.username, resetLink);
    } catch (emailError) {
      console.error(
        "Error crítico al enviar email de reseteo:",
        emailError.message
      );
      // Si el email falla, le devolvemos un error al usuario.
      return next(
        new Error(
          "No se pudo enviar el correo de restablecimiento. Inténtalo de nuevo."
        )
      );
    }

    // Responder al usuario
    return res.status(200).json({
      message:
        "Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña.",
    });
  } catch (error) {
    console.error("Error en forgotPassword:", error);
    next(error);
  }
};

// --- 👇 NUEVA FUNCIÓN AÑADIDA ---
/**
 * Paso 2: El usuario hace clic en el enlace del email,
 * introduce la nueva contraseña y la envía junto con el token.
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Faltan el token y la nueva contraseña." });
    }

    // 1. Verificar el token
    let decodedPayload;
    try {
      decodedPayload = jwt.verify(
        token,
        config.JWT_SECRET || config.jwtSecret || "defaultSecret"
      );
    } catch (error) {
      // Esto captura tokens expirados o malformados
      return res
        .status(400)
        .json({ message: "El enlace es inválido o ha caducado." });
    }

    // 2. (Opcional pero recomendado) Verificar el 'scope'
    if (decodedPayload.scope !== "password_reset") {
      return res.status(400).json({ message: "Token inválido." });
    }

    // 3. Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Actualizar la contraseña en la BBDD
    const [rowsAffected] = await User.update(
      { password: hashedPassword },
      { where: { id: decodedPayload.userId } }
    );

    if (rowsAffected === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    return res
      .status(200)
      .json({ message: "Contraseña actualizada con éxito." });
  } catch (error) {
    console.error("Error en resetPassword:", error);
    next(error);
  }
};
