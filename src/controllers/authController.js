const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/env");
const { sendWelcomeEmail } = require("../services/emailService");

// Función para generar un token JWT con expiración de 24 horas
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

// Registro de usuario nuevo
exports.register = async (req, res) => {
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
      // 💡 Aseguramos que los campos opcionales existan (aunque sean null)
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

    // Responder con usuario creado y token
    return res.status(201).json({
      // 💡 Usamos return
      message: "Usuario registrado correctamente",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastName: user.lastName, // 🆕 Añadido
        phone: user.phone, // 🆕 Añadido
        avatarUrl: user.avatarUrl, // 🆕 Añadido
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

    return res.status(500).json({ message: "Error al registrar usuario." }); // 💡 Usamos return
  }
};

// Login de usuario existente
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 💡 Buscamos el usuario en la DB
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = generateToken(user);

    // 💡 CAMBIO CLAVE: Devolver el objeto de usuario COMPLETO
    return res.json({
      // 💡 Usamos return
      message: "Inicio de sesión exitoso",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastName: user.lastName, // 🆕 Añadido
        phone: user.phone, // 🆕 Añadido
        avatarUrl: user.avatarUrl, // 🆕 Añadido (Esta era la causa del bug)
      },
      token,
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ message: "Error al iniciar sesión" }); // 💡 Usamos return
  }
};
