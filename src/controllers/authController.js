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

    // Validar que todos los campos necesarios están presentes
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Faltan campos obligatorios." });
    }

    // Comprobar si ya existe usuario con ese email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        message: "Este correo ya está registrado. Por favor, usa otro.",
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "client",
    });

    // Generar token JWT
    const token = generateToken(user);

    // Enviar correo de bienvenida (no interrumpir el registro si falla)
    try {
      await sendWelcomeEmail(email, username);
    } catch (emailError) {
      console.warn("Error al enviar correo de bienvenida:", emailError.message);
    }

    // Responder con usuario creado y token
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
    console.error("Error en registro:", error);

    // Control específico para errores únicos en email (duplicados)
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "Este correo ya está registrado.",
      });
    }

    // Error genérico
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
