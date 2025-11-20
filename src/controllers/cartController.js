// src/controllers/cartController.js
const {
  CartItem,
  Product,
  ProductImage,
  ProductVariantStock,
} = require("../models");

/**
 * --- ¡FUNCIÓN CORREGIDA PARA EVITAR ERROR 500! ---
 * Hemos eliminado la referencia a 'color' en ProductImage
 * porque esa columna no existe en tu base de datos.
 */
const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cart = await CartItem.findAll({
      where: { userId },
      include: [
        {
          model: ProductVariantStock,
          include: [
            {
              model: Product,
              as: "Product",
              include: [
                {
                  model: ProductImage,
                  as: "images",
                  // CORRECCIÓN: Eliminamos "color" de aquí para que no falle el SQL
                  attributes: ["id", "imageUrl", "displayOrder"],
                  order: [["displayOrder", "ASC"]],
                },
              ],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Mapeamos la respuesta
    const plainCart = cart.map((item) => {
      const itemJson = item.toJSON();
      const variant = itemJson.ProductVariantStock;
      const product = variant.Product;

      // --- LÓGICA DE IMAGEN (SIMPLIFICADA) ---
      // Al no tener columna de color en las imágenes, cogemos la primera disponible.
      let finalImage = null;

      if (product.images && product.images.length > 0) {
        finalImage = product.images[0].imageUrl;
      }

      return {
        id: itemJson.id,
        quantity: itemJson.quantity,
        product: {
          id: product.id,
          name: product.name,
          price: product.price, // Precio base
          image: finalImage, // Imagen principal
        },
        variant: {
          id: variant.id,
          color: variant.color,
          size: variant.size,
          stock: variant.stock,
          price: variant.price, // ¡ESTO ES LO IMPORTANTE! El precio de 11€ se envía bien.
        },
      };
    });

    res.json(plainCart);
  } catch (error) {
    next(error);
  }
};

/**
 * Añade una VARIANTE específica al carrito del usuario.
 */
const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productVariantStockId, quantity } = req.body;

    if (!productVariantStockId || !quantity || parseInt(quantity, 10) <= 0) {
      return res.status(400).json({
        message: "ID de variante y cantidad válida son requeridos.",
      });
    }

    // Validar que la variante existe
    const variant = await ProductVariantStock.findByPk(productVariantStockId);
    if (!variant) {
      return res
        .status(404)
        .json({ message: "Variante de producto no encontrada" });
    }

    // Buscar o crear el item en el carrito
    const [cartItem, created] = await CartItem.findOrCreate({
      where: { userId, productVariantStockId },
      defaults: {
        quantity: 0,
      },
    });

    // Validar stock
    const newQuantity = cartItem.quantity + parseInt(quantity, 10);

    if (variant.stock < newQuantity) {
      return res.status(400).json({
        message: `Stock insuficiente. Solo quedan ${variant.stock} unidades de esta variante.`,
      });
    }

    // Guardar
    cartItem.quantity = newQuantity;
    await cartItem.save();

    res
      .status(created ? 201 : 200)
      .json({ message: "Producto añadido/actualizado en el carrito" });
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

    // Validar stock contra la variante
    const variant = await ProductVariantStock.findByPk(
      cartItem.productVariantStockId
    );

    if (!variant) {
      await cartItem.destroy();
      return res.status(404).json({
        message: "Esta variante ya no existe y ha sido eliminada del carrito.",
      });
    }

    if (variant.stock < quantity) {
      return res.status(400).json({
        message: `Stock insuficiente. Solo quedan ${variant.stock} unidades.`,
      });
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

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
};
