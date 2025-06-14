const { Order, OrderItem, Product } = require("../models");

// Obtener carrito pendiente del usuario
exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const order = await Order.findOne({
      where: { userId, status: "pendiente" },
      include: {
        model: OrderItem,
        include: {
          model: Product,
        },
      },
    });

    if (!order) {
      return res.json({ message: "Carrito vacío", items: [] });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

// Añadir producto al carrito
exports.addToCart = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0)
      return res.status(400).json({ message: "Datos inválidos" });

    // Buscar o crear pedido pendiente
    let [order] = await Order.findOrCreate({
      where: { userId, status: "pendiente" },
      defaults: { total: 0, userId },
    });

    // Validar producto y stock
    const product = await Product.findByPk(productId);
    if (!product)
      return res.status(404).json({ message: "Producto no encontrado" });
    if (product.stock < quantity)
      return res.status(400).json({ message: "Stock insuficiente" });

    // Buscar si ya existe el item
    let orderItem = await OrderItem.findOne({
      where: { orderId: order.id, productId },
    });

    if (orderItem) {
      orderItem.quantity += quantity;
      await orderItem.save();
    } else {
      orderItem = await OrderItem.create({
        orderId: order.id,
        productId,
        quantity,
        price: product.price,
      });
    }

    // Recalcular total
    const orderItems = await OrderItem.findAll({
      where: { orderId: order.id },
    });
    order.total = orderItems.reduce(
      (sum, item) => Number(sum) + Number(item.price) * Number(item.quantity),
      0
    );
    await order.save();

    // Refrescar carrito
    const updatedOrder = await Order.findOne({
      where: { id: order.id },
      include: {
        model: OrderItem,
        include: { model: Product },
      },
    });

    res.json({ message: "Producto añadido al carrito", order: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// Actualizar cantidad de un item en el carrito
exports.updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0)
      return res.status(400).json({ message: "Cantidad inválida" });

    const order = await Order.findOne({
      where: { userId, status: "pendiente" },
    });
    if (!order)
      return res.status(404).json({ message: "Carrito no encontrado" });

    const orderItem = await OrderItem.findOne({
      where: { id: itemId, orderId: order.id },
    });
    if (!orderItem)
      return res.status(404).json({ message: "Item no encontrado" });

    if (quantity === 0) {
      await orderItem.destroy();
    } else {
      const product = await Product.findByPk(orderItem.productId);
      if (product.stock < quantity)
        return res.status(400).json({ message: "Stock insuficiente" });

      orderItem.quantity = quantity;
      await orderItem.save();
    }

    const orderItems = await OrderItem.findAll({
      where: { orderId: order.id },
    });
    order.total = orderItems.reduce(
      (sum, item) => Number(sum) + Number(item.price) * Number(item.quantity),
      0
    );
    await order.save();

    const updatedOrder = await Order.findOne({
      where: { id: order.id },
      include: {
        model: OrderItem,
        include: { model: Product },
      },
    });

    res.json({ message: "Carrito actualizado", order: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// Eliminar un item del carrito
exports.removeCartItem = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { itemId } = req.params;

    const order = await Order.findOne({
      where: { userId, status: "pendiente" },
    });
    if (!order)
      return res.status(404).json({ message: "Carrito no encontrado" });

    const orderItem = await OrderItem.findOne({
      where: { id: itemId, orderId: order.id },
    });
    if (!orderItem)
      return res.status(404).json({ message: "Item no encontrado" });

    await orderItem.destroy();

    const orderItems = await OrderItem.findAll({
      where: { orderId: order.id },
    });
    order.total = orderItems.reduce(
      (sum, item) => Number(sum) + Number(item.price) * Number(item.quantity),
      0
    );
    await order.save();

    const updatedOrder = await Order.findOne({
      where: { id: order.id },
      include: {
        model: OrderItem,
        include: { model: Product },
      },
    });

    res.json({ message: "Item eliminado", order: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// Finalizar compra (checkout)
exports.checkout = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const order = await Order.findOne({
      where: { userId, status: "pendiente" },
      include: [
        {
          model: OrderItem,
          include: [Product],
        },
      ],
    });

    if (!order)
      return res
        .status(400)
        .json({ message: "No hay pedido pendiente para procesar" });

    if (!order.OrderItems || order.OrderItems.length === 0)
      return res.status(400).json({ message: "El carrito está vacío" });

    for (const item of order.OrderItems) {
      const product = await Product.findByPk(item.productId);
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Stock insuficiente para el producto ${product.name}`,
        });
      }
    }

    for (const item of order.OrderItems) {
      const product = await Product.findByPk(item.productId);
      product.stock -= item.quantity;
      await product.save();
    }

    order.status = "pagado";
    await order.save();

    // Convertir a JSON para evitar errores de serialización
    const orderJSON = order.toJSON ? order.toJSON() : order;

    res.json({ message: "Compra realizada con éxito", order: orderJSON });
  } catch (error) {
    next(error);
  }
};
