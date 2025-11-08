const {
  User,
  Order,
  OrderItem,
  Product,
  Address,
  ProductImage,
} = require("../models");
const { sequelize } = require("../models");
const { Op, fn, col, literal } = require("sequelize");

/**
 * Función helper para calcular cambios porcentuales de forma segura.
 */
function calculatePercentageChange(current, previous) {
  if (previous === 0) {
    // Si el mes pasado fue 0, cualquier aumento es "infinito"
    // Devolvemos 100% si hay ventas nuevas, 0% si no.
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * [ADMIN] Obtiene las estadísticas principales para el Dashboard.
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    // 1. Total Revenue (Ingresos Totales este mes vs. mes pasado)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0); // El día 0 del mes actual es el último día del mes pasado

    const revenueCurrentMonth = await Order.sum("total", {
      where: {
        status: "pagado",
        createdAt: { [Op.gte]: startOfMonth },
      },
    });

    const revenueLastMonth = await Order.sum("total", {
      where: {
        status: "pagado",
        createdAt: {
          [Op.gte]: startOfLastMonth,
          [Op.lt]: startOfMonth, // Usamos 'lt' (less than) startOfMonth
        },
      },
    });

    // 2. Orders Today (Pedidos hoy vs. ayer)
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

    // 3. New Users (Nuevos usuarios esta semana vs. semana pasada)
    const startOfThisWeek = new Date(startOfToday);
    startOfThisWeek.setDate(startOfToday.getDate() - startOfToday.getDay()); // Va al Domingo (inicio de la semana)
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

    // 4. Pending Shipments (Pedidos 'pagados' pero no 'enviados')
    // Contamos los que se marcaron como 'pagado' hoy vs. ayer
    const pendingToday = await Order.count({
      where: {
        status: "pagado", // Asumimos que 'pagado' es pendiente de envío
        createdAt: { [Op.gte]: startOfToday }, // Usamos createdAt, asumiendo que se paga al crear
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

    // Ensamblar la respuesta
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
    // 1. Ventas de los últimos 30 días, agrupadas por día
    const salesLast30Days = await Order.findAll({
      attributes: [
        [fn("DATE", col("createdAt")), "date"],
        [fn("SUM", col("total")), "totalSales"],
      ],
      where: {
        status: "pagado",
        createdAt: {
          [Op.gte]: literal("DATE_SUB(NOW(), INTERVAL 30 DAY)"),
        },
      },
      group: [fn("DATE", col("createdAt"))],
      order: [[fn("DATE", col("createdAt")), "ASC"]],
      raw: true,
    });

    // 2. Total de ventas de los 30 días anteriores (para comparación)
    const salesPrevious30Days = await Order.sum("total", {
      where: {
        status: "pagado",
        createdAt: {
          [Op.gte]: literal("DATE_SUB(NOW(), INTERVAL 60 DAY)"),
          [Op.lt]: literal("DATE_SUB(NOW(), INTERVAL 30 DAY)"),
        },
      },
    });

    // 3. Calcular el total de los últimos 30 días
    const totalCurrentPeriod = salesLast30Days.reduce(
      (sum, day) => sum + parseFloat(day.totalSales),
      0
    );
    const totalPreviousPeriod = parseFloat(salesPrevious30Days) || 0;

    // Formatear los datos para la gráfica
    const graphData = {
      labels: [],
      data: [],
    };

    // Rellenar los 30 días (incluso si no hubo ventas)
    const dateMap = new Map(
      salesLast30Days.map((item) => [item.date, item.totalSales])
    );
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split("T")[0]; // Formato YYYY-MM-DD

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
          attributes: ["id", "username", "email"], // Solo traer lo necesario del usuario
        },
        {
          model: Address, // Incluir la dirección de envío
        },
        // Opcional: incluir OrderItems si la "vista de detalle" los necesita
        // { model: OrderItem, include: [Product] }
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
    });
  } catch (error) {
    console.error("Error en getAllOrders:", error);
    next(error);
  }
};
