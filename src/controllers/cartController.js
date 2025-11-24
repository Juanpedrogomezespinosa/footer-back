const {
  CartItem,
  Product,
  ProductImage,
  ProductVariantStock,
} = require("../models");

/**
 * Obtiene el carrito del usuario con lógica de precios corregida.
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
                  attributes: [
                    "id",
                    "imageUrl",
                    "displayOrder",
                    "variantColor",
                  ],
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

      // 1. LÓGICA DE IMAGEN INTELIGENTE
      // Intentamos buscar una imagen que coincida con el color de la variante.
      // Si no hay, usamos la primera imagen disponible del producto.
      let finalImage = null;
      if (product.images && product.images.length > 0) {
        const matchingImage = product.images.find(
          (img) => img.variantColor === variant.color
        );
        finalImage = matchingImage
          ? matchingImage.imageUrl
          : product.images[0].imageUrl;
      }

      // 2. LÓGICA DE PRECIO (HERENCIA)
      // Si el precio de la variante es mayor que 0, lo usamos.
      // Si es 0 (o null), usamos el precio base del producto.
      const variantPrice = parseFloat(variant.price || 0);
      const basePrice = parseFloat(product.price || 0);

      const finalPrice = variantPrice > 0 ? variantPrice : basePrice;

      return {
        id: itemJson.id,
        quantity: itemJson.quantity,
        product: {
          id: product.id,
          name: product.name,
          price: basePrice, // Precio base original para referencia
          image: finalImage,
        },
        variant: {
          id: variant.id,
          color: variant.color,
          size: variant.size,
          stock: variant.stock,
          // Enviamos el precio YA CALCULADO para que el front no se confunda
          price: finalPrice,
        },
      };
    });

    res.json(plainCart);
  } catch (error) {
    console.error("Error en getCart:", error);
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
