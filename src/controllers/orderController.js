const { User, Order, OrderItem } = require("../models");
const { sendOrderConfirmationEmail } = require("../services/emailService");

const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { items } = req.body;

    // Crear la orden
    const order = await Order.create({ userId });

    // Crear los items asociados a la orden y preparar datos para el email
    const itemsForEmail = [];
    let total = 0;
    for (const item of items) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      });

      itemsForEmail.push({
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
      });

      total += item.price * item.quantity;
    }

    // Obtener datos del usuario
    const user = await User.findByPk(userId);

    try {
      console.log("📧 Enviando email de confirmación a", user.email);
      await sendOrderConfirmationEmail(
        user.email,
        user.username,
        itemsForEmail,
        total
      );
      console.log("✅ Email de confirmación enviado correctamente");
    } catch (emailError) {
      console.error("❌ Error enviando email de confirmación:", emailError);
    }

    res
      .status(201)
      .json({ message: "Pedido creado con éxito", orderId: order.id });
  } catch (error) {
    console.error("Error en createOrder:", error);
    next(error);
  }
};

const getOrderHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Obtener todas las órdenes del usuario con sus items
    const orders = await Order.findAll({
      where: { userId },
      include: [{ model: OrderItem }],
      order: [["createdAt", "DESC"]],
    });

    res.json({ orders });
  } catch (error) {
    console.error("Error en getOrderHistory:", error);
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrderHistory,
};
