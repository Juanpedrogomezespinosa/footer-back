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

const {
  sendOrderConfirmationEmail,
  sendNewOrderNotification,
} = require("../services/emailService");
const { createCheckoutSession } = require("../services/paymentService");
const { frontendUrl } = require("../config/env");

/**
 * Crea una orden leyendo el carrito desde la BBDD, verifica stock,
 * calcula gastos de envío, resta el stock, y genera la sesión de pago.
 */
const createOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const { addressId, shippingMethod = "standard" } = req.body;

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

    let productsTotal = 0;
    const lineItems = [];
    const itemsForEmail = [];

    for (const item of cartItems) {
      const variant = item.ProductVariantStock;
      const product = variant.Product;

      // --- VALIDACIÓN DE STOCK ---
      if (item.quantity > variant.stock) {
        await t.rollback();
        return res.status(400).json({
          message: `Stock insuficiente para ${product.name} (Talla: ${variant.size}, Color: ${variant.color}). Solo quedan ${variant.stock}.`,
        });
      }

      // --- CORRECCIÓN DE PRECIO (BUG FIX) ---
      // Priorizamos el precio de la variante (11€). Si no existe, usamos el del producto (20€).
      // Convertimos a Number para asegurar cálculos matemáticos correctos.
      const unitPrice = variant.price
        ? Number(variant.price)
        : Number(product.price);

      // Calculamos el total usando el precio REAL
      productsTotal += item.quantity * unitPrice;

      // Preparamos la línea para Stripe con el precio correcto
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: `${product.name} (${variant.color} / ${variant.size})`,
          },
          // Stripe espera centavos (por eso * 100)
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity: item.quantity,
      });

      itemsForEmail.push({
        name: product.name,
        size: variant.size,
        color: variant.color,
        quantity: item.quantity,
        price: unitPrice, // Usamos el precio corregido para el email
      });
    }

    // --- LÓGICA DE ENVÍO ---
    let shippingCost = 0;
    let shippingName = "Envío Estándar";

    if (shippingMethod === "express") {
      shippingCost = 7.95;
      shippingName = "Envío Express (24h)";
    } else {
      // Estándar: Gratis si productos >= 50€
      if (productsTotal >= 50) {
        shippingCost = 0;
        shippingName = "Envío Gratuito";
      } else {
        shippingCost = 4.95;
        shippingName = "Envío Estándar";
      }
    }

    // Agregamos el envío a Stripe
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: shippingName,
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const orderTotal = productsTotal + shippingCost;

    // Creamos la Orden en BBDD
    const order = await Order.create(
      {
        userId,
        addressId,
        status: "pendiente",
        total: orderTotal,
      },
      { transaction: t }
    );

    // Guardamos los items de la orden con el PRECIO CONGELADO correcto
    for (const item of cartItems) {
      const variant = item.ProductVariantStock;

      // Recalculamos el precio aquí también para asegurarnos (o podríamos guardarlo en el loop anterior)
      const unitPrice = variant.price
        ? Number(variant.price)
        : Number(variant.Product.price);

      await OrderItem.create(
        {
          orderId: order.id,
          productVariantStockId: item.productVariantStockId,
          quantity: item.quantity,
          price: unitPrice, // <--- IMPORTANTE: Guardamos 11€, no 20€
        },
        { transaction: t }
      );

      // Restamos stock
      await ProductVariantStock.update(
        { stock: variant.stock - item.quantity },
        { where: { id: variant.id }, transaction: t }
      );
    }

    // Limpiamos el carrito
    await CartItem.destroy({ where: { userId: userId }, transaction: t });

    const successUrl = `${frontendUrl}/confirmation/${order.id}`;
    const cancelUrl = `${frontendUrl}/cart`;

    // Llamamos al servicio de pago (que ya funciona bien, solo necesitaba los datos correctos)
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

        // Lógica de imagen segura (sin depender de la columna color que no tienes)
        if (product.images && product.images.length > 0) {
          // Ordenamos por displayOrder si existe
          product.images.sort(
            (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
          );
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
 * Obtiene una orden específica por ID.
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
    let productsTotal = 0;

    orderJson.OrderItems = orderJson.OrderItems.map((item) => {
      const variant = item.ProductVariantStock;
      const product = variant.Product;
      const productName = `${product.name} (${variant.color} / ${variant.size})`;

      // Aquí 'item.price' viene de la tabla OrderItems, que ya guardamos correctamente
      // así que esto debería estar bien si el pedido se creó después del fix.
      productsTotal += Number(item.price) * item.quantity;

      itemsForEmail.push({
        name: product.name,
        size: variant.size,
        color: variant.color,
        quantity: item.quantity,
        price: item.price,
      });

      product.name = productName;

      // Lógica de imagen segura
      if (product.images && product.images.length > 0) {
        product.images.sort(
          (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
        );
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

      // Cálculos para el email
      const shippingCost = Number(orderJson.total) - productsTotal;
      const subtotal = productsTotal / 1.21;
      const tax = productsTotal - subtotal;

      const summaryData = {
        total: Number(orderJson.total).toFixed(2),
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
      };

      // Emails
      try {
        console.log("📧 (Confirmación) Enviando email a", orderJson.User.email);
        await sendOrderConfirmationEmail(
          orderJson.User.email,
          orderJson.User.username,
          itemsForEmail,
          summaryData
        );
        console.log("✅ (Confirmación) Email enviado correctamente");
      } catch (emailError) {
        console.error("❌ Error enviando email de confirmación:", emailError);
      }

      try {
        console.log("📧 (Admin) Enviando notificación de nuevo pedido...");
        await sendNewOrderNotification(
          orderJson.User,
          orderJson,
          itemsForEmail,
          summaryData
        );
        console.log("✅ (Admin) Email de notificación enviado correctamente");
      } catch (adminEmailError) {
        console.error("❌ Error enviando email al admin:", adminEmailError);
      }
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
