const {
  User,
  Order,
  OrderItem,
  Product,
  Address,
  ProductImage,
  ProductVariantStock,
} = require("../models");
const { sequelize } = require("../models");
const { Op, fn, col, literal } = require("sequelize");

/**
 * Función helper para calcular cambios porcentuales de forma segura.
 */
function calculatePercentageChange(current, previous) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * [ADMIN] Obtiene las estadísticas principales para el Dashboard.
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // --- 2. LÓGICA DE INGRESOS ---
    // contamos todos los estados que son ingresos (pagado, enviado, entregado)
    const revenueStatuses = ["pagado", "enviado", "entregado"];

    const revenueCurrentMonth = await Order.sum("total", {
      where: {
        status: { [Op.in]: revenueStatuses },
        createdAt: { [Op.gte]: startOfMonth },
      },
    });

    const revenueLastMonth = await Order.sum("total", {
      where: {
        status: { [Op.in]: revenueStatuses },
        createdAt: {
          [Op.gte]: startOfLastMonth,
          [Op.lt]: startOfMonth,
        },
      },
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfToday.getDate() - 1);

    const ordersToday = await Order.count({
      where: { createdAt: { [Op.gte]: startOfToday } },
    });

    const ordersYesterday = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: startOfYesterday,
          [Op.lt]: startOfToday,
        },
      },
    });

    const startOfThisWeek = new Date(startOfToday);
    startOfThisWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

    const usersThisWeek = await User.count({
      where: { created_at: { [Op.gte]: startOfThisWeek } },
    });

    const usersLastWeek = await User.count({
      where: {
        created_at: {
          [Op.gte]: startOfLastWeek,
          [Op.lt]: startOfThisWeek,
        },
      },
    });

    // Esta lógica para "pending" (pendientes de envío) es correcta con 'pagado'
    const pendingToday = await Order.count({
      where: {
        status: "pagado",
        createdAt: { [Op.gte]: startOfToday },
      },
    });

    const pendingYesterday = await Order.count({
      where: {
        status: "pagado",
        createdAt: {
          [Op.gte]: startOfYesterday,
          [Op.lt]: startOfToday,
        },
      },
    });

    const stats = {
      totalRevenue: {
        amount: revenueCurrentMonth || 0,
        percentage: calculatePercentageChange(
          revenueCurrentMonth || 0,
          revenueLastMonth || 0
        ),
      },
      ordersToday: {
        count: ordersToday,
        percentage: calculatePercentageChange(ordersToday, ordersYesterday),
      },
      newUsers: {
        count: usersThisWeek,
        percentage: calculatePercentageChange(usersThisWeek, usersLastWeek),
      },
      pendingShipments: {
        count: pendingToday,
        percentage: calculatePercentageChange(pendingToday, pendingYesterday),
      },
    };

    res.json(stats);
  } catch (error) {
    console.error("Error en getDashboardStats:", error);
    next(error);
  }
};

/**
 * [ADMIN] Obtiene los datos para la gráfica de ventas de los últimos 30 días.
 */
exports.getSalesGraphData = async (req, res, next) => {
  try {
    const revenueStatuses = ["pagado", "enviado", "entregado"];

    const salesLast30Days = await Order.findAll({
      attributes: [
        [fn("DATE", col("createdAt")), "date"],
        [fn("SUM", col("total")), "totalSales"],
      ],
      where: {
        status: { [Op.in]: revenueStatuses },
        createdAt: {
          [Op.gte]: literal("DATE_SUB(NOW(), INTERVAL 30 DAY)"),
        },
      },
      group: [fn("DATE", col("createdAt"))],
      order: [[fn("DATE", col("createdAt")), "ASC"]],
      raw: true,
    });

    const salesPrevious30Days = await Order.sum("total", {
      where: {
        status: { [Op.in]: revenueStatuses },
        createdAt: {
          [Op.gte]: literal("DATE_SUB(NOW(), INTERVAL 60 DAY)"),
          [Op.lt]: literal("DATE_SUB(NOW(), INTERVAL 30 DAY)"),
        },
      },
    });

    const totalCurrentPeriod = salesLast30Days.reduce(
      (sum, day) => sum + parseFloat(day.totalSales),
      0
    );
    const totalPreviousPeriod = parseFloat(salesPrevious30Days) || 0;

    const graphData = {
      labels: [],
      data: [],
    };

    const dateMap = new Map(
      salesLast30Days.map((item) => [item.date, item.totalSales])
    );
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split("T")[0];

      graphData.labels.push(dateString);
      graphData.data.push(parseFloat(dateMap.get(dateString) || 0));
    }

    res.json({
      totalSales: totalCurrentPeriod,
      percentage: calculatePercentageChange(
        totalCurrentPeriod,
        totalPreviousPeriod
      ),
      graphData: graphData,
    });
  } catch (error) {
    console.error("Error en getSalesGraphData:", error);
    next(error);
  }
};

/**
 * [ADMIN] Obtiene TODOS los pedidos (paginados)
 */
exports.getAllOrders = async (req, res, next) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    const offset = (page - 1) * limit;

    const { count, rows } = await Order.findAndCountAll({
      include: [
        {
          model: User,
          attributes: ["id", "username", "email"],
        },
        {
          model: Address,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      currentPage: page,
      totalPages,
      totalItems: count,
      orders: rows,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    });
  } catch (error) {
    console.error("Error en getAllOrders:", error);
    next(error);
  }
};

/**
 * [ADMIN] Obtiene CUALQUIER pedido por su ID.
 */
exports.getAdminOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ["id", "username", "email"],
        },
        {
          model: Address,
        },
        {
          model: OrderItem,
          include: [
            {
              model: ProductVariantStock,
              include: [
                {
                  model: Product,
                  as: "Product",
                  attributes: ["id", "name"],
                  include: [
                    {
                      model: ProductImage,
                      as: "images",
                      attributes: ["imageUrl"],
                      where: { displayOrder: 0 },
                      required: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    const orderJson = order.toJSON();

    const cleanedOrderItems = orderJson.OrderItems.map((item) => {
      const variant = item.ProductVariantStock;
      const product = variant.Product;

      let mainImage = null;
      if (product.images && product.images.length > 0) {
        mainImage = product.images[0].imageUrl;
      }

      const productName = `${product.name} (${variant.color} / ${variant.size})`;

      const cleanedProduct = {
        id: product.id,
        name: productName,
        image: mainImage,
      };

      delete item.ProductVariantStock;
      item.Product = cleanedProduct;

      return item;
    });

    const responsePayload = {
      ...orderJson,
      OrderItems: cleanedOrderItems,
    };

    res.json(responsePayload);
  } catch (error) {
    console.error("Error en getAdminOrderById:", error);
    next(error);
  }
};

/**
 * [ADMIN] Actualiza el estado de un pedido.
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pendiente",
      "pagado",
      "enviado",
      "entregado",
      "cancelado",
    ];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Estado no válido." });
    }

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    order.status = status;
    await order.save();

    res.json({ message: "Estado del pedido actualizado.", order });
  } catch (error) {
    console.error("Error en updateOrderStatus:", error);
    next(error);
  }
};

/**
 * [ADMIN] Obtiene TODOS los usuarios (con búsqueda)
 */
exports.getAdminAllUsers = async (req, res, next) => {
  try {
    const { search } = req.query; // <-- Parámetro de búsqueda

    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
      ];
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: [
        "id",
        "username",
        "lastName",
        "email",
        "phone",
        "avatarUrl",
        "role",
        "created_at",
      ],
      order: [["created_at", "DESC"]],
    });

    res.json(users);
  } catch (error) {
    console.error("Error en getAdminAllUsers:", error);
    next(error);
  }
};

/**
 * [ADMIN] Obtiene un usuario por ID (con sus direcciones)
 */
exports.getAdminUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: [
        "id",
        "username",
        "lastName",
        "email",
        "phone",
        "avatarUrl",
        "role",
        "created_at",
      ],
      include: [
        {
          model: Address, // <-- Incluimos las direcciones
          as: "Addresses", // Usamos el alias que tengas en models/index.js
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error en getAdminUserById:", error);
    next(error);
  }
};
