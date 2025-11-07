const { Op, fn, col, sequelize } = require("sequelize");

// --- Importar ProductImage ---
const { Product, Rating, ProductImage } = require("../models");
const fs = require("fs");
const path = require("path");

const validSortFields = [
  "price",
  "created_at",
  "name",
  "averageRating",
  "ratingCount",
];
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

    if (isNaN(page) || page < 1)
      return response.status(400).json({ message: "Página inválida" });
    if (isNaN(limit) || limit < 1)
      return response.status(400).json({ message: "Límite inválido" });
    if (!validSortFields.includes(sortBy))
      return response
        .status(400)
        .json({ message: `Campo de ordenación inválido.` });
    order = order.toUpperCase();
    if (!validSortDirections.includes(order))
      return response
        .status(400)
        .json({ message: "Dirección de ordenación inválida." });

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
    if (brand) where.brand = Array.isArray(brand) ? { [Op.in]: brand } : brand;
    if (category)
      where.category = Array.isArray(category)
        ? { [Op.in]: category }
        : category;
    if (gender)
      where.gender = Array.isArray(gender) ? { [Op.in]: gender } : gender;
    if (material) where.material = material;
    if (season)
      where.season = Array.isArray(season) ? { [Op.in]: season } : season;
    if (is_new === "true") where.is_new = true;
    else if (is_new === "false") where.is_new = false;

    const offset = (page - 1) * limit;
    const isRatingSort = sortBy === "averageRating" || sortBy === "ratingCount";

    const queryOptions = {
      where,
      include: [
        {
          model: ProductImage,
          as: "images",
          attributes: ["id", "imageUrl", "displayOrder"],
        },
      ],
      order: isRatingSort ? undefined : [[sortBy, order]],
      limit: isRatingSort ? undefined : limit,
      offset: isRatingSort ? undefined : offset,
      // --- ¡ESTA ES LA CORRECCIÓN! ---
      // Esto fuerza a Sequelize a contar solo los productos únicos,
      // ignorando las filas duplicadas por el JOIN de imágenes.
      distinct: true,
      // --------------------------------
    };

    let products;
    let totalItems;

    if (isRatingSort) {
      // Esta lógica de 'isRatingSort' sigue siendo un poco compleja,
      // pero el 'distinct: true' debería ayudar a que 'products.length' sea correcto
      // si no aplicamos limit/offset aquí.
      products = await Product.findAll(queryOptions);
      totalItems = products.length; // Ahora 'products' debería tener 20 items únicos
    } else {
      // Esta es la ruta que estás usando (ordenar por precio)
      const { count, rows } = await Product.findAndCountAll(queryOptions);
      products = rows;
      totalItems = count; // 'count' ahora debería ser 20 gracias a 'distinct: true'
    }

    const productIds = products.map((product) => product.id);
    let ratings = [];
    if (productIds.length > 0) {
      ratings = await Rating.findAll({
        attributes: [
          [col("product_id"), "productId"],
          [fn("AVG", col("stars")), "averageRating"],
          [fn("COUNT", col("stars")), "ratingCount"],
        ],
        where: { product_id: { [Op.in]: productIds } },
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

    let productsResponse = products
      .map((product) => {
        const plainProduct = product.toJSON();

        let mainImage = null;
        if (plainProduct.images && plainProduct.images.length > 0) {
          plainProduct.images.sort((a, b) => a.displayOrder - b.displayOrder);
          mainImage = plainProduct.images[0].imageUrl;
        }

        const rating = ratingsMap[product.id] || {
          averageRating: 0,
          ratingCount: 0,
        };

        return {
          ...plainProduct,
          image: mainImage,
          images: undefined,
          averageRating: parseFloat(rating.averageRating) || 0,
          ratingCount: rating.ratingCount,
        };
      })
      .filter((product) =>
        minRating ? product.averageRating >= parseFloat(minRating) : true
      );

    if (isRatingSort) {
      // Si ordenamos por rating, el 'totalItems' real es DESPUÉS de filtrar
      totalItems = productsResponse.length;
    }

    if (isRatingSort) {
      productsResponse.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        if (order === "ASC") return aValue - bValue;
        return bValue - aValue;
      });
    }

    if (isRatingSort) {
      // Y la paginación manual se aplica al final
      productsResponse = productsResponse.slice(offset, offset + limit);
    }

    const totalPages = Math.ceil(totalItems / limit);

    response.json({
      currentPage: page,
      totalPages,
      totalItems,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null, // (Esto ya estaba corregido)
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

    const product = await Product.findByPk(id, {
      include: [
        {
          model: ProductImage,
          as: "images",
          attributes: ["id", "imageUrl", "displayOrder"],
          // --- ¡MEJORA! Asegurarnos de que las imágenes vienen ordenadas ---
          order: [["displayOrder", "ASC"]],
        },
      ],
    });

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
  const t = await sequelize.transaction();
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
      sub_category,
      gender,
      material,
      season,
      is_new,
    } = request.body;

    const images = request.files;

    if (!images || images.length === 0) {
      await t.rollback();
      return response
        .status(400)
        .json({ message: "Se requiere al menos una imagen." });
    }

    const newProduct = await Product.create(
      {
        name,
        description,
        price,
        stock,
        size,
        color,
        brand,
        category,
        sub_category,
        gender,
        material,
        season,
        is_new,
      },
      { transaction: t }
    );

    const imagePromises = images.map((file, index) => {
      const imageUrl = `/uploads/${file.filename}`;
      return ProductImage.create(
        {
          productId: newProduct.id,
          imageUrl: imageUrl,
          displayOrder: index,
        },
        { transaction: t }
      );
    });

    await Promise.all(imagePromises);

    await t.commit();

    const productWithImages = await Product.findByPk(newProduct.id, {
      include: [{ model: ProductImage, as: "images" }],
    });

    response.status(201).json(productWithImages);
  } catch (error) {
    await t.rollback();

    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err) => err.message);
      return response
        .status(400)
        .json({ message: "Error de validación", errors: messages });
    }

    console.error("Error en createProduct:", error);
    next(error);
  }
};

exports.updateProduct = async (request, response, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = request.params;
    const product = await Product.findByPk(id, { transaction: t });

    if (!product) {
      await t.rollback();
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
      sub_category,
      gender,
      material,
      season,
      is_new,
    } = request.body;

    product.name = name ?? product.name;
    product.description = description ?? product.description;
    product.price = price ?? product.price;
    product.stock = stock ?? product.stock;
    product.size = size ?? product.size;
    product.color = color ?? product.color;
    product.brand = brand ?? product.brand;
    product.category = category ?? product.category;
    product.sub_category = sub_category ?? product.sub_category;
    product.gender = gender ?? product.gender;
    product.material = material ?? product.material;
    product.season = season ?? product.season;
    product.is_new = is_new ?? product.is_new;

    await product.save({ transaction: t });
    await t.commit();

    const updatedProduct = await Product.findByPk(id, {
      include: [{ model: ProductImage, as: "images" }],
    });

    response.json(updatedProduct);
  } catch (error) {
    await t.rollback();

    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err) => err.message);
      return response
        .status(400)
        .json({ message: "Error de validación", errors: messages });
    }

    console.error("Error en updateProduct:", error);
    next(error);
  }
};

exports.deleteProduct = async (request, response, next) => {
  try {
    const { id } = request.params;

    const images = await ProductImage.findAll({ where: { productId: id } });

    const product = await Product.findByPk(id);
    if (!product) {
      return response.status(404).json({ message: "Producto no encontrado" });
    }
    await product.destroy(); // 'onDelete: CASCADE' se encarga de la BBDD

    if (images.length > 0) {
      images.forEach((image) => {
        try {
          const imagePath = path.join(__dirname, "..", image.imageUrl);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        } catch (err) {
          console.warn(
            `No se pudo eliminar el fichero de imagen: ${image.imageUrl}`,
            err
          );
        }
      });
    }

    response.json({ message: "Producto y todas sus imágenes eliminados" });
  } catch (error) {
    console.error("Error en deleteProduct:", error);
    next(error);
  }
};
