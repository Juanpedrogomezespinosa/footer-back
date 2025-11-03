const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
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
 * Obtener datos del perfil del usuario autenticado (incluye avatarUrl).
 */
exports.getProfileData = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Respuesta exitosa 200 JSON
    return res.json({
      id: user.id,
      username: user.username,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl, // 🆕 Devuelve el avatar
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Registro de usuario (sin cambios en la lógica de avatar).
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
 * Actualización de datos textuales del perfil (sin incluir subida de avatar).
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username, email, password, lastName, phone } = req.body;

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
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl, // 🆕 Aseguramos devolver la URL del avatar
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 🆕 NUEVA FUNCIÓN: Actualizar la imagen de perfil (avatar).
 */
exports.updateAvatar = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // Multer guarda el archivo en req.file
    if (!req.file) {
      // Manejar error si el archivo no es válido (del fileFilter de Multer)
      if (req.fileValidationError) {
        return res.status(400).json({ message: req.fileValidationError });
      }
      return res
        .status(400)
        .json({ message: "No se proporcionó ningún archivo de imagen." });
    }

    // 1. Construir la ruta pública (la que usará el frontend)
    // (Ej: /uploads/nombre-archivo.png)
    const newAvatarPath = `/uploads/${req.file.filename}`;

    // 2. Si el usuario ya tenía un avatar, borramos el archivo antiguo
    if (user.avatarUrl) {
      try {
        // Construimos la ruta completa al archivo antiguo
        const oldPath = path.join(__dirname, "..", user.avatarUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch (err) {
        console.warn("No se pudo eliminar el avatar anterior:", err.message);
      }
    }

    // 3. Actualizar la base de datos con la nueva ruta
    user.avatarUrl = newAvatarPath;
    await user.save();

    return res.json({
      message: "Imagen de perfil actualizada correctamente.",
      avatarUrl: newAvatarPath,
    });
  } catch (error) {
    console.error("Error al actualizar la imagen de perfil:", error);
    next(error);
  }
};
