const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/env");
const { sendWelcomeEmail } = require("../services/emailService");

// Función para generar un token JWT con expiración de 4 horas
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    config.JWT_SECRET || config.jwtSecret || "defaultSecret",
    { expiresIn: "4h" }
  );
};

// Registro de usuario nuevo
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validar duplicado por email
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
    });

    const token = generateToken(user);

    await sendWelcomeEmail(email, username);

    res.status(201).json({
      message: "Usuario registrado correctamente",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    // Capturar errores de clave duplicada si pasan por Sequelize
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "Este correo ya está registrado.",
      });
    }

    console.error("Error en registro:", error);
    res.status(500).json({ message: "Error al registrar usuario." });
  }
};

// Login de usuario existente
exports.login = async (req, res) => {
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

    res.json({
      message: "Inicio de sesión exitoso",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
};
