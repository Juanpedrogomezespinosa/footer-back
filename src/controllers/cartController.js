// --- 1. Importar ProductImage ---
const {
  CartItem,
  Product,
  User,
  Order,
  OrderItem,
  ProductImage,
} = require("../models");
const { sendOrderConfirmationEmail } = require("../services/emailService");

/**
 * Obtiene los productos del carrito del usuario actual
 * --- ¡MODIFICADO! ---
 */
const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cart = await CartItem.findAll({
      where: { userId },
      // --- 2. Incluir el Producto Y su galería de imágenes ---
      include: [
        {
          model: Product,
          include: [
            {
              model: ProductImage,
              as: "images",
              attributes: ["id", "imageUrl", "displayOrder"],
              order: [["displayOrder", "ASC"]],
            },
          ],
        },
      ],
    });

    // --- 3. Mapear la respuesta para añadir la imagen principal ---
    // (Igual que hicimos en orderController)
    const plainCart = cart.map((item) => {
      const itemJson = item.toJSON();
      if (
        itemJson.Product &&
        itemJson.Product.images &&
        itemJson.Product.images.length > 0
      ) {
        // Creamos el campo 'image' que el frontend espera
        itemJson.Product.image = itemJson.Product.images[0].imageUrl;
      } else {
        itemJson.Product.image = null; // O un placeholder
      }
      // Opcional: delete itemJson.Product.images;
      return itemJson;
    });

    res.json(plainCart); // <-- 4. Devolver el carrito mapeado
  } catch (error) {
    next(error);
  }
};

/**
 * Añade un producto al carrito del usuario actual
 * (Sin cambios)
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
 * (Sin cambios)
 */
const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const itemId = parseInt(req.params.itemId, 10);
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res
        .status(400)
        .json({ message: "La cantidad debe ser mayor que cero" });
    }

    const cartItem = await CartItem.findOne({
      where: { id: itemId, userId },
    });

    if (!cartItem) {
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
 * (Sin cambios)
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
 * (Esta función 'checkout' está obsoleta,
 * la real es 'createOrder' en orderController,
 * pero la dejamos por si la usas en otro sitio)
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
      // ¡OJO! Esta función 'checkout' no pide 'addressId',
      // por lo que fallará. La función correcta es 'createOrder'
      // en 'orderController.js'
      addressId: 1, // <--- ESTO ES UN VALOR FIJO, ¡HAY QUE QUITAR ESTA FUNCIÓN!
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
