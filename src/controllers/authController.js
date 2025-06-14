const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/env");

// Genera token con expiración de 4 horas
const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id, // Esto genera el payload con userId
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: "4h" }
  );
};

exports.register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "client",
    });

    const token = generateToken(user);

    res.status(201).json({
      message: "Usuario registrado",
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

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user)
      return res.status(401).json({ message: "Credenciales inválidas" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(401).json({ message: "Credenciales inválidas" });

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
    next(error);
  }
};
