// src/controllers/orderController.js

// --- Imports actualizados ---
const {
  sequelize, // Importar sequelize para transacciones
  User,
  Order,
  OrderItem,
  Product,
  CartItem,
  Address,
  ProductImage,
  ProductVariantStock, // <-- ¡IMPORTANTE!
} = require("../models");
const { sendOrderConfirmationEmail } = require("../services/emailService");
const { createCheckoutSession } = require("../services/paymentService");
const { frontendUrl } = require("../config/env");

/**
 * --- ¡¡¡FUNCIÓN 'createOrder' TOTALMENTE REESCRITA (MÁS SEGURA Y FUNCIONAL)!!! ---
 * Crea una orden leyendo el carrito desde la BBDD, verifica stock,
 * resta el stock, y genera la sesión de pago.
 */
const createOrder = async (req, res, next) => {
  // 1. Iniciar una transacción
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    // El único dato que necesitamos del body es la dirección
    const { addressId } = req.body;

    if (!addressId) {
      await t.rollback();
      return res.status(400).json({
        message: "No se proporcionó una dirección de envío (addressId).",
      });
    }

    // 2. Validar la dirección
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

    // 3. Obtener los items del carrito (¡DESDE LA BBDD!)
    const cartItems = await CartItem.findAll({
      where: { userId },
      include: [
        {
          model: ProductVariantStock, // Incluimos la variante
          include: [
            {
              model: Product,
              as: "Product", // <-- ¡¡¡ESTA ES LA LÍNEA DE LA CORRECCIÓN!!!
            },
          ],
        },
      ],
      transaction: t, // Bloqueamos las filas
    });

    if (!cartItems || cartItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "Tu carrito está vacío." });
    }

    // 4. ¡¡VERIFICAR STOCK Y CALCULAR TOTAL!!
    let total = 0;
    const lineItems = [];
    const itemsForEmail = [];

    for (const item of cartItems) {
      const variant = item.ProductVariantStock;
      const product = variant.Product;

      // 4a. Verificar stock
      if (item.quantity > variant.stock) {
        await t.rollback();
        return res.status(400).json({
          message: `Stock insuficiente para ${product.name} (Talla: ${variant.size}, Color: ${variant.color}). Solo quedan ${variant.stock}.`,
        });
      }

      // 4b. Calcular total (con el precio de la BBDD, no del frontend)
      total += item.quantity * product.price; // Usamos el precio del producto padre

      // 4c. Preparar items para Stripe
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: `${product.name} (${variant.color} / ${variant.size})`,
          },
          unit_amount: Math.round(product.price * 100), // Precio en céntimos
        },
        quantity: item.quantity,
      });

      // 4d. Preparar items para el email
      itemsForEmail.push({
        productName: `${product.name} (${variant.color} / ${variant.size})`,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // 5. Crear el pedido
    const order = await Order.create(
      {
        userId,
        addressId,
        status: "pendiente", // Se actualiza a "pagado" en getOrderById
        total: total, // Total calculado en el backend
      },
      { transaction: t }
    );

    // 6. ¡¡RESTAR STOCK Y MOVER ITEMS A 'order_items'!!
    for (const item of cartItems) {
      const variant = item.ProductVariantStock;
      const product = variant.Product;

      // 6a. Crear el OrderItem
      await OrderItem.create(
        {
          orderId: order.id,
          productVariantStockId: item.productVariantStockId, // <-- ¡NUEVA FK!
          quantity: item.quantity,
          price: product.price, // Guardamos el precio del momento
        },
        { transaction: t }
      );

      // 6b. ¡¡RESTAR STOCK!!
      await ProductVariantStock.update(
        { stock: variant.stock - item.quantity },
        { where: { id: variant.id }, transaction: t }
      );
    }

    // 7. Limpiar el carrito
    await CartItem.destroy({ where: { userId: userId }, transaction: t });

    // 8. Crear sesión de Stripe
    const successUrl = `${frontendUrl}/confirmation/${order.id}`;
    const cancelUrl = `${frontendUrl}/cart`;

    const session = await createCheckoutSession(
      lineItems,
      successUrl,
      cancelUrl
    );

    // 9. Confirmar la transacción
    await t.commit();

    res.status(201).json({
      message: "Pedido creado con éxito",
      orderId: order.id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    // Si algo falla, revertir todo
    await t.rollback();
    console.error("Error en createOrder:", error);
    next(error);
  }
};

/**
 * Obtener historial de órdenes del usuario autenticado.
 * --- ¡MODIFICADO PARA LA NUEVA ESTRUCTURA! ---
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
              model: ProductVariantStock, // <-- Incluir la variante
              include: [
                {
                  model: Product, // E incluir el producto padre
                  as: "Product",
                  include: [{ model: ProductImage, as: "images" }], // Y sus imágenes
                },
              ],
            },
          ],
        },
        { model: Address },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Mapear la respuesta para que sea fácil para el frontend
    const plainOrders = orders.map((order) => {
      const orderJson = order.toJSON();
      orderJson.OrderItems = orderJson.OrderItems.map((item) => {
        // Creamos un objeto 'Product' falso para el frontend
        const variant = item.ProductVariantStock;
        const product = variant.Product;

        // Añadimos los detalles de la variante al nombre
        product.name = `${product.name} (${variant.color} / ${variant.size})`;

        // Encontrar la imagen principal
        if (product.images && product.images.length > 0) {
          product.images.sort((a, b) => a.displayOrder - b.displayOrder);
          product.image = product.images[0].imageUrl;
        } else {
          product.image = null;
        }

        // Reemplazamos el objeto Product con el nuestro modificado
        item.Product = product;

        // Limpiamos
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
 * --- ¡MODIFICADO PARA LA NUEVA ESTRUCTURA! ---
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
              model: ProductVariantStock, // <-- Incluir la variante
              include: [
                {
                  model: Product, // E incluir el producto padre
                  as: "Product",
                  include: [{ model: ProductImage, as: "images" }], // Y sus imágenes
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

    // Mapear la respuesta (igual que en getOrderHistory)
    const orderJson = order.toJSON();
    const itemsForEmail = []; // Lo preparamos aquí

    orderJson.OrderItems = orderJson.OrderItems.map((item) => {
      const variant = item.ProductVariantStock;
      const product = variant.Product;
      const productName = `${product.name} (${variant.color} / ${variant.size})`;

      itemsForEmail.push({
        productName: productName,
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

    // --- Lógica de Email (ahora usa orderJson) ---
    if (order.status === "pendiente") {
      order.status = "pagado";
      await order.save(); // Guardamos en la BBDD

      try {
        console.log("📧 (Confirmación) Enviando email a", orderJson.User.email);
        await sendOrderConfirmationEmail(
          orderJson.User.email,
          orderJson.User.username,
          itemsForEmail, // Usamos la lista que acabamos de crear
          orderJson.total
        );
        console.log("✅ (Confirmación) Email enviado correctamente");
      } catch (emailError) {
        console.error("❌ Error enviando email de confirmación:", emailError);
      }
    }

    res.json(orderJson); // Devolvemos el pedido mapeado
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
