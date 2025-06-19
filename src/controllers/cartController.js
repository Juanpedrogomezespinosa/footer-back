const { CartItem, Product, User, Order, OrderItem } = require("../models");
const { sendOrderConfirmationEmail } = require("../services/emailService");

/**
 * Obtiene los productos del carrito del usuario actual
 */
const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cart = await CartItem.findAll({
      where: { userId },
      include: [Product],
    });

    res.json(cart);
  } catch (error) {
    next(error);
  }
};

/**
 * Añade un producto al carrito del usuario actual
 */
const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    const existingItem = await CartItem.findOne({
      where: { userId, productId },
    });

    if (existingItem) {
      existingItem.quantity += quantity;
      await existingItem.save();
    } else {
      await CartItem.create({ userId, productId, quantity });
    }

    res.status(201).json({ message: "Producto añadido al carrito" });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza la cantidad de un producto en el carrito
 */
const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const itemId = parseInt(req.params.itemId, 10); // Asegurar que es un número
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res
        .status(400)
        .json({ message: "La cantidad debe ser mayor que cero" });
    }

    console.log("🔍 Actualizando carrito:", { userId, itemId, quantity });

    const cartItem = await CartItem.findOne({
      where: { id: itemId, userId },
    });

    if (!cartItem) {
      console.warn("❌ Producto no encontrado en el carrito para este usuario");
      return res
        .status(404)
        .json({ message: "Producto no encontrado en el carrito" });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.json({ message: "Cantidad actualizada correctamente" });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina un producto del carrito del usuario
 */
const removeCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const itemId = parseInt(req.params.itemId, 10);

    await CartItem.destroy({ where: { id: itemId, userId } });

    res.json({ message: "Producto eliminado del carrito" });
  } catch (error) {
    next(error);
  }
};

/**
 * Procesa la compra del carrito del usuario:
 *  - Crea una orden
 *  - Mueve los ítems del carrito a la orden
 *  - Envía un email de confirmación
 */
const checkout = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cartItems = await CartItem.findAll({
      where: { userId },
      include: [Product],
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "El carrito está vacío" });
    }

    const total = cartItems.reduce((sum, item) => {
      return sum + item.Product.price * item.quantity;
    }, 0);

    const order = await Order.create({
      userId,
      total,
      status: "pendiente",
    });

    for (const item of cartItems) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.Product.price,
      });
    }

    await CartItem.destroy({ where: { userId } });

    order.status = "pagado";
    await order.save();

    const updatedOrder = await Order.findOne({
      where: { id: order.id },
      include: [
        {
          model: OrderItem,
          include: [Product],
        },
      ],
    });

    try {
      const user = await User.findByPk(userId);

      const itemsForEmail = updatedOrder.OrderItems.map((item) => ({
        productName: item.Product.name,
        quantity: item.quantity,
        price: item.price,
      }));

      console.log("📧 Enviando email de confirmación a", user.email);
      await sendOrderConfirmationEmail(
        user.email,
        user.username,
        itemsForEmail,
        updatedOrder.total
      );
      console.log("✅ Email de confirmación enviado correctamente");
    } catch (emailError) {
      console.error("❌ Error enviando email de confirmación:", emailError);
    }

    res.json({
      message: "Compra realizada con éxito",
      order: {
        id: updatedOrder.id,
        total: updatedOrder.total,
        status: updatedOrder.status,
        createdAt: updatedOrder.createdAt,
        items: updatedOrder.OrderItems.map((item) => ({
          productId: item.productId,
          productName: item.Product.name,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  checkout,
};
