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

/**
 * Obtener datos del perfil del usuario autenticado (incluye nuevos campos: apellidos, teléfono).
 */
exports.getProfileData = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      // 🆕 Ahora recupera todos los campos definidos en el modelo, excluyendo la contraseña
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Respuesta exitosa 200 JSON
    return res.json({
      id: user.id,
      username: user.username,
      lastName: user.lastName, // 🆕 Devuelve el apellido
      email: user.email,
      phone: user.phone, // 🆕 Devuelve el teléfono
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Registro de usuario desde panel (mantiene la lógica existente).
 */
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

/**
 * Actualización del perfil del usuario autenticado (recibe y guarda apellidos y teléfono).
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // 🆕 Capturamos los nuevos campos del cuerpo
    const { username, email, password, lastName, phone } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Actualización de email
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser && existingUser.id !== user.id) {
        return res.status(409).json({ message: "El correo ya está en uso" });
      }
      user.email = email;
    }

    // Actualización de username
    if (username) {
      user.username = username;
    }

    // 🆕 Actualización de nuevos campos: usamos el valor o null si está vacío/no existe.
    user.lastName = lastName || null;
    user.phone = phone || null;

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
        lastName: user.lastName, // Devolvemos el valor actualizado
        email: user.email,
        phone: user.phone, // Devolvemos el valor actualizado
      },
    });
  } catch (error) {
    next(error);
  }
};
