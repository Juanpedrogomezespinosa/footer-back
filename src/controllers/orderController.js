// --- Imports actualizados ---
const {
  sequelize, // Importar sequelize para transacciones
  User,
  Order,
  OrderItem,
  Product,
  CartItem,
  Address, // Importar el modelo Address
} = require("../models");
const { sendOrderConfirmationEmail } = require("../services/emailService");
const { createCheckoutSession } = require("../services/paymentService");
const { frontendUrl } = require("../config/env");

/**
 * Crear una orden en la base de datos y generar una sesión de pago en Stripe.
 */
const createOrder = async (req, res, next) => {
  // Usamos una transacción para asegurar que todo se cree o nada
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    // --- 1. LEER 'addressId' DEL BODY ---
    const { items, addressId } = req.body;

    // --- 2. VALIDACIONES ---
    if (!items || !Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({
        message: "No se proporcionaron productos para crear la orden.",
      });
    }

    if (!addressId) {
      await t.rollback();
      return res.status(400).json({
        message: "No se proporcionó una dirección de envío (addressId).",
      });
    }

    // --- 3. VALIDACIÓN DE SEGURIDAD ---
    // (Verificar que la dirección pertenece al usuario)
    const address = await Address.findOne({
      where: { id: addressId, userId: userId },
      transaction: t, // Aunque es una lectura, la incluimos en la transacción
    });

    if (!address) {
      await t.rollback();
      return res.status(403).json({
        message: "La dirección seleccionada no pertenece a este usuario.",
      });
    }

    // --- 4. CREAR LA ORDEN (CON addressId) ---
    const order = await Order.create(
      {
        userId,
        addressId, // <-- ¡Guardamos la dirección!
        status: "pendiente", // Sigue pendiente hasta que Stripe confirme
      },
      { transaction: t }
    );

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
          product_data: { name: item.productName },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      };
    });

    // --- 5. ACTUALIZAR EL TOTAL EN LA ORDEN ---
    order.total = total;
    await order.save({ transaction: t });

    // Guardar los items asociados a la orden
    for (const item of items) {
      await OrderItem.create(
        {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        },
        { transaction: t }
      );
    }

    // Vaciamos el carrito
    await CartItem.destroy({ where: { userId: userId }, transaction: t });

    const successUrl = `${frontendUrl}/confirmation/${order.id}`;
    const cancelUrl = `${frontendUrl}/cart`;

    const session = await createCheckoutSession(
      lineItems,
      successUrl,
      cancelUrl
    );

    // Si todo va bien, confirmamos la transacción
    await t.commit();

    res.status(201).json({
      message: "Pedido creado con éxito",
      orderId: order.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    // Si algo falla, revertimos todo
    await t.rollback();
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
      include: [
        { model: OrderItem, include: [Product] },
        { model: Address }, // <-- ¡AÑADIDO! Incluir la dirección de envío
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json({ orders });
  } catch (error) {
    console.error("Error en getOrderHistory:", error);
    next(error);
  }
};

/**
 * Obtiene una orden específica por ID (para la página de confirmación).
 * ¡Lógica mejorada!
 */
const getOrderById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const order = await Order.findOne({
      where: { id: orderId, userId: userId },
      include: [
        { model: OrderItem, include: [Product] },
        User,
        { model: Address }, // <-- ¡AÑADIDO! Incluir la dirección de envío
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    // --- ¡LÓGICA MEJORADA PARA EMAIL! ---
    // Solo enviamos el email y actualizamos el estado
    // la PRIMERA VEZ que el usuario visita esta página (cuando está 'pendiente')
    if (order.status === "pendiente") {
      // 1. Actualizar estado a "pagado"
      order.status = "pagado";
      await order.save();

      // 2. Enviar email de confirmación
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
    }
    // --- FIN DE LA LÓGICA MEJORADA ---

    res.json(order);
  } catch (error) {
    console.error("Error en getOrderById:", error);
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrderHistory,
  getOrderById,
};
