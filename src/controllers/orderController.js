const { User, Order, OrderItem } = require("../models");
const { sendOrderConfirmationEmail } = require("../services/emailService");
const { createCheckoutSession } = require("../services/paymentService");
const { frontendUrl } = require("../config/env");

/**
 * Crear una orden en la base de datos y generar una sesión de pago en Stripe.
 */
const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "No se proporcionaron productos para crear la orden.",
      });
    }

    // Crear la orden en la base de datos
    const order = await Order.create({ userId });

    // Preparar items para la base de datos y para la sesión de pago Stripe
    const itemsForEmail = [];
    let total = 0;

    const lineItems = items.map((item) => {
      itemsForEmail.push({
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
      });

      total += item.price * item.quantity;

      return {
        price_data: {
          currency: "eur", // Cambia la moneda si quieres
          product_data: {
            name: item.productName,
            // Puedes agregar descripción o imagen aquí si quieres
          },
          unit_amount: Math.round(item.price * 100), // Precio en céntimos
        },
        quantity: item.quantity,
      };
    });

    // Guardar los items asociados a la orden
    for (const item of items) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      });
    }

    // Obtener datos del usuario para enviar email
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

    // Crear sesión de checkout en Stripe
    const successUrl = `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl}/cancel`;

    const session = await createCheckoutSession(
      lineItems,
      successUrl,
      cancelUrl
    );

    // Responder con el id de la orden y la url para redirigir al checkout de Stripe
    res.status(201).json({
      message: "Pedido creado con éxito",
      orderId: order.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("Error en createOrder:", error);
    next(error);
  }
};

/**
 * Obtener historial de órdenes del usuario autenticado.
 */
const getOrderHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;

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
