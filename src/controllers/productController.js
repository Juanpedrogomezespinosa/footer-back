const { Op, fn, col } = require("sequelize");
const Product = require("../models/productModel");
const Rating = require("../models/ratingModel");
const fs = require("fs");
const path = require("path");

const validSortFields = ["price", "created_at", "name"];
const validSortDirections = ["ASC", "DESC"];

exports.getAllProducts = async (request, response, next) => {
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
      minRating,
      page = 1,
      limit = 18,
      sortBy = "created_at",
      order = "DESC",
    } = request.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || page < 1) {
      return response.status(400).json({ message: "Página inválida" });
    }

    if (isNaN(limit) || limit < 1) {
      return response.status(400).json({ message: "Límite inválido" });
    }

    if (!validSortFields.includes(sortBy)) {
      return response.status(400).json({
        message: `Campo de ordenación inválido. Usa uno de: ${validSortFields.join(
          ", "
        )}`,
      });
    }

    order = order.toUpperCase();
    if (!validSortDirections.includes(order)) {
      return response.status(400).json({
        message: "Dirección de ordenación inválida. Usa ASC o DESC",
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

    const productIds = products.map((product) => product.id);

    let ratings = [];
    if (productIds.length > 0) {
      ratings = await Rating.findAll({
        attributes: [
          [col("product_id"), "productId"],
          [fn("AVG", col("stars")), "averageRating"],
          [fn("COUNT", col("stars")), "ratingCount"],
        ],
        where: {
          product_id: productIds,
        },
        group: ["product_id"],
        raw: true,
      });
    }

    const ratingsMap = {};
    ratings.forEach(({ productId, averageRating, ratingCount }) => {
      ratingsMap[Number(productId)] = {
        averageRating: parseFloat(averageRating).toFixed(2),
        ratingCount: parseInt(ratingCount, 10),
      };
    });

    const productsResponse = products
      .map((product) => {
        const plainProduct = product.toJSON();
        const rating = ratingsMap[product.id] || {
          averageRating: null,
          ratingCount: 0,
        };
        return {
          ...plainProduct,
          averageRating: parseFloat(rating.averageRating) || 0,
          ratingCount: rating.ratingCount,
        };
      })
      .filter((product) =>
        minRating ? product.averageRating >= parseFloat(minRating) : true
      );

    const totalPages = Math.ceil(count / limit);

    response.json({
      currentPage: page,
      totalPages,
      totalItems: count,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
      products: productsResponse,
    });
  } catch (error) {
    console.error("Error en getAllProducts:", error);
    next(error);
  }
};

exports.getProductById = async (request, response, next) => {
  try {
    const { id } = request.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return response.status(404).json({ message: "Producto no encontrado" });
    }

    const average = await Rating.findOne({
      attributes: [[fn("AVG", col("stars")), "averageRating"]],
      where: { product_id: id },
      raw: true,
    });

    const averageRating = average?.averageRating
      ? parseFloat(parseFloat(average.averageRating).toFixed(2))
      : 0;

    response.json({ ...product.toJSON(), averageRating });
  } catch (error) {
    console.error("Error en getProductById:", error);
    next(error);
  }
};

exports.createProduct = async (request, response, next) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      size,
      color,
      brand,
      category,
      gender,
      material,
      season,
      is_new,
    } = request.body;

    const image = request.file ? request.file.filename : null;

    const newProduct = await Product.create({
      name,
      description,
      price,
      stock,
      size,
      color,
      brand,
      category,
      gender,
      material,
      season,
      is_new,
      image,
    });

    response.status(201).json(newProduct);
  } catch (error) {
    console.error("Error en createProduct:", error);
    next(error);
  }
};

exports.updateProduct = async (request, response, next) => {
  try {
    const { id } = request.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return response.status(404).json({ message: "Producto no encontrado" });
    }

    const {
      name,
      description,
      price,
      stock,
      size,
      color,
      brand,
      category,
      gender,
      material,
      season,
      is_new,
    } = request.body;

    if (request.file) {
      if (product.image) {
        const oldImagePath = path.join(
          __dirname,
          "..",
          "uploads",
          product.image
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      product.image = request.file.filename;
    }

    product.name = name ?? product.name;
    product.description = description ?? product.description;
    product.price = price ?? product.price;
    product.stock = stock ?? product.stock;
    product.size = size ?? product.size;
    product.color = color ?? product.color;
    product.brand = brand ?? product.brand;
    product.category = category ?? product.category;
    product.gender = gender ?? product.gender;
    product.material = material ?? product.material;
    product.season = season ?? product.season;
    product.is_new = is_new ?? product.is_new;

    await product.save();

    response.json(product);
  } catch (error) {
    console.error("Error en updateProduct:", error);
    next(error);
  }
};

exports.deleteProduct = async (request, response, next) => {
  try {
    const { id } = request.params;

    const product = await Product.findByPk(id);

    if (!product) {
      return response.status(404).json({ message: "Producto no encontrado" });
    }

    if (product.image) {
      const imagePath = path.join(__dirname, "..", "uploads", product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await product.destroy();

    response.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("Error en deleteProduct:", error);
    next(error);
  }
};
