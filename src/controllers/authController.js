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
    config.JWT_SECRET || config.jwtSecret || "defaultSecret", // fallback por seguridad
    { expiresIn: "4h" }
  );
};

// Registro de usuario nuevo
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario en la base de datos
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "client",
    });

    // Generar token JWT para el nuevo usuario
    const token = generateToken(user);

    // Enviar email de bienvenida (función externa)
    await sendWelcomeEmail(email, username);

    // Responder con datos del usuario y token
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
    next(error);
  }
};

// Login de usuario existente
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por email
    const user = await User.findOne({ where: { email } });

    // Si no existe usuario, error de credenciales
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Comparar contraseña recibida con el hash almacenado
    const isValidPassword = await bcrypt.compare(password, user.password);

    // Si la contraseña no es válida, error de credenciales
    if (!isValidPassword) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Generar token JWT para sesión válida
    const token = generateToken(user);

    // Responder con datos de usuario y token
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
    next(error);
  }
};
