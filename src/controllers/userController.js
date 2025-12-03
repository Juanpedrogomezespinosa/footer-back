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

    if (requester.role !== "admin" && requester.id !== userIdToDelete) {
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

    return res.json({
      id: user.id,
      username: user.username,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Registro de usuario
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
    // Nota: Si sendEmail falla, no bloqueamos el registro, pero idealmente se maneja.
    try {
      await sendEmail(email, "Bienvenido a nuestra tienda", html);
    } catch (emailError) {
      console.error("Error enviando email de bienvenida:", emailError);
    }

    return res
      .status(201)
      .json({ message: "Usuario creado y correo enviado", user });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualización de datos textuales del perfil
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { username, email, lastName, phone } = req.body;

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

    if (username) user.username = username;
    user.lastName = lastName || null;
    user.phone = phone || null;

    await user.save();

    return res.json({
      message: "Perfil actualizado correctamente",
      user: {
        id: user.id,
        username: user.username,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 🆕 Actualizar la imagen de perfil (avatar) -> CORREGIDO PARA CLOUDINARY
 */
exports.updateAvatar = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    if (!req.file) {
      if (req.fileValidationError) {
        return res.status(400).json({ message: req.fileValidationError });
      }
      return res
        .status(400)
        .json({ message: "No se proporcionó ningún archivo de imagen." });
    }

    // CORRECCIÓN: Usamos req.file.path que contiene la URL completa de Cloudinary.
    // Cloudinary devuelve la URL pública en 'path' o 'secure_url' al usar multer-storage-cloudinary.
    const newAvatarUrl = req.file.path;

    // Lógica opcional para borrar avatar antiguo:
    // Solo borramos si NO es una URL http (es decir, si era un archivo local antiguo).
    // Si ya era de cloudinary, necesitaríamos la API de cloudinary para borrarlo (opcional por ahora).
    if (user.avatarUrl && !user.avatarUrl.startsWith("http")) {
      try {
        const oldPath = path.join(__dirname, "..", user.avatarUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch (err) {
        console.warn(
          "No se pudo eliminar el avatar local anterior:",
          err.message
        );
      }
    }

    user.avatarUrl = newAvatarUrl;
    await user.save();

    return res.json({
      message: "Imagen de perfil actualizada correctamente.",
      avatarUrl: newAvatarUrl,
    });
  } catch (error) {
    console.error("Error al actualizar la imagen de perfil:", error);
    next(error);
  }
};

/**
 * Actualiza la contraseña
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Todos los campos son obligatorios" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "La nueva contraseña debe tener al menos 6 caracteres",
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(403)
        .json({ message: "La contraseña actual es incorrecta" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    return res
      .status(200)
      .json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error al cambiar la contraseña:", error);
    next(error);
  }
};
