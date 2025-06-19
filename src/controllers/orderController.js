const { Order, OrderItem, Product } = require("../models");

exports.getOrderHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId; // aquí debe ser userId según tu authMiddleware

    const orders = await Order.findAll({
      where: { userId },
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ["id", "name", "price", "size", "color", "brand"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ orders });
  } catch (error) {
    next(error);
  }
};
