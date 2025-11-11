// src/controllers/cartController.js
const {
  CartItem,
  Product,
  ProductImage,
  ProductVariantStock, // <-- ¡Este es el modelo clave ahora!
} = require("../models");

/**
 * --- ¡FUNCIÓN REESCRITA! ---
 * Obtiene los productos del carrito del usuario actual,
 * apuntando a las variantes para obtener los detalles correctos.
 */
const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cart = await CartItem.findAll({
      where: { userId },
      include: [
        {
          // 1. Incluimos la VARIANTE (nuestra FK)
          model: ProductVariantStock,
          include: [
            {
              // 2. Dentro de la variante, incluimos el PRODUCTO padre
              model: Product,
              as: "Product", // Usamos el alias de 'index.js'
              include: [
                {
                  // 3. Y dentro del producto, sus imágenes
                  model: ProductImage,
                  as: "images",
                  attributes: ["id", "imageUrl", "displayOrder"],
                  order: [["displayOrder", "ASC"]],
                },
              ],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]], // Ordenar por más nuevo
    });

    // Mapeamos la respuesta para que el frontend la entienda fácilmente
    const plainCart = cart.map((item) => {
      const itemJson = item.toJSON();
      const variant = itemJson.ProductVariantStock;
      const product = variant.Product;

      // Encontrar la imagen principal
      let mainImage = null;
      if (product.images && product.images.length > 0) {
        // (No es necesario ordenar aquí si la consulta ya lo hizo)
        mainImage = product.images[0].imageUrl;
      }

      // Devolvemos un objeto limpio
      return {
        id: itemJson.id, // Este es el ID de CartItem (para poder eliminarlo)
        quantity: itemJson.quantity,
        product: {
          id: product.id, // ID del producto padre
          name: product.name,
          price: product.price,
          image: mainImage,
        },
        variant: {
          id: variant.id, // Este es el productVariantStockId
          color: variant.color,
          size: variant.size,
          stock: variant.stock, // Pasamos el stock para validación en el front
        },
      };
    });

    res.json(plainCart);
  } catch (error) {
    next(error);
  }
};

/**
 * --- ¡FUNCIÓN REESCRITA! ---
 * Añade una VARIANTE específica al carrito del usuario.
 * Ahora recibe 'productVariantStockId' en lugar de 'productId' y 'size'.
 */
const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // 1. Recibimos los nuevos campos del body
    const { productVariantStockId, quantity } = req.body;

    if (!productVariantStockId || !quantity || parseInt(quantity, 10) <= 0) {
      return res.status(400).json({
        message: "ID de variante y cantidad válida son requeridos.",
      });
    }

    // 2. Validar que la variante existe y tiene stock
    const variant = await ProductVariantStock.findByPk(productVariantStockId);
    if (!variant) {
      return res
        .status(404)
        .json({ message: "Variante de producto no encontrada" });
    }

    // 3. Usar 'findOrCreate' para manejar si el item ya existe
    const [cartItem, created] = await CartItem.findOrCreate({
      where: { userId, productVariantStockId },
      defaults: {
        quantity: 0, // Empezamos en 0, luego sumamos
      },
    });

    // 4. Validar el stock TOTAL (lo que pide + lo que ya tiene)
    const newQuantity = cartItem.quantity + parseInt(quantity, 10);

    if (variant.stock < newQuantity) {
      return res.status(400).json({
        message: `Stock insuficiente. Solo quedan ${variant.stock} unidades de esta variante.`,
      });
    }

    // 5. Guardar la nueva cantidad
    cartItem.quantity = newQuantity;
    await cartItem.save();

    // Enviamos 201 (Created) si es nuevo, 200 (OK) si se actualizó
    res
      .status(created ? 201 : 200)
      .json({ message: "Producto añadido/actualizado en el carrito" });
  } catch (error) {
    next(error);
  }
};

/**
 * --- ¡FUNCIÓN CORREGIDA! ---
 * Actualiza la cantidad de un producto en el carrito
 * (La validación de stock ahora usa productVariantStockId)
 */
const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const itemId = parseInt(req.params.itemId, 10); // Este es 'cart_items.id'
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

    // --- ¡LÓGICA DE VALIDACIÓN CORREGIDA! ---
    // 1. Encontrar la variante usando la FK del cartItem
    const variant = await ProductVariantStock.findByPk(
      cartItem.productVariantStockId
    );

    if (!variant) {
      // Si la variante fue eliminada de la BBDD
      await cartItem.destroy(); // Limpiamos el carrito
      return res.status(404).json({
        message: "Esta variante ya no existe y ha sido eliminada del carrito.",
      });
    }

    // 2. Comparar con el stock real
    if (variant.stock < quantity) {
      return res.status(400).json({
        message: `Stock insuficiente. Solo quedan ${variant.stock} unidades.`,
      });
    }
    // ------------------------------------------

    cartItem.quantity = quantity;
    await cartItem.save();

    res.json({ message: "Cantidad actualizada correctamente" });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina un producto del carrito del usuario
 * (Esta función no necesitaba cambios, ya usaba el 'cart_items.id')
 */
const removeCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const itemId = parseInt(req.params.itemId, 10); // 'cart_items.id'

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
