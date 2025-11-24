const { Op, fn, col } = require("sequelize");
const {
  Product,
  Rating,
  ProductImage,
  ProductVariantStock,
  sequelize,
} = require("../models");
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
      limit = 16,
      sortBy = "created_at",
      order = "DESC",
      showArchived,
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

    const whereProduct = {};

    if (showArchived !== "true") {
      whereProduct.is_active = true;
    }

    if (name) whereProduct.name = { [Op.like]: `%${name}%` };

    if (minPrice || maxPrice) {
      whereProduct.price = {};
      if (minPrice) whereProduct.price[Op.gte] = Number(minPrice);
      if (maxPrice) whereProduct.price[Op.lte] = Number(maxPrice);
    }

    if (brand) {
      whereProduct.brand = Array.isArray(brand) ? { [Op.in]: brand } : brand;
    }

    if (category) {
      const categories = Array.isArray(category) ? category : [category];
      whereProduct.category = {
        [Op.in]: categories.map((c) => c.toLowerCase()),
      };
    }

    if (gender) {
      const genders = Array.isArray(gender) ? gender : [gender];
      whereProduct.gender = { [Op.in]: genders.map((g) => g.toLowerCase()) };
    }

    if (material) {
      whereProduct.material = Array.isArray(material)
        ? { [Op.in]: material }
        : material;
    }

    if (season) {
      const seasons = Array.isArray(season) ? season : [season];
      whereProduct.season = { [Op.in]: seasons.map((s) => s.toLowerCase()) };
    }

    if (is_new === "true") whereProduct.is_new = true;
    else if (is_new === "false") whereProduct.is_new = false;

    if (color) {
      const colors = Array.isArray(color) ? color : [color];
      whereProduct.color = {
        [Op.or]: colors.map((c) => ({ [Op.like]: `%${c}%` })),
      };
    }

    const whereVariant = {};
    let includeVariants = false;

    if (stock === "true") {
      whereVariant.stock = { [Op.gt]: 0 };
      includeVariants = true;
    } else if (stock === "false") {
      whereVariant.stock = 0;
      includeVariants = true;
    }
    if (size) {
      whereVariant.size = size;
      includeVariants = true;
    }

    const offset = (page - 1) * limit;
    const isRatingSort = sortBy === "averageRating" || sortBy === "ratingCount";

    const includes = [
      {
        model: ProductImage,
        as: "images",
        attributes: ["id", "imageUrl", "displayOrder"],
      },
    ];

    if (includeVariants) {
      includes.push({
        model: ProductVariantStock,
        as: "variants",
        attributes: [],
        where: whereVariant,
        required: true,
      });
    }

    const queryOptions = {
      attributes: [
        "id",
        "name",
        "description",
        "price",
        "discountPrice",
        "brand",
        "category",
        "sub_category",
        "gender",
        "material",
        "season",
        "is_new",
        "created_at",
        "color",
        "is_active",
        [
          sequelize.literal(`(
            SELECT SUM(stock) 
            FROM product_variant_stock 
            WHERE product_id = Product.id
          )`),
          "totalStock",
        ],
      ],
      where: whereProduct,
      include: includes,
      order: isRatingSort ? undefined : [[sortBy, order]],
      limit: isRatingSort ? undefined : limit,
      offset: isRatingSort ? undefined : offset,
      distinct: true,
    };

    let products;
    let totalItems;

    if (isRatingSort) {
      delete queryOptions.limit;
      delete queryOptions.offset;
      products = await Product.findAll(queryOptions);
      totalItems = products.length;
    } else {
      const { count, rows } = await Product.findAndCountAll(queryOptions);
      products = rows;
      totalItems = typeof count === "number" ? count : count.length;
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
        const stock = parseInt(plainProduct.totalStock, 10) || 0;

        return {
          ...plainProduct,
          image: mainImage,
          images: undefined,
          averageRating: parseFloat(rating.averageRating) || 0,
          ratingCount: rating.ratingCount,
          totalStock: stock,
        };
      })
      .filter((product) =>
        minRating ? product.averageRating >= parseFloat(minRating) : true
      );

    if (isRatingSort) {
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
      productsResponse = productsResponse.slice(offset, offset + limit);
    }

    const totalPages = Math.ceil(totalItems / limit);

    response.json({
      currentPage: page,
      totalPages,
      totalItems,
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

    const product = await Product.findByPk(id, {
      attributes: [
        "id",
        "name",
        "description",
        "price",
        "discountPrice",
        "brand",
        "category",
        "sub_category",
        "gender",
        "material",
        "season",
        "is_new",
        "color",
        "is_active",
      ],
      include: [
        {
          model: ProductImage,
          as: "images",
          attributes: ["id", "imageUrl", "displayOrder", "variantColor"],
          order: [["displayOrder", "ASC"]],
        },
        {
          model: ProductVariantStock,
          as: "variants",
          attributes: ["id", "color", "size", "stock", "price"],
        },
      ],
    });

    if (!product || !product.is_active) {
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

    const productJson = product.toJSON();

    const availableColors = [
      ...new Set(productJson.variants.map((v) => v.color)),
    ];

    const imagesByColor = productJson.images.reduce((acc, image) => {
      const colorKey = image.variantColor || "generic";
      if (!acc[colorKey]) {
        acc[colorKey] = [];
      }
      acc[colorKey].push({
        id: image.id,
        imageUrl: image.imageUrl,
        displayOrder: image.displayOrder,
      });
      acc[colorKey].sort((a, b) => a.displayOrder - b.displayOrder);
      return acc;
    }, {});

    const variantsByColor = productJson.variants.reduce((acc, variant) => {
      if (!acc[variant.color]) {
        acc[variant.color] = [];
      }
      acc[variant.color].push({
        id: variant.id,
        size: variant.size,
        stock: variant.stock,
        price: variant.price,
      });
      return acc;
    }, {});

    const responseData = {
      ...productJson,
      averageRating,
      availableColors,
      imagesByColor,
      variantsByColor,
      variants: productJson.variants,
    };

    const siblings = await Product.findAll({
      where: {
        name: product.name,
        id: { [Op.ne]: id },
        is_active: true,
      },
      attributes: ["id", "color"],
      include: [
        {
          model: ProductImage,
          as: "images",
          attributes: ["imageUrl"],
          where: { displayOrder: 0 },
          required: false,
        },
      ],
    });

    const cleanedSiblings = siblings.map((s) => {
      const variantJson = s.toJSON();
      return {
        id: variantJson.id,
        color: variantJson.color,
        image:
          variantJson.images && variantJson.images.length > 0
            ? variantJson.images[0].imageUrl
            : null,
      };
    });

    response.json({
      ...responseData,
      siblings: cleanedSiblings,
    });
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
      discountPrice,
      brand,
      category,
      sub_category,
      gender,
      material,
      season,
      is_new,
      variants,
      imageMetadata,
    } = request.body;

    const images = request.files;

    if (!variants) {
      await t.rollback();
      return response.status(400).json({
        message: "El campo 'variants' (con el stock y tallas) es requerido.",
      });
    }

    const parsedVariants = JSON.parse(variants);

    let parsedImageMetadata = [];
    if (imageMetadata) {
      try {
        parsedImageMetadata = JSON.parse(imageMetadata);
      } catch (err) {
        console.warn("No se pudo parsear imageMetadata", err);
      }
    }

    if (!images || images.length === 0) {
      await t.rollback();
      return response
        .status(400)
        .json({ message: "Se requiere al menos una imagen." });
    }

    if (!parsedVariants || parsedVariants.length === 0) {
      await t.rollback();
      return response
        .status(400)
        .json({ message: "Se requiere al menos una variante." });
    }

    const mainColor = parsedVariants[0].color;

    const newProduct = await Product.create(
      {
        name,
        description,
        price,
        discountPrice: discountPrice || null,
        brand,
        category,
        sub_category,
        gender,
        material,
        season: season || null,
        is_new,
        is_active: true,
        color: mainColor,
      },
      { transaction: t }
    );

    const variantData = parsedVariants.map((v) => ({
      productId: newProduct.id,
      color: v.color,
      size: v.size,
      stock: v.stock,
      price: v.price || 0,
    }));

    await ProductVariantStock.bulkCreate(variantData, { transaction: t });

    const imagePromises = images.map((file, index) => {
      const imageUrl = `/uploads/${file.filename}`;

      const meta = parsedImageMetadata.find(
        (m) => m.filename === file.originalname
      );
      const assignedColor = meta ? meta.color : mainColor;

      return ProductImage.create(
        {
          productId: newProduct.id,
          imageUrl: imageUrl,
          displayOrder: index,
          variantColor: assignedColor,
        },
        { transaction: t }
      );
    });

    await Promise.all(imagePromises);

    await t.commit();

    const productWithDetails = await Product.findByPk(newProduct.id, {
      include: [
        { model: ProductImage, as: "images" },
        { model: ProductVariantStock, as: "variants" },
      ],
    });

    response.status(201).json(productWithDetails);
  } catch (error) {
    await t.rollback();

    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err) => err.message);
      return response
        .status(400)
        .json({ message: "Error de validación", errors: messages });
    }

    if (error.message.includes("Solo se permiten imágenes")) {
      return response.status(400).json({ message: error.message });
    }

    if (error instanceof SyntaxError) {
      return response.status(400).json({
        message: "Error de formato en JSON (variants o imageMetadata).",
      });
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
      discountPrice,
      brand,
      category,
      sub_category,
      gender,
      material,
      season,
      is_new,
      variants,
      imagesToDelete,
      imageMetadata,
    } = request.body;

    const newImages = request.files;

    const parsedVariants = variants ? JSON.parse(variants) : undefined;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;

    if (discountPrice !== undefined) {
      product.discountPrice =
        discountPrice && discountPrice !== "null" ? discountPrice : null;
    }

    if (brand !== undefined) product.brand = brand;
    if (category !== undefined) product.category = category;
    if (sub_category !== undefined) product.sub_category = sub_category;
    if (gender !== undefined) product.gender = gender;
    if (material !== undefined) product.material = material;

    if (season !== undefined) {
      if (!season || season === "null" || season === "") {
        product.season = null;
      } else {
        product.season = season;
      }
    }

    if (is_new !== undefined) product.is_new = is_new;

    if (parsedVariants && parsedVariants.length > 0) {
      product.color = parsedVariants[0].color;
    }

    await product.save({ transaction: t });

    if (parsedVariants && parsedVariants.length > 0) {
      const variantData = parsedVariants.map((v) => ({
        productId: id,
        color: v.color,
        size: v.size,
        stock: v.stock,
        price: v.price || 0,
      }));

      for (const variant of variantData) {
        const existingVariant = await ProductVariantStock.findOne({
          where: {
            productId: id,
            color: variant.color,
            size: variant.size,
          },
          transaction: t,
        });

        if (existingVariant) {
          existingVariant.stock = variant.stock;
          existingVariant.price = variant.price;
          await existingVariant.save({ transaction: t });
        } else {
          await ProductVariantStock.create(variant, { transaction: t });
        }
      }
    }

    if (imagesToDelete) {
      let idsToDelete = [];
      try {
        idsToDelete = JSON.parse(imagesToDelete);
      } catch (e) {
        console.warn("Error parseando imagesToDelete", e);
      }

      if (idsToDelete.length > 0) {
        const images = await ProductImage.findAll({
          where: { id: { [Op.in]: idsToDelete }, productId: id },
          transaction: t,
        });

        for (const img of images) {
          if (img.imageUrl && img.imageUrl.startsWith("/uploads/")) {
            const filePath = path.join(
              __dirname,
              "..",
              "uploads",
              path.basename(img.imageUrl)
            );
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
          await img.destroy({ transaction: t });
        }
      }
    }

    if (newImages && newImages.length > 0) {
      let parsedImageMetadata = [];
      if (imageMetadata) {
        try {
          parsedImageMetadata = JSON.parse(imageMetadata);
        } catch (err) {
          console.warn("No se pudo parsear imageMetadata", err);
        }
      }

      const maxOrderResult = await ProductImage.findOne({
        where: { productId: id },
        order: [["displayOrder", "DESC"]],
        transaction: t,
      });
      let nextOrder = maxOrderResult ? maxOrderResult.displayOrder + 1 : 0;

      const imagePromises = newImages.map((file) => {
        const imageUrl = `/uploads/${file.filename}`;

        const meta = parsedImageMetadata.find(
          (m) => m.filename === file.originalname
        );
        const assignedColor = meta ? meta.color : product.color;

        const imgCreation = ProductImage.create(
          {
            productId: id,
            imageUrl: imageUrl,
            displayOrder: nextOrder,
            variantColor: assignedColor,
          },
          { transaction: t }
        );
        nextOrder++;
        return imgCreation;
      });

      await Promise.all(imagePromises);
    }

    await t.commit();

    const updatedProduct = await Product.findByPk(id, {
      include: [
        { model: ProductImage, as: "images" },
        { model: ProductVariantStock, as: "variants" },
      ],
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

    if (
      error.code === "WARN_DATA_TRUNCATED" ||
      error.name === "SequelizeDatabaseError"
    ) {
      console.error("Error de base de datos detallado:", error);
      return response.status(400).json({
        message: "Error en los datos enviados.",
      });
    }

    if (error instanceof SyntaxError) {
      return response
        .status(400)
        .json({ message: "El formato JSON enviado no es válido." });
    }

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

    product.is_active = false;
    await product.save();

    response.json({
      message: "Producto eliminado correctamente (archivado)",
    });
  } catch (error) {
    console.error("Error en deleteProduct:", error);
    next(error);
  }
};

exports.getRelatedProducts = async (request, response, next) => {
  try {
    const { id } = request.params;

    const currentProduct = await Product.findByPk(id, {
      attributes: ["category"],
    });

    if (!currentProduct) {
      return response.status(404).json({ message: "Producto no encontrado" });
    }

    const relatedProducts = await Product.findAll({
      where: {
        category: currentProduct.category,
        id: { [Op.ne]: id },
        is_active: true,
      },
      limit: 4,
      include: [
        {
          model: ProductImage,
          as: "images",
          attributes: ["imageUrl", "displayOrder"],
          order: [["displayOrder", "ASC"]],
          limit: 1,
        },
      ],
      attributes: [
        "id",
        "name",
        "description",
        "price",
        "discountPrice",
        "brand",
        "category",
        "sub_category",
        "gender",
        "material",
        "season",
        "is_new",
        "created_at",
        "color",
        "is_active",
      ],
    });

    const productsResponse = relatedProducts.map((product) => {
      const plainProduct = product.toJSON();
      let mainImage = null;
      if (plainProduct.images && plainProduct.images.length > 0) {
        mainImage = plainProduct.images[0].imageUrl;
      }
      return {
        ...plainProduct,
        image: mainImage,
        images: undefined,
      };
    });

    response.json(productsResponse);
  } catch (error) {
    console.error("Error en getRelatedProducts:", error);
    next(error);
  }
};
