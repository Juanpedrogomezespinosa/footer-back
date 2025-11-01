// --- 👇 CAMBIO: Importamos CartItem ---
const { User, Order, OrderItem, Product, CartItem } = require("../models");
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
          currency: "eur",
          product_data: {
            name: item.productName,
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

    // --- 👇 CAMBIO: Vaciamos el carrito DESPUÉS de crear la orden ---
    await CartItem.destroy({ where: { userId: userId } });
    // --- FIN DEL CAMBIO ---

    // Obtener datos del usuario para enviar email
    const user = await User.findByPk(userId);
    // --- FIN DEL CAMBIO ---

    // --- 👇 CAMBIO: URLs de Stripe corregidas ---
    // Redirige a tu página de confirmación con el ID de la orden
    const successUrl = `${frontendUrl}/confirmation/${order.id}`;
    // Si cancelan, que vuelvan al carrito
    const cancelUrl = `${frontendUrl}/cart`;
    // --- FIN DEL CAMBIO ---

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
      include: [{ model: OrderItem, include: [Product] }], // <-- Incluimos Product
      order: [["createdAt", "DESC"]],
    });

    res.json({ orders });
  } catch (error) {
    console.error("Error en getOrderHistory:", error);
    next(error);
  }
};

// --- 👇 CAMBIO: NUEVA FUNCIÓN AÑADIDA ---
/**
 * Obtiene una orden específica por ID,
 * (para la página de confirmación)
 */
const getOrderById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const order = await Order.findOne({
      where: {
        id: orderId,
        userId: userId, // El usuario solo puede ver sus propias órdenes
      },
      include: [
        {
          model: OrderItem,
          include: [Product], // Incluimos los detalles del producto
        },
        User, // Incluimos el usuario para coger el email
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    // OPCIONAL: Aquí es un *mejor* sitio para enviar el email,
    // ya que el usuario acaba de llegar desde Stripe (pago exitoso)
    try {
      const itemsForEmail = order.OrderItems.map((item) => ({
        productName: item.Product.name,
        quantity: item.quantity,
        price: item.price,
      }));

      console.log("📧 (Confirmación) Enviando email a", order.User.email);
      await sendOrderConfirmationEmail(
        order.User.email,
        order.User.username,
        itemsForEmail,
        order.total
      );
      console.log("✅ (Confirmación) Email enviado correctamente");
    } catch (emailError) {
      console.error("❌ Error enviando email de confirmación:", emailError);
      // No detenemos la respuesta al usuario si el email falla
    }

    res.json(order);
  } catch (error) {
    console.error("Error en getOrderById:", error);
    next(error);
  }
};
// --- FIN DE LA NUEVA FUNCIÓN ---

module.exports = {
  createOrder,
  getOrderHistory,
  getOrderById, // <-- 3. Exportamos la nueva función
};
