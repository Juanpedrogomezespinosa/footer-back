const { Order, OrderItem, Product } = require("../models");

// Obtener el carrito (pedido pendiente) del usuario
exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Buscar pedido con estado 'pendiente' para ese usuario
    let order = await Order.findOne({
      where: { user_id: userId, status: "pendiente" },
      include: { model: OrderItem, include: Product },
    });

    if (!order) {
      return res.json({ message: "Carrito vacío", items: [] });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

// Añadir producto al carrito (pedido pendiente)
exports.addToCart = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    // Buscar o crear pedido pendiente para usuario
    let [order] = await Order.findOrCreate({
      where: { user_id: userId, status: "pendiente" },
      defaults: { total: 0 },
    });

    // Buscar producto para precio y validación stock
    const product = await Product.findByPk(productId);
    if (!product)
      return res.status(404).json({ message: "Producto no encontrado" });
    if (product.stock < quantity)
      return res.status(400).json({ message: "Stock insuficiente" });

    // Buscar si producto ya está en el carrito
    let orderItem = await OrderItem.findOne({
      where: { order_id: order.id, product_id: productId },
    });

    if (orderItem) {
      // Actualizar cantidad
      orderItem.quantity += quantity;
      await orderItem.save();
    } else {
      // Crear nuevo item
      orderItem = await OrderItem.create({
        order_id: order.id,
        product_id: productId,
        quantity,
        price: product.price,
      });
    }

    // Actualizar total pedido
    const orderItems = await OrderItem.findAll({
      where: { order_id: order.id },
    });
    const total = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    order.total = total;
    await order.save();

    res.json({ message: "Producto añadido al carrito", order });
  } catch (error) {
    next(error);
  }
};

// Finalizar compra (checkout)
exports.checkout = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Buscar pedido pendiente
    const order = await Order.findOne({
      where: { user_id: userId, status: "pendiente" },
      include: OrderItem,
    });
    if (!order)
      return res
        .status(400)
        .json({ message: "No hay pedido pendiente para procesar" });
    if (order.order_items.length === 0)
      return res.status(400).json({ message: "El carrito está vacío" });

    // Validar stock antes de descontar
    for (const item of order.order_items) {
      const product = await Product.findByPk(item.product_id);
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Stock insuficiente para el producto ${product.name}`,
        });
      }
    }

    // Descontar stock
    for (const item of order.order_items) {
      const product = await Product.findByPk(item.product_id);
      product.stock -= item.quantity;
      await product.save();
    }

    // Cambiar estado a pagado (puedes luego gestionar pagos reales)
    order.status = "pagado";
    await order.save();

    res.json({ message: "Compra realizada con éxito", order });
  } catch (error) {
    next(error);
  }
};
