// --- Imports actualizados ---
const {
  sequelize, // Importar sequelize para transacciones
  User,
  Order,
  OrderItem,
  Product,
  CartItem,
  Address,
  ProductImage, // <-- ¡1. IMPORTAR PRODUCTIMAGE!
} = require("../models");
const { sendOrderConfirmationEmail } = require("../services/emailService");
const { createCheckoutSession } = require("../services/paymentService");
const { frontendUrl } = require("../config/env");

/**
 * Crear una orden en la base de datos y generar una sesión de pago en Stripe.
 * (Sin cambios en esta función)
 */
const createOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { items, addressId } = req.body;

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

    const address = await Address.findOne({
      where: { id: addressId, userId: userId },
      transaction: t,
    });

    if (!address) {
      await t.rollback();
      return res.status(403).json({
        message: "La dirección seleccionada no pertenece a este usuario.",
      });
    }

    const order = await Order.create(
      {
        userId,
        addressId,
        status: "pendiente",
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

    order.total = total;
    await order.save({ transaction: t });

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

    await CartItem.destroy({ where: { userId: userId }, transaction: t });

    const successUrl = `${frontendUrl}/confirmation/${order.id}`;
    const cancelUrl = `${frontendUrl}/cart`;

    const session = await createCheckoutSession(
      lineItems,
      successUrl,
      cancelUrl
    );

    await t.commit();

    res.status(201).json({
      message: "Pedido creado con éxito",
      orderId: order.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error en createOrder:", error);
    next(error);
  }
};

/**
 * Obtener historial de órdenes del usuario autenticado.
 * --- ¡MODIFICADO! ---
 */
const getOrderHistory = async (req, res, next) => {
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
              // --- 2. INCLUIR IMÁGENES DEL PRODUCTO ---
              include: [{ model: ProductImage, as: "images" }],
            },
          ],
        },
        { model: Address },
      ],
      order: [["createdAt", "DESC"]],
    });

    // --- 3. MAPEAR LA RESPUESTA PARA AÑADIR LA IMAGEN PRINCIPAL ---
    // (Esto es necesario porque el frontend espera 'Product.image' y no 'Product.images')
    const plainOrders = orders.map((order) => {
      const orderJson = order.toJSON();
      orderJson.OrderItems = orderJson.OrderItems.map((item) => {
        if (
          item.Product &&
          item.Product.images &&
          item.Product.images.length > 0
        ) {
          // Ordenamos por 'displayOrder' y cogemos la primera
          item.Product.images.sort((a, b) => a.displayOrder - b.displayOrder);
          // Creamos el campo 'image' que el frontend espera
          item.Product.image = item.Product.images[0].imageUrl;
        } else {
          item.Product.image = null; // O un placeholder si lo prefieres
        }
        // Opcional: delete item.Product.images; // Limpiamos el array
        return item;
      });
      return orderJson;
    });

    res.json({ orders: plainOrders }); // <-- 4. Devolvemos los pedidos mapeados
  } catch (error) {
    console.error("Error en getOrderHistory:", error);
    next(error);
  }
};

/**
 * Obtiene una orden específica por ID (para la página de confirmación).
 * --- ¡MODIFICADO! ---
 */
const getOrderById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const order = await Order.findOne({
      where: { id: orderId, userId: userId },
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              // --- 5. INCLUIR IMÁGENES DEL PRODUCTO ---
              include: [{ model: ProductImage, as: "images" }],
            },
          ],
        },
        User,
        { model: Address },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    // --- 6. MAPEAR LA RESPUESTA (igual que en getOrderHistory) ---
    const orderJson = order.toJSON();
    orderJson.OrderItems = orderJson.OrderItems.map((item) => {
      if (
        item.Product &&
        item.Product.images &&
        item.Product.images.length > 0
      ) {
        item.Product.images.sort((a, b) => a.displayOrder - b.displayOrder);
        item.Product.image = item.Product.images[0].imageUrl;
      } else {
        item.Product.image = null;
      }
      return item;
    });

    // --- Lógica de Email (ahora usa orderJson) ---
    if (order.status === "pendiente") {
      // Usamos el objeto Sequelize original para 'status'
      order.status = "pagado"; // Actualizamos el objeto Sequelize
      await order.save(); // Guardamos en la BBDD

      try {
        // Usamos orderJson para los detalles del email
        const itemsForEmail = orderJson.OrderItems.map((item) => ({
          productName: item.Product.name,
          quantity: item.quantity,
          price: item.price,
        }));

        console.log("📧 (Confirmación) Enviando email a", orderJson.User.email);
        await sendOrderConfirmationEmail(
          orderJson.User.email,
          orderJson.User.username,
          itemsForEmail,
          orderJson.total
        );
        console.log("✅ (Confirmación) Email enviado correctamente");
      } catch (emailError) {
        console.error("❌ Error enviando email de confirmación:", emailError);
      }
    }

    res.json(orderJson); // <-- 7. Devolvemos el pedido mapeado
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
