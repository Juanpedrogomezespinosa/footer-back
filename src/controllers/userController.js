const { User, Order, OrderItem, Product } = require("../models");
const sendEmail = require("../utils/email");

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ["password"] } });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await User.destroy({ where: { id } });
    if (!deleted)
      return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({ message: "Usuario eliminado" });
  } catch (error) {
    next(error);
  }
};

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

    res.json({ orders });
  } catch (error) {
    next(error);
  }
};

// Nuevo método para registrar usuario con email de bienvenida
exports.registerUser = async (req, res, next) => {
  try {
    const { email, name, password } = req.body;

    // Validar si usuario existe (opcional)
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    // Crear usuario
    const user = await User.create({ email, name, password });

    // Enviar email de bienvenida
    const html = `
      <h1>Bienvenido ${name} a nuestra tienda</h1>
      <p>Gracias por registrarte. Esperamos que disfrutes comprando con nosotros.</p>
    `;
    await sendEmail(email, "Bienvenido a nuestra tienda", html);

    res.status(201).json({ message: "Usuario creado y email enviado", user });
  } catch (error) {
    next(error);
  }
};
