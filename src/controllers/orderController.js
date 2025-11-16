// src/controllers/orderController.js

const {
  sequelize,
  User,
  Order,
  OrderItem,
  Product,
  CartItem,
  Address,
  ProductImage,
  ProductVariantStock,
} = require("../models");

// --- 👇 CAMBIO: Importar la nueva función ---
const {
  sendOrderConfirmationEmail,
  sendNewOrderNotification, // <-- Importamos la nueva función
} = require("../services/emailService");
const { createCheckoutSession } = require("../services/paymentService");
const { frontendUrl } = require("../config/env");

/**
 * Crea una orden leyendo el carrito desde la BBDD, verifica stock,
 * resta el stock, y genera la sesión de pago.
 */
const createOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { addressId } = req.body;

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

    const cartItems = await CartItem.findAll({
      where: { userId },
      include: [
        {
          model: ProductVariantStock,
          include: [
            {
              model: Product,
              as: "Product",
            },
          ],
        },
      ],
      transaction: t,
    });

    if (!cartItems || cartItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "Tu carrito está vacío." });
    }

    let total = 0;
    const lineItems = [];
    const itemsForEmail = []; // Lo usaremos para ambos emails

    for (const item of cartItems) {
      const variant = item.ProductVariantStock;
      const product = variant.Product;

      if (item.quantity > variant.stock) {
        await t.rollback();
        return res.status(400).json({
          message: `Stock insuficiente para ${product.name} (Talla: ${variant.size}, Color: ${variant.color}). Solo quedan ${variant.stock}.`,
        });
      }

      total += item.quantity * product.price;

      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: `${product.name} (${variant.color} / ${variant.size})`,
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: item.quantity,
      });

      // ¡Corregido! Pasamos los datos que espera la plantilla
      itemsForEmail.push({
        name: product.name,
        size: variant.size,
        color: variant.color,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const order = await Order.create(
      {
        userId,
        addressId,
        status: "pendiente",
        total: total,
      },
      { transaction: t }
    );

    for (const item of cartItems) {
      const variant = item.ProductVariantStock;
      const product = variant.Product;

      await OrderItem.create(
        {
          orderId: order.id,
          productVariantStockId: item.productVariantStockId,
          quantity: item.quantity,
          price: product.price,
        },
        { transaction: t }
      );

      await ProductVariantStock.update(
        { stock: variant.stock - item.quantity },
        { where: { id: variant.id }, transaction: t }
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
              model: ProductVariantStock,
              include: [
                {
                  model: Product,
                  as: "Product",
                  include: [{ model: ProductImage, as: "images" }],
                },
              ],
            },
          ],
        },
        { model: Address },
      ],
      order: [["createdAt", "DESC"]],
    });

    const plainOrders = orders.map((order) => {
      const orderJson = order.toJSON();
      orderJson.OrderItems = orderJson.OrderItems.map((item) => {
        const variant = item.ProductVariantStock;
        const product = variant.Product;
        product.name = `${product.name} (${variant.color} / ${variant.size})`;
        if (product.images && product.images.length > 0) {
          product.images.sort((a, b) => a.displayOrder - b.displayOrder);
          product.image = product.images[0].imageUrl;
        } else {
          product.image = null;
        }
        item.Product = product;
        delete item.ProductVariantStock;
        delete item.Product.images;
        return item;
      });
      return orderJson;
    });

    res.json({ orders: plainOrders });
  } catch (error) {
    console.error("Error en getOrderHistory:", error);
    next(error);
  }
};

/**
 * Obtiene una orden específica por ID (para la página de confirmación).
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
              model: ProductVariantStock,
              include: [
                {
                  model: Product,
                  as: "Product",
                  include: [{ model: ProductImage, as: "images" }],
                },
              ],
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

    const orderJson = order.toJSON();
    const itemsForEmail = [];

    orderJson.OrderItems = orderJson.OrderItems.map((item) => {
      const variant = item.ProductVariantStock;
      const product = variant.Product;
      const productName = `${product.name} (${variant.color} / ${variant.size})`;

      // ¡Corregido! Pasamos los datos que espera la plantilla
      itemsForEmail.push({
        name: product.name, // Nombre base
        size: variant.size,
        color: variant.color,
        quantity: item.quantity,
        price: item.price,
      });

      product.name = productName;
      if (product.images && product.images.length > 0) {
        product.images.sort((a, b) => a.displayOrder - b.displayOrder);
        product.image = product.images[0].imageUrl;
      } else {
        product.image = null;
      }

      item.Product = product;
      delete item.ProductVariantStock;
      delete item.Product.images;

      return item;
    });

    if (order.status === "pendiente") {
      order.status = "pagado";
      await order.save();

      // --- Email de Confirmación al Cliente ---
      try {
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

      // --- 👇 CAMBIO: Notificación al ADMIN ---
      try {
        console.log("📧 (Admin) Enviando notificación de nuevo pedido...");
        await sendNewOrderNotification(
          orderJson.User, // Objeto User
          orderJson, // Objeto Order
          itemsForEmail // Array de Items
        );
        console.log("✅ (Admin) Email de notificación enviado correctamente");
      } catch (adminEmailError) {
        // No detenemos la respuesta al usuario por esto, solo lo registramos
        console.error(
          "❌ Error enviando email de notificación al admin:",
          adminEmailError
        );
      }
      // --- FIN DEL CAMBIO ---
    }

    res.json(orderJson);
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
