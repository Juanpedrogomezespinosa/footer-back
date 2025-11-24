const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/env");

const {
  sendWelcomeEmail,
  sendPasswordResetEmail,
} = require("../services/emailService");
const { frontendUrl } = require("../config/env");

/**
 * Función para generar un token JWT de autenticación (larga duración)
 */
exports.generateToken = (user) => {
  const payload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    lastName: user.lastName,
    phone: user.phone,
  };

  return jwt.sign(
    payload,
    config.JWT_SECRET || config.jwtSecret || "defaultSecret",
    { expiresIn: "24h" }
  );
};

/**
 * Genera un token JWT de CORTA duración (15 min)
 * Específico para restablecer la contraseña
 */
const generatePasswordResetToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      scope: "password_reset",
    },
    config.JWT_SECRET || config.jwtSecret || "defaultSecret",
    { expiresIn: "15m" }
  );
};

// Registro de usuario nuevo
exports.register = async (req, res, next) => {
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
      googleId: null,
    });

    const token = exports.generateToken(user);

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
    next(error);
  }
};

// Login de usuario existente
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    if (!user.password) {
      return res.status(401).json({
        message:
          "Parece que te registraste con Google. Por favor, usa ese método.",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = exports.generateToken(user);

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

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "El correo es obligatorio." });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(200).json({
        message:
          "Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña.",
      });
    }

    const resetToken = generatePasswordResetToken(user);
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, user.username, resetLink);
    } catch (emailError) {
      console.error(
        "Error crítico al enviar email de reseteo:",
        emailError.message
      );
      return next(
        new Error(
          "No se pudo enviar el correo de restablecimiento. Inténtalo de nuevo."
        )
      );
    }

    return res.status(200).json({
      message:
        "Si existe una cuenta con este correo, se ha enviado un enlace para restablecer la contraseña.",
    });
  } catch (error) {
    console.error("Error en forgotPassword:", error);
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Faltan el token y la nueva contraseña." });
    }

    let decodedPayload;
    try {
      decodedPayload = jwt.verify(
        token,
        config.JWT_SECRET || config.jwtSecret || "defaultSecret"
      );
    } catch (error) {
      return res
        .status(400)
        .json({ message: "El enlace es inválido o ha caducado." });
    }

    if (decodedPayload.scope !== "password_reset") {
      return res.status(400).json({ message: "Token inválido." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

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
