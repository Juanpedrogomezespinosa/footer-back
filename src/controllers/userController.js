const bcrypt = require("bcrypt");
const { User, Order, OrderItem, Product } = require("../models");
const sendEmail = require("../utils/email");

// Obtener todos los usuarios (solo administradores)
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ["password"] } });
    return res.json(users);
  } catch (error) {
    next(error);
  }
};

// Obtener un usuario por ID (solo administradores)
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    return res.json(user);
  } catch (error) {
    next(error);
  }
};

// Eliminar un usuario (admin o el propio usuario)
exports.deleteUser = async (req, res, next) => {
  try {
    const userIdToDelete = parseInt(req.params.id, 10);
    const requester = req.user;

    if (requester.role !== "admin" && requester.userId !== userIdToDelete) {
      return res.status(403).json({
        message: "No tiene permisos para eliminar este usuario",
      });
    }

    const user = await User.findByPk(userIdToDelete);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    await user.destroy();
    return res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    next(error);
  }
};

// Obtener historial de pedidos del usuario autenticado
exports.getOrderHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const orders = await Order.findAll({
      where: { userId },
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ["id", "name", "price", "size", "color", "brand"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json({ orders });
  } catch (error) {
    next(error);
  }
};

// 💡 FUNCIÓN CLAVE: Obtener datos del perfil autenticado
exports.getProfileData = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      // 404 JSON (si el usuario del token fue eliminado)
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Respuesta exitosa 200 JSON
    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

// Registro de usuario desde panel (si se mantiene esta ruta aparte)
exports.registerUser = async (req, res, next) => {
  try {
    const { email, name, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "El correo ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      username: name,
      password: hashedPassword,
    });

    const html = `
      <h1>Bienvenido ${name} a nuestra tienda</h1>
      <p>Gracias por registrarte. Esperamos que disfrutes comprando con nosotros.</p>
    `;
    await sendEmail(email, "Bienvenido a nuestra tienda", html);

    return res
      .status(201)
      .json({ message: "Usuario creado y correo enviado", user });
  } catch (error) {
    next(error);
  }
};

// Actualización del perfil del usuario autenticado
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username, email, password } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser && existingUser.id !== user.id) {
        return res.status(409).json({ message: "El correo ya está en uso" });
      }
      user.email = email;
    }

    if (username) {
      user.username = username;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();

    return res.json({
      message: "Perfil actualizado correctamente",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};
