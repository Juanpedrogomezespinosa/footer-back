const bcrypt = require("bcrypt");
const fs = require("fs"); // <-- ¡LÍNEA CORREGIDA!
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

    // Corrección: req.user.id viene de authMiddleware
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

    // Respuesta exitosa 200 JSON
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
 * Actualización de datos textuales del perfil (SIN incluir contraseña).
 * --- MODIFICADO PARA SEGURIDAD ---
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // --- 'password' eliminado de la desestructuración ---
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

    if (username) {
      user.username = username;
    }

    user.lastName = lastName || null;
    user.phone = phone || null;

    // --- LÓGICA DE CONTRASEÑA ELIMINADA DE AQUÍ ---
    // if (password) { ... } ¡ELIMINADO!

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
 * 🆕 NUEVA FUNCIÓN: Actualizar la imagen de perfil (avatar).
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

    const newAvatarPath = `/uploads/${req.file.filename}`;

    if (user.avatarUrl) {
      try {
        const oldPath = path.join(__dirname, "..", user.avatarUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch (err) {
        console.warn("No se pudo eliminar el avatar anterior:", err.message);
      }
    }

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

//
// --- ¡NUEVA FUNCIÓN AÑADIDA! ---
//
/**
 * Actualiza la contraseña del usuario de forma segura.
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // 1. Validar campos
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

    // 2. Obtener usuario
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 3. Verificar contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(403)
        .json({ message: "La contraseña actual es incorrecta" });
    }

    // 4. Hashear y guardar la nueva contraseña
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
