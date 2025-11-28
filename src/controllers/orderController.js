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
          include: [{ model: Product, as: "Product" }],
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

    // BUCLE 1
    for (const item of cartItems) {
      const variant = item.ProductVariantStock;
      const product = variant.Product;

      if (item.quantity > variant.stock) {
        await t.rollback();
        return res.status(400).json({
          message: `Stock insuficiente para ${product.name}. Solo quedan ${variant.stock}.`,
        });
      }

      const vPrice = parseFloat(variant.price || 0);
      const pPrice = parseFloat(product.price || 0);
      const unitPrice = vPrice > 0 ? vPrice : pPrice;

      productsTotal += item.quantity * unitPrice;

      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: `${product.name} (${variant.color} / ${variant.size})`,
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity: item.quantity,
      });
    }

    let shippingCost = 0;
    let shippingName = "Envío Estándar";

    if (shippingMethod === "express") {
      shippingCost = 7.95;
      shippingName = "Envío Express (24h)";
    } else {
      if (productsTotal >= 50) {
        shippingCost = 0;
        shippingName = "Envío Gratuito";
      } else {
        shippingCost = 4.95;
        shippingName = "Envío Estándar";
      }
    }

    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: { name: shippingName },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const orderTotal = productsTotal + shippingCost;

    const order = await Order.create(
      {
        userId,
        addressId,
        status: "pendiente",
        total: orderTotal,
      },
      { transaction: t }
    );

    // BUCLE 2
    for (const item of cartItems) {
      const variant = item.ProductVariantStock;
      const vPrice = parseFloat(variant.price || 0);
      const pPrice = parseFloat(variant.Product.price || 0);
      const finalPrice = vPrice > 0 ? vPrice : pPrice;

      await OrderItem.create(
        {
          orderId: order.id,
          productVariantStockId: item.productVariantStockId,
          quantity: item.quantity,
          price: finalPrice,
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

const cancelOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const order = await Order.findOne({
      where: { id: orderId, userId },
      include: [{ model: OrderItem }],
      transaction: t,
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: "Pedido no encontrado." });
    }

    const cancellableStatuses = ["pendiente", "pagado"];
    if (!cancellableStatuses.includes(order.status)) {
      await t.rollback();
      return res.status(400).json({
        message: "No es posible cancelar el pedido en su estado actual.",
      });
    }

    order.status = "cancelado";
    await order.save({ transaction: t });

    for (const item of order.OrderItems) {
      const variant = await ProductVariantStock.findByPk(
        item.productVariantStockId,
        { transaction: t }
      );
      if (variant) {
        variant.stock += item.quantity;
        await variant.save({ transaction: t });
      }
    }

    await t.commit();
    res.json({ message: "Pedido cancelado correctamente.", order });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

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

      productsTotal += Number(item.price) * item.quantity;

      itemsForEmail.push({
        name: product.name,
        size: variant.size,
        color: variant.color,
        quantity: item.quantity,
        price: item.price,
      });

      product.name = productName;

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

    // CAMBIO CRÍTICO: Manejo de estado y Emails NO bloqueante
    if (order.status === "pendiente") {
      order.status = "pagado";
      await order.save(); // Esperamos a guardar en DB, esto es rápido

      const shippingCost = Number(orderJson.total) - productsTotal;
      const subtotal = productsTotal / 1.21;
      const tax = productsTotal - subtotal;

      const summaryData = {
        total: Number(orderJson.total).toFixed(2),
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
      };

      // NO HACEMOS AWAIT AQUÍ.
      // Lanzamos el proceso de email en "segundo plano" para que no bloquee la respuesta al frontend.
      sendOrderConfirmationEmail(
        orderJson.User.email,
        orderJson.User.username,
        itemsForEmail,
        summaryData
      ).catch((err) =>
        console.error(
          "❌ Fallo email confirmación (segundo plano):",
          err.message
        )
      );

      sendNewOrderNotification(
        orderJson.User,
        orderJson,
        itemsForEmail,
        summaryData
      ).catch((err) =>
        console.error("❌ Fallo email admin (segundo plano):", err.message)
      );
    }

    // Respondemos inmediatamente al usuario
    res.json(orderJson);
  } catch (error) {
    console.error("Error en getOrderById:", error);
    next(error);
  }
};

module.exports = {
  createOrder,
  cancelOrder,
  getOrderHistory,
  getOrderById,
};
