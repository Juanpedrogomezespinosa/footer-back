const { Op } = require("sequelize");
const Product = require("../models/productModel");

const validSortFields = ["price", "created_at", "name"];
const validSortDirections = ["ASC", "DESC"];

exports.getAllProducts = async (req, res, next) => {
  try {
    let {
      name,
      minPrice,
      maxPrice,
      stock,
      size,
      color,
      brand,
      category,
      gender,
      material,
      season,
      is_new,
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
        message: `Campo de ordenación inválido. Usa uno de: ${validSortFields.join(
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

    if (name) where.name = { [Op.like]: `%${name}%` };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = Number(minPrice);
      if (maxPrice) where.price[Op.lte] = Number(maxPrice);
    }
    if (stock === "true") where.stock = { [Op.gt]: 0 };
    else if (stock === "false") where.stock = 0;

    if (size) where.size = size;
    if (color) where.color = color;
    if (brand) where.brand = brand;
    if (category) where.category = category;
    if (gender) where.gender = gender;
    if (material) where.material = material;
    if (season) where.season = season;
    if (is_new === "true") where.is_new = true;
    else if (is_new === "false") where.is_new = false;

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

exports.getProductById = async (req, res) => {
  res.status(501).json({ message: "getProductById no implementado aún" });
};

exports.createProduct = async (req, res) => {
  res.status(501).json({ message: "createProduct no implementado aún" });
};

exports.updateProduct = async (req, res) => {
  res.status(501).json({ message: "updateProduct no implementado aún" });
};

exports.deleteProduct = async (req, res) => {
  res.status(501).json({ message: "deleteProduct no implementado aún" });
};

// ✅ NUEVA función: subir imagen de producto
exports.uploadProductImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No se subió ninguna imagen" });
    }

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    product.image = req.file.filename;
    await product.save();

    res.json({
      message: "Imagen subida correctamente",
      image: product.image,
    });
  } catch (error) {
    next(error);
  }
};
