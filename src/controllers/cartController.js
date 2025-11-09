// src/controllers/cartController.js
const {
  CartItem,
  Product,
  ProductImage,
  ProductVariantStock, // <-- ¡MODELO IMPORTADO!
} = require("../models");
// (Eliminadas las importaciones de Order, User, etc. que no se usan aquí)

/**
 * Obtiene los productos del carrito del usuario actual
 */
const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cart = await CartItem.findAll({
      where: { userId },
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
      order: [["created_at", "DESC"]], // Ordenar por más nuevo
    });

    const plainCart = cart.map((item) => {
      const itemJson = item.toJSON();
      if (
        itemJson.Product &&
        itemJson.Product.images &&
        itemJson.Product.images.length > 0
      ) {
        itemJson.Product.image = itemJson.Product.images[0].imageUrl;
      } else {
        itemJson.Product.image = null;
      }
      return itemJson;
    });

    res.json(plainCart);
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
    // --- ¡NUEVO! Recibimos 'size' ---
    const { productId, quantity, size } = req.body;

    // 1. Validar el producto
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // 2. Validar el stock de la variante (¡NUEVA LÓGICA!)
    if (size) {
      const variant = await ProductVariantStock.findOne({
        where: { productId, size },
      });

      if (!variant) {
        return res
          .status(404)
          .json({ message: "Talla no disponible para este producto." });
      }
      if (variant.stock < quantity) {
        return res.status(400).json({
          message: `Stock insuficiente. Solo quedan ${variant.stock} unidades de la talla ${size}.`,
        });
      }
    } else {
      // Si el producto SÍ tiene variantes (ej: zapatillas) pero NO se envió talla
      const hasVariants = await ProductVariantStock.count({
        where: { productId },
      });
      if (hasVariants > 0) {
        return res
          .status(400)
          .json({ message: "Por favor, selecciona una talla." });
      }
      // (Aquí iría la lógica para productos sin variantes, ej: una gorra)
    }

    // 3. Buscar item existente (¡Ahora también por talla!)
    const existingItem = await CartItem.findOne({
      where: { userId, productId, size: size || null }, // Guardar null si no hay talla
    });

    if (existingItem) {
      existingItem.quantity += quantity;
      // TODO: Aquí también deberíamos re-validar el stock total en carrito vs. variante
      await existingItem.save();
    } else {
      // 4. Crear nuevo item (¡con la talla!)
      await CartItem.create({
        userId,
        productId,
        quantity,
        size: size || null,
      });
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

    // ¡NUEVO! Validar stock antes de actualizar
    if (cartItem.size) {
      // Solo si el item tiene talla
      const variant = await ProductVariantStock.findOne({
        where: { productId: cartItem.productId, size: cartItem.size },
      });
      if (variant && variant.stock < quantity) {
        return res.status(400).json({
          message: `Stock insuficiente. Solo quedan ${variant.stock} unidades.`,
        });
      }
    }
    // (Aquí faltaría la lógica para productos sin variantes)

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

// --- ¡CORREGIDO! ---
// Eliminada la función 'checkout' obsoleta y el 'export' erróneo.
module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
};
