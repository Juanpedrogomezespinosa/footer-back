const { Op } = require("sequelize");
const { Product } = require("../models");

const validSortFields = ["created_at", "price", "name", "stock"];
const validSortDirections = ["ASC", "DESC"];

exports.getAllProducts = async (req, res, next) => {
  try {
    let {
      name,
      minPrice,
      maxPrice,
      stock,
      page = 1,
      limit = 10,
      sortBy = "created_at",
      order = "DESC",
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    if (isNaN(page) || page < 1) {
      return res.status(400).json({ message: "Página inválida" });
    }
    if (isNaN(limit) || limit < 1) {
      return res.status(400).json({ message: "Límite inválido" });
    }

    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        message: `Campo de ordenación inválido. Campos válidos: ${validSortFields.join(
          ", "
        )}`,
      });
    }

    order = order.toUpperCase();
    if (!validSortDirections.includes(order)) {
      return res.status(400).json({
        message: `Dirección de ordenación inválida. Usa ASC o DESC`,
      });
    }

    const where = {};

    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = Number(minPrice);
      if (maxPrice) where.price[Op.lte] = Number(maxPrice);
    }

    if (stock === "true") {
      where.stock = { [Op.gt]: 0 };
    }

    const offset = (page - 1) * limit;

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, order]],
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      currentPage: page,
      totalPages,
      totalItems: count,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
      products,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product)
      return res.status(404).json({ message: "Producto no encontrado" });
    res.json(product);
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock } = req.body;
    const product = await Product.create({ name, description, price, stock });
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    await product.update(req.body);

    res.json({ message: "Producto actualizado", product });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Product.destroy({ where: { id } });
    if (!deleted)
      return res.status(404).json({ message: "Producto no encontrado" });
    res.json({ message: "Producto eliminado" });
  } catch (error) {
    next(error);
  }
};
